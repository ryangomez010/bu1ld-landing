-- Phase 31 — Authorization integrity for competitions, invitations, deliverables,
-- contributions, memberships, and program seed catalog.
-- Additive. Apply after phase30.sql.

-- ── Competitions: submitters may withdraw; only admins decide accept/reject ──
drop policy if exists "Members manage own competition submissions" on public.competition_submissions;
drop policy if exists "Admins review competition submissions" on public.competition_submissions;

create policy "Members read own competition submissions" on public.competition_submissions
  for select
  to authenticated
  using (
    submitter_id = auth.uid()
    or public.is_platform_admin()
  );

create policy "Members submit to open competitions" on public.competition_submissions
  for insert
  to authenticated
  with check (
    submitter_id = auth.uid()
    and exists (
      select 1 from public.competitions c
      where c.id = competition_id
        and c.published = true
        and c.status = 'open'
    )
  );

create policy "Members withdraw own competition submissions" on public.competition_submissions
  for update
  to authenticated
  using (submitter_id = auth.uid() and status = 'submitted')
  with check (submitter_id = auth.uid() and status = 'withdrawn');

create or replace function public.review_competition_submission(
  p_submission_id uuid,
  p_status text,
  p_note text default null
)
returns public.competition_submissions
language plpgsql
security definer
set search_path = public
as $$
declare submission_row public.competition_submissions;
declare safe_note text := nullif(trim(coalesce(p_note, '')), '');
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if not public.is_platform_admin() then raise exception 'Administrator access required'; end if;
  if p_status not in ('accepted', 'rejected', 'submitted') then
    raise exception 'Invalid competition review status';
  end if;
  if safe_note is not null and char_length(safe_note) > 4000 then
    raise exception 'Review note is too long';
  end if;

  update public.competition_submissions
  set status = p_status,
      review_note = safe_note,
      updated_at = now()
  where id = p_submission_id
  returning * into submission_row;
  if not found then raise exception 'Submission not found'; end if;
  return submission_row;
end;
$$;

revoke all on function public.review_competition_submission(uuid, text, text) from public;
grant execute on function public.review_competition_submission(uuid, text, text) to authenticated;

-- ── Invitations: direct accept blocked; accept_invitation remains the only path ──
create or replace function public.guard_invitation_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_setting('app.invitation_accept', true) = 'true' then
    return new;
  end if;

  if new.status = 'accepted' and old.status is distinct from 'accepted' then
    raise exception 'Accept invitations through accept_invitation';
  end if;

  if auth.uid() is null then raise exception 'Not authenticated'; end if;

  if public.is_platform_admin() then
    return new;
  end if;

  if old.invited_by = auth.uid() then
    if new.status not in ('pending', 'revoked') then
      raise exception 'Inviters may only revoke pending invitations';
    end if;
    if new.target_id is distinct from old.target_id
       or new.role_offered is distinct from old.role_offered
       or new.invitation_type is distinct from old.invitation_type then
      raise exception 'Invitation target fields are immutable';
    end if;
    return new;
  end if;

  if old.invitee_id = auth.uid()
     or lower(coalesce(old.email, '')) = lower(coalesce(auth.jwt() ->> 'email', '')) then
    if new.status <> 'declined' or old.status <> 'pending' then
      raise exception 'Invitees may only decline pending invitations';
    end if;
    if new.target_id is distinct from old.target_id
       or new.role_offered is distinct from old.role_offered then
      raise exception 'Invitation target fields are immutable';
    end if;
    return new;
  end if;

  raise exception 'Not authorized to update this invitation';
end;
$$;

drop trigger if exists guard_invitation_update_trigger on public.invitations;
create trigger guard_invitation_update_trigger
  before update on public.invitations
  for each row execute function public.guard_invitation_update();

create or replace function public.accept_invitation(p_invitation_id uuid)
returns public.invitations
language plpgsql
security definer
set search_path = public
as $$
declare
  inv public.invitations;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  select * into inv from public.invitations where id = p_invitation_id for update;
  if not found then raise exception 'Invitation not found'; end if;
  if inv.invitee_id is distinct from auth.uid()
     and lower(coalesce(inv.email, '')) <> lower(coalesce(auth.jwt() ->> 'email', ''))
     and not public.is_platform_admin() then
    raise exception 'Not authorized';
  end if;
  if inv.status <> 'pending' then raise exception 'Invitation is not pending'; end if;
  if inv.expires_at < now() then
    update public.invitations set status = 'expired' where id = inv.id;
    raise exception 'Invitation expired';
  end if;

  if inv.invitation_type = 'project' then
    insert into public.project_memberships (project_id, user_id, member_role, status)
    values (inv.target_id, coalesce(inv.invitee_id, auth.uid()), inv.role_offered, 'active')
    on conflict (project_id, user_id) do update
      set status = 'active', member_role = excluded.member_role, left_at = null;
  elsif inv.invitation_type = 'lab' then
    insert into public.lab_memberships (lab_id, user_id, member_role, status)
    values (inv.target_id, coalesce(inv.invitee_id, auth.uid()), inv.role_offered, 'active')
    on conflict (lab_id, user_id) do update
      set status = 'active', member_role = excluded.member_role;
  end if;

  perform set_config('app.invitation_accept', 'true', true);
  update public.invitations
    set status = 'accepted',
        accepted_at = now(),
        invitee_id = coalesce(invitee_id, auth.uid())
    where id = inv.id
    returning * into inv;
  return inv;
