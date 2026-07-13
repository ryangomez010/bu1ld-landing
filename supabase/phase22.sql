-- Phase 22 — evidence governance, contribution review integrity, and complete lifecycle controls.
-- Apply after phase21.sql.

-- Contribution verification is an explicit decision with a durable note. Leads cannot mutate a
-- contributor's authorship or content while reviewing it.
alter table public.project_contributions
  add column if not exists verification_note text
    check (verification_note is null or char_length(verification_note) <= 2000);

create or replace function public.guard_project_contribution_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if current_setting('app.contribution_review', true) = 'true'
     or current_setting('app.contribution_resubmit', true) = 'true' then
    return new;
  end if;
  if new.contributor_id = auth.uid() then
    if old.contributor_id <> new.contributor_id
      or old.project_id <> new.project_id
      or old.milestone_id is distinct from new.milestone_id
      or old.visibility <> new.visibility
      or old.verification_status <> new.verification_status
      or old.verification_note is distinct from new.verification_note
      or old.verified_by is distinct from new.verified_by
      or old.verified_at is distinct from new.verified_at then
      raise exception 'Contributors may only revise their submitted content';
    end if;
  end if;
  return new;
end;
$$;

drop policy if exists "Contributors update drafts and leads verify" on public.project_contributions;
drop policy if exists "Contributors revise own submissions" on public.project_contributions;
create policy "Contributors revise own submissions" on public.project_contributions for update
  using (contributor_id = auth.uid())
  with check (contributor_id = auth.uid());

create or replace function public.review_project_contribution(
  p_contribution_id uuid,
  p_status text,
  p_note text default null
)
returns public.project_contributions
language plpgsql
security definer
set search_path = public
as $$
declare contribution_row public.project_contributions;
declare safe_note text := nullif(trim(coalesce(p_note, '')), '');
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if p_status not in ('verified', 'needs_changes') then raise exception 'Invalid verification status'; end if;
  if safe_note is not null and char_length(safe_note) > 2000 then raise exception 'Verification note is too long'; end if;
  if p_status = 'needs_changes' and safe_note is null then raise exception 'A revision request requires a note'; end if;

  select * into contribution_row
  from public.project_contributions
  where id = p_contribution_id
  for update;
  if not found then raise exception 'Contribution not found'; end if;
  if not exists (
    select 1 from public.projects p
    where p.id = contribution_row.project_id and p.lead_id = auth.uid()
  ) and not exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  ) then
    raise exception 'Only the project lead or an administrator may review contributions';
  end if;

  perform set_config('app.contribution_review', 'true', true);
  update public.project_contributions
  set verification_status = p_status,
      verification_note = safe_note,
      verified_by = auth.uid(),
      verified_at = now(),
      updated_at = now()
  where id = p_contribution_id
  returning * into contribution_row;
  return contribution_row;
end;
$$;

revoke all on function public.review_project_contribution(uuid, text, text) from public;
grant execute on function public.review_project_contribution(uuid, text, text) to authenticated;

create or replace function public.resubmit_project_contribution(p_contribution_id uuid)
returns public.project_contributions
language plpgsql
security definer
set search_path = public
as $$
declare contribution_row public.project_contributions;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  perform set_config('app.contribution_resubmit', 'true', true);
  update public.project_contributions
  set verification_status = 'submitted',
      verification_note = null,
      verified_by = null,
      verified_at = null,
      updated_at = now()
  where id = p_contribution_id
    and contributor_id = auth.uid()
    and verification_status = 'needs_changes'
  returning * into contribution_row;
  if not found then raise exception 'Only your contribution awaiting changes can be resubmitted'; end if;
  return contribution_row;
end;
$$;

revoke all on function public.resubmit_project_contribution(uuid) from public;
grant execute on function public.resubmit_project_contribution(uuid) to authenticated;

-- Re-open is a valid editorial action. Moving an accepted application away from accepted removes
-- the active contributor membership atomically.
create or replace function public.review_project_application(
  p_application_id uuid,
  p_status text,
  p_note text default null
)
returns public.project_applications
language plpgsql
security definer
set search_path = public
as $$
declare app public.project_applications;
declare project_row public.projects;
declare safe_note text := nullif(trim(coalesce(p_note, '')), '');
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if p_status not in ('pending', 'accepted', 'declined', 'waitlist') then raise exception 'Invalid review status'; end if;
  if safe_note is not null and char_length(safe_note) > 2000 then raise exception 'Review note is too long'; end if;

  select * into app from public.project_applications where id = p_application_id for update;
  if not found then raise exception 'Application not found'; end if;
  select * into project_row from public.projects where id = app.project_id for update;
  if project_row.lead_id <> auth.uid()
     and not exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin') then
    raise exception 'Not authorized';
  end if;

  if p_status = 'accepted' and app.status <> 'accepted' then
    if (select count(*) from public.project_memberships pm where pm.project_id = app.project_id and pm.member_role = 'contributor' and pm.status in ('active', 'paused')) >= project_row.capacity then
      raise exception 'Project capacity has been reached';
    end if;
    insert into public.project_memberships (project_id, user_id, member_role, status)
    values (app.project_id, app.user_id, 'contributor', 'active')
    on conflict (project_id, user_id) do update set status = 'active', left_at = null;
  elsif app.status = 'accepted' and p_status <> 'accepted' then
    update public.project_memberships
    set status = 'removed', left_at = now()
    where project_id = app.project_id and user_id = app.user_id and member_role = 'contributor';
  end if;

  update public.project_applications
  set status = p_status,
      review_note = safe_note,
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      updated_at = now()
  where id = p_application_id
  returning * into app;
  return app;
