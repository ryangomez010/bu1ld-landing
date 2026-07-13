-- Phase 20 — private application integrity, event RSVP privacy, and operational guards.
-- Apply after phase19.sql. This migration replaces permissive legacy policies.

-- An applicant may refine or withdraw only their own pending application. Project leads
-- never receive a direct client-side status update; review_project_application is the only path.
drop policy if exists "Leads update application status" on public.project_applications;
drop policy if exists "Applicants update pending project applications" on public.project_applications;
create policy "Applicants update pending project applications"
  on public.project_applications for update
  using (user_id = auth.uid() and status = 'pending')
  with check (user_id = auth.uid() and status = 'pending');

drop policy if exists "Applicants withdraw pending project applications" on public.project_applications;
create policy "Applicants withdraw pending project applications"
  on public.project_applications for delete
  using (user_id = auth.uid() and status = 'pending');

-- RLS cannot compare OLD and NEW values. This trigger prevents an applicant from changing
-- project, applicant, or review status while still allowing a pending pitch correction.
create or replace function public.guard_project_application_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    return new;
  end if;
  if new.user_id = auth.uid() then
    if old.user_id <> new.user_id
      or old.project_id <> new.project_id
      or old.status <> new.status
      or old.status <> 'pending' then
      raise exception 'Applicants may only edit a pending pitch';
    end if;
    return new;
  end if;
  -- Direct lead writes are blocked by RLS. The review RPC runs as the lead and is permitted here.
  if exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    or exists (
    select 1 from public.projects p
    where p.id = old.project_id and p.lead_id = auth.uid()
  ) then
    return new;
  end if;
  raise exception 'Application reviews must use the review RPC';
end;
$$;

drop trigger if exists guard_project_application_update_trigger on public.project_applications;
create trigger guard_project_application_update_trigger
  before update on public.project_applications
  for each row execute function public.guard_project_application_update();

alter table public.project_applications
  add column if not exists review_note text check (review_note is null or char_length(review_note) <= 2000),
  add column if not exists reviewed_by uuid references public.profiles(id) on delete set null,
  add column if not exists reviewed_at timestamptz;

-- Apply review decisions atomically, including a member record and a private decision note.
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
declare
  app public.project_applications;
  project_row public.projects;
  safe_note text := nullif(trim(coalesce(p_note, '')), '');
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if p_status not in ('accepted', 'declined', 'waitlist') then raise exception 'Invalid review status'; end if;
  if safe_note is not null and char_length(safe_note) > 2000 then raise exception 'Review note is too long'; end if;

  select * into app from public.project_applications where id = p_application_id for update;
  if not found then raise exception 'Application not found'; end if;
  select * into project_row from public.projects where id = app.project_id for update;
  if project_row.lead_id <> auth.uid() and not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
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
    update public.project_memberships set status = 'removed', left_at = now()
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

-- RSVP rows reveal attendance patterns. Members may only read their own, while admins retain
-- operational visibility. Aggregated counts can be exposed later through a separate RPC.
drop policy if exists "Members read event rsvps" on public.event_rsvps;
drop policy if exists "Users read own event rsvps" on public.event_rsvps;
create policy "Users read own event rsvps"
  on public.event_rsvps for select
  using (
    user_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Prevent contributors from self-verifying or changing ownership/visibility after submission.
create or replace function public.guard_project_contribution_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if new.contributor_id = auth.uid() then
    if old.contributor_id <> new.contributor_id
      or old.project_id <> new.project_id
      or old.milestone_id is distinct from new.milestone_id
      or old.visibility <> new.visibility
      or old.verification_status <> new.verification_status
      or old.verified_by is distinct from new.verified_by
      or old.verified_at is distinct from new.verified_at then
      raise exception 'Contributors may only revise their submitted content';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_project_contribution_update_trigger on public.project_contributions;
create trigger guard_project_contribution_update_trigger
  before update on public.project_contributions
  for each row execute function public.guard_project_contribution_update();

-- Keep a lead membership record for projects created before collaboration tracking existed.
insert into public.project_memberships (project_id, user_id, member_role, status)
select p.id, p.lead_id, 'lead', 'active'
from public.projects p
where p.lead_id is not null
on conflict (project_id, user_id) do nothing;

-- New project leads are recorded atomically. The public team count continues to represent
-- accepted contributors, not the lead, so capacity is not reduced by the operator.
create or replace function public.create_lead_project_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.lead_id is not null then
    insert into public.project_memberships (project_id, user_id, member_role, status)
    values (new.id, new.lead_id, 'lead', 'active')
    on conflict (project_id, user_id) do update set member_role = 'lead', status = 'active', left_at = null;
  end if;
  return new;
end;
$$;

drop trigger if exists create_lead_project_membership_trigger on public.projects;
create trigger create_lead_project_membership_trigger
  after insert or update of lead_id on public.projects
  for each row execute function public.create_lead_project_membership();

-- Count contributor seats only; leads, reviewers, and mentors do not consume a seat.
create or replace function public.sync_project_team_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare affected_project uuid := coalesce(new.project_id, old.project_id);
begin
  update public.projects
  set team_count = (
    select count(*) from public.project_memberships pm
    where pm.project_id = affected_project
      and pm.member_role = 'contributor'
      and pm.status in ('active', 'paused')
  ), updated_at = now()
  where id = affected_project;
  return coalesce(new, old);
end;
$$;

drop trigger if exists sync_project_team_count_trigger on public.project_memberships;
create trigger sync_project_team_count_trigger
  after insert or update or delete on public.project_memberships
  for each row execute function public.sync_project_team_count();

insert into public.schema_migrations (phase) values ('phase20') on conflict (phase) do nothing;