end;
$$;

revoke all on function public.accept_invitation(uuid) from public;
grant execute on function public.accept_invitation(uuid) to authenticated;

-- ── Deliverables: authors revise content; only leads/admins decide status ──
create or replace function public.guard_project_deliverable_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare is_lead boolean;
begin
  if current_setting('app.deliverable_review', true) = 'true' then
    return new;
  end if;

  select exists (
    select 1 from public.projects p
    where p.id = old.project_id and p.lead_id = auth.uid()
  ) or public.is_platform_admin() into is_lead;

  if coalesce(is_lead, false) then
    return new;
  end if;

  if old.submitted_by = auth.uid() then
    if new.status is distinct from old.status
       and not (old.status in ('draft', 'changes_requested') and new.status = 'submitted')
       and not (old.status = 'submitted' and new.status = 'draft') then
      raise exception 'Deliverable status changes require a project lead';
    end if;
    if new.review_note is distinct from old.review_note
       or new.reviewed_by is distinct from old.reviewed_by then
      raise exception 'Deliverable review fields require a project lead';
    end if;
    return new;
  end if;

  raise exception 'Not authorized to update this deliverable';
end;
$$;

drop trigger if exists guard_project_deliverable_update_trigger on public.project_deliverables;
create trigger guard_project_deliverable_update_trigger
  before update on public.project_deliverables
  for each row execute function public.guard_project_deliverable_update();

create or replace function public.review_project_deliverable(
  p_deliverable_id uuid,
  p_status text,
  p_note text default null
)
returns public.project_deliverables
language plpgsql
security definer
set search_path = public
as $$
declare deliverable_row public.project_deliverables;
declare safe_note text := nullif(trim(coalesce(p_note, '')), '');
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if p_status not in ('accepted', 'changes_requested', 'submitted') then
    raise exception 'Invalid deliverable review status';
  end if;
  if safe_note is not null and char_length(safe_note) > 4000 then
    raise exception 'Review note is too long';
  end if;

  select * into deliverable_row from public.project_deliverables where id = p_deliverable_id for update;
  if not found then raise exception 'Deliverable not found'; end if;
  if not public.is_platform_admin()
     and not exists (
       select 1 from public.projects p
       where p.id = deliverable_row.project_id and p.lead_id = auth.uid()
     ) then
    raise exception 'Not authorized';
  end if;

  perform set_config('app.deliverable_review', 'true', true);
  update public.project_deliverables
  set status = p_status,
      review_note = safe_note,
      reviewed_by = auth.uid(),
      updated_at = now()
  where id = p_deliverable_id
  returning * into deliverable_row;
  return deliverable_row;
end;
$$;

revoke all on function public.review_project_deliverable(uuid, text, text) from public;
grant execute on function public.review_project_deliverable(uuid, text, text) to authenticated;

-- ── Contributions: drop broad lead UPDATE; assignment stays on the RPC ──
drop policy if exists "Leads assign contribution reviewers" on public.project_contributions;

-- ── Memberships: leads may read; status changes via RPC only ──
drop policy if exists "Leads manage project memberships" on public.project_memberships;
create policy "Leads read project memberships" on public.project_memberships
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from public.projects p where p.id = project_id and p.lead_id = auth.uid())
    or public.is_platform_admin()
  );

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
  if p_status not in ('active', 'paused', 'alumni', 'removed') then
    raise exception 'Invalid membership status';
  end if;
  if not public.is_platform_admin()
     and not exists (
       select 1 from public.projects p
       where p.id = p_project_id and p.lead_id = auth.uid()
     ) then
    raise exception 'Not authorized';
  end if;

  update public.project_memberships
  set status = p_status,
      left_at = case when p_status in ('removed', 'alumni') then now() else null end
  where project_id = p_project_id and user_id = p_user_id
  returning * into membership_row;
  if not found then raise exception 'Membership not found'; end if;
  return membership_row;
end;
$$;

revoke all on function public.set_project_membership_status(uuid, uuid, text) from public;
grant execute on function public.set_project_membership_status(uuid, uuid, text) to authenticated;