end;
$$;

revoke all on function public.review_project_application(uuid, text, text) from public;
grant execute on function public.review_project_application(uuid, text, text) to authenticated;

-- Leads can intentionally pause, graduate, reactivate, or remove a collaborator without editing
-- application history. The RPC also enforces the required left_at invariant.
create or replace function public.set_project_membership_status(
  p_project_id uuid,
  p_user_id uuid,
  p_status text
)
returns public.project_memberships
language plpgsql
security definer
set search_path = public
as $$
declare membership_row public.project_memberships;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if p_status not in ('active', 'paused', 'alumni', 'removed') then raise exception 'Invalid membership status'; end if;
  if not exists (select 1 from public.projects p where p.id = p_project_id and p.lead_id = auth.uid())
     and not exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin') then
    raise exception 'Not authorized';
  end if;
  update public.project_memberships
  set status = p_status,
      left_at = case when p_status in ('alumni', 'removed') then now() else null end
  where project_id = p_project_id and user_id = p_user_id and member_role <> 'lead'
  returning * into membership_row;
  if not found then raise exception 'Membership not found'; end if;
  return membership_row;
end;
$$;

revoke all on function public.set_project_membership_status(uuid, uuid, text) from public;
grant execute on function public.set_project_membership_status(uuid, uuid, text) to authenticated;

-- Programme application windows remove ambiguity and are enforced at the database boundary.
alter table public.programs
  add column if not exists applications_open_at timestamptz,
  add column if not exists applications_close_at timestamptz,
  add column if not exists outcomes text check (outcomes is null or char_length(outcomes) <= 4000);
alter table public.programs drop constraint if exists programs_application_window_valid;
alter table public.programs add constraint programs_application_window_valid
  check (applications_close_at is null or applications_open_at is null or applications_close_at > applications_open_at);

drop policy if exists "Members apply to programs" on public.program_applications;
create policy "Members apply to programs" on public.program_applications for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.programs p
      where p.id = program_id
        and p.published = true
        and (p.applications_open_at is null or p.applications_open_at <= now())
        and (p.applications_close_at is null or p.applications_close_at > now())
    )
  );

drop policy if exists "Applicants withdraw pending program applications" on public.program_applications;
create policy "Applicants withdraw pending program applications" on public.program_applications for delete
  using (user_id = auth.uid() and status = 'pending');

-- Every public institutional claim has a durable primary source. This table is intentionally
-- separate from marketing copy so unverifiable statements cannot quietly become public facts.
create table if not exists public.institutional_claims (
  id uuid primary key default gen_random_uuid(),
  claim_type text not null check (claim_type in ('affiliation', 'publication', 'project_outcome', 'member_stat', 'program_outcome', 'other')),
  statement text not null check (char_length(trim(statement)) between 20 and 1000),
  context text check (context is null or char_length(context) <= 4000),
  evidence_url text not null check (evidence_url ~ '^https?://'),
  evidence_label text not null check (char_length(trim(evidence_label)) between 3 and 160),
  status text not null default 'draft' check (status in ('draft', 'verified', 'retired')),
  valid_until date,
  created_by uuid references public.profiles(id) on delete set null,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists institutional_claims_status_idx
  on public.institutional_claims (status, claim_type, updated_at desc);
alter table public.institutional_claims enable row level security;

drop policy if exists "Public reads verified institutional claims" on public.institutional_claims;
create policy "Public reads verified institutional claims" on public.institutional_claims for select
  using (
    (status = 'verified' and (valid_until is null or valid_until >= current_date))
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "Admins manage institutional claims" on public.institutional_claims;
create policy "Admins manage institutional claims" on public.institutional_claims for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create or replace function public.review_institutional_claim(
  p_claim_id uuid,
  p_status text
)
returns public.institutional_claims
language plpgsql
security definer
set search_path = public
as $$
declare claim_row public.institutional_claims;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if not exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin') then
    raise exception 'Administrator access required';
  end if;
  if p_status not in ('verified', 'retired') then raise exception 'Invalid claim status'; end if;
  update public.institutional_claims
  set status = p_status,
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      updated_at = now()
  where id = p_claim_id
  returning * into claim_row;
  if not found then raise exception 'Claim not found'; end if;
  return claim_row;
end;
$$;

revoke all on function public.review_institutional_claim(uuid, text) from public;
grant execute on function public.review_institutional_claim(uuid, text) to authenticated;

insert into public.schema_migrations (phase) values ('phase22') on conflict (phase) do nothing;