-- ── Application answers only while the application is still pending ──
drop policy if exists "Applicants insert answers" on public.project_application_answers;
create policy "Applicants insert answers" on public.project_application_answers
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.project_applications a
      join public.project_application_questions q on q.id = question_id
      where a.id = application_id
        and a.user_id = auth.uid()
        and a.status = 'pending'
        and q.project_id = a.project_id
    )
  );

grant update on table public.project_application_answers to authenticated;
drop policy if exists "Applicants revise pending answers" on public.project_application_answers;
create policy "Applicants revise pending answers" on public.project_application_answers
  for update
  to authenticated
  using (
    exists (
      select 1 from public.project_applications a
      where a.id = application_id and a.user_id = auth.uid() and a.status = 'pending'
    )
  )
  with check (
    exists (
      select 1 from public.project_applications a
      where a.id = application_id and a.user_id = auth.uid() and a.status = 'pending'
    )
  );

-- ── Claims: evidence URL required server-side at verify time ──
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
  if not public.is_platform_admin() then raise exception 'Administrator access required'; end if;
  if p_status not in ('verified', 'retired') then
    raise exception 'Invalid claim review status';
  end if;

  select * into claim_row from public.institutional_claims where id = p_claim_id for update;
  if not found then raise exception 'Claim not found'; end if;

  if p_status = 'verified' then
    if claim_row.evidence_url is null
       or claim_row.evidence_url !~* '^https?://'
       or char_length(trim(coalesce(claim_row.evidence_label, ''))) < 2 then
      raise exception 'Verified claims require an https evidence URL and label';
    end if;
  end if;

  update public.institutional_claims
  set status = p_status,
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      updated_at = now()
  where id = p_claim_id
  returning * into claim_row;
  return claim_row;
end;
$$;

revoke all on function public.review_institutional_claim(uuid, text) from public;
grant execute on function public.review_institutional_claim(uuid, text) to authenticated;

-- ── Published projects: keep experiments/datasets collaborator-scoped ──
drop policy if exists "Collaborators read project experiments" on public.project_experiments;
create policy "Collaborators read project experiments" on public.project_experiments
  for select
  to authenticated
  using (
    public.is_platform_admin()
    or exists (select 1 from public.projects p where p.id = project_id and p.lead_id = auth.uid())
    or exists (
      select 1 from public.project_memberships pm
      where pm.project_id = project_experiments.project_id
        and pm.user_id = auth.uid()
        and pm.status in ('active', 'paused')
    )
  );

drop policy if exists "Collaborators read project datasets" on public.project_datasets;
create policy "Collaborators read project datasets" on public.project_datasets
  for select
  to authenticated
  using (
    public.is_platform_admin()
    or exists (select 1 from public.projects p where p.id = project_id and p.lead_id = auth.uid())
    or exists (
      select 1 from public.project_memberships pm
      where pm.project_id = project_datasets.project_id
        and pm.user_id = auth.uid()
        and pm.status in ('active', 'paused')
    )
  );

-- ── Seed institution program cycles so public CTAs resolve to applyable rows ──
insert into public.programs (
  slug, title, program_type, summary, application_instructions,
  capacity, applications_open_at, applications_close_at, outcomes, published
)
values
  (
    'research-fellowship',
    'Research Fellowship',
    'fellowship',
    'A structured research cycle: clarify a question, run disciplined experiments, and leave a public project record with evidence, limitations, and next decisions.',
    'Submit a 40+ character statement covering the question you would pursue, relevant prior work, and weekly availability.',
    12,
    now() - interval '1 day',
    now() + interval '90 days',
    'Scoped research charter; milestone and contribution history; optional research note; demo or written postmortem.',
    true
  ),
  (
    'startup-incubation',
    'Startup Incubation',
    'incubation',
    'For builders testing whether a technical thread deserves a product prototype and early user conversations — not a fundraising narrative.',
    'Describe the product claim, current prototype state, kill criteria, and founding-team commitment.',
    8,
    now() - interval '1 day',
    now() + interval '90 days',
    'Working prototype; evaluator sessions; go / pivot / stop decision memo.',
    true
  ),
  (
    'ai-builder-cohort',
    'AI Builder Cohort',
    'cohort',
    'A project-driven cohort that turns a scoped technical question into a reproducible prototype, clear documentation, and a final demo.',
    'Name the prototype you intend to ship in 12 weeks and the skills you bring to weekly demos.',
    24,
    now() - interval '1 day',
    now() + interval '90 days',
    'Weekly shipping cadence; peer review of demos; final demo day artifact.',
    true
  )
on conflict (slug) do update
set title = excluded.title,
    program_type = excluded.program_type,
    summary = excluded.summary,
    application_instructions = excluded.application_instructions,
    capacity = excluded.capacity,
    applications_open_at = excluded.applications_open_at,
    applications_close_at = excluded.applications_close_at,
    outcomes = excluded.outcomes,
    published = true,
    updated_at = now();

insert into public.schema_migrations (phase)
values ('phase31')
on conflict (phase) do nothing;
