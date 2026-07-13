-- Phase 21 — publication governance, programme decisions, and institutional roles.
-- Apply after phase20.sql. This migration closes the remaining client-side moderation gaps.

-- A project listing is a reviewed institutional opportunity, not an automatically public post.
alter table public.projects
  add column if not exists publication_status text not null default 'published'
    check (publication_status in ('draft', 'submitted', 'changes_requested', 'published', 'archived')),
  add column if not exists publication_note text
    check (publication_note is null or char_length(publication_note) <= 2000),
  add column if not exists published_by uuid references public.profiles(id) on delete set null,
  add column if not exists published_at timestamptz;

update public.projects
set publication_status = case when published then 'published' else 'draft' end
where publication_status = 'published' and published is false;

-- Institutional project-lead grants are operational, not merely decorative: they authorize
-- draft creation alongside the legacy primary role.
drop policy if exists "Leads and admins insert projects" on public.projects;
create policy "Leads and admins insert projects" on public.projects for insert
  with check (
    public.has_institution_role(auth.uid(), 'project_lead')
    and (lead_id is null or lead_id = auth.uid()
      or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  );

-- A client cannot submit an application to a private, closed, or non-existent project merely by
-- guessing its UUID. Capacity is still enforced atomically at the acceptance decision.
drop policy if exists "Members apply to projects" on public.project_applications;
create policy "Members apply to projects" on public.project_applications for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.projects p
      where p.id = project_id and p.published = true and p.status = 'open'
    )
  );

-- A lead can edit a brief, but only an administrator can make it public or change its review state.
create or replace function public.guard_project_publication()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare is_admin boolean;
begin
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin') into is_admin;
  if tg_op = 'INSERT' then
    if not coalesce(is_admin, false) then
      new.published := false;
      new.publication_status := 'draft';
      new.publication_note := null;
      new.published_by := null;
      new.published_at := null;
    end if;
    return new;
  end if;

  if not coalesce(is_admin, false) and current_setting('app.project_publication_submit', true) is distinct from 'true' and (
    new.published is distinct from old.published
    or new.publication_status is distinct from old.publication_status
    or new.publication_note is distinct from old.publication_note
    or new.published_by is distinct from old.published_by
    or new.published_at is distinct from old.published_at
  ) then
    raise exception 'Project publication decisions require an administrator';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_project_publication_trigger on public.projects;
create trigger guard_project_publication_trigger
  before insert or update on public.projects
  for each row execute function public.guard_project_publication();

create or replace function public.submit_project_for_review(p_project_id uuid)
returns public.projects
language plpgsql
security definer
set search_path = public
as $$
declare project_row public.projects;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  select * into project_row from public.projects where id = p_project_id for update;
  if not found then raise exception 'Project not found'; end if;
  if project_row.lead_id <> auth.uid()
     and not exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin') then
    raise exception 'Not authorized';
  end if;
  if char_length(trim(project_row.description)) < 80
     or cardinality(project_row.skills_needed) = 0
     or cardinality(project_row.tags) = 0 then
    raise exception 'Add an 80-character brief, at least one skill, and at least one topic before submitting';
  end if;
  perform set_config('app.project_publication_submit', 'true', true);
  update public.projects
  set published = false,
      publication_status = 'submitted',
      publication_note = null,
      published_by = null,
      published_at = null,
      updated_at = now()
  where id = p_project_id
  returning * into project_row;
  return project_row;
end;
$$;

create or replace function public.review_project_publication(
  p_project_id uuid,
  p_decision text,
  p_note text default null
)
returns public.projects
language plpgsql
security definer
set search_path = public
as $$
declare project_row public.projects;
declare safe_note text := nullif(trim(coalesce(p_note, '')), '');
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if not exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin') then
    raise exception 'Administrator access required';
  end if;
  if p_decision not in ('published', 'changes_requested', 'archived') then
    raise exception 'Invalid publication decision';
  end if;
  if safe_note is not null and char_length(safe_note) > 2000 then raise exception 'Publication note is too long'; end if;

  update public.projects
  set published = p_decision = 'published',
      publication_status = p_decision,
      publication_note = safe_note,
      published_by = auth.uid(),
      published_at = case when p_decision = 'published' then now() else null end,
      updated_at = now()
  where id = p_project_id
  returning * into project_row;
  if not found then raise exception 'Project not found'; end if;
  return project_row;
end;
$$;

revoke all on function public.submit_project_for_review(uuid) from public;
revoke all on function public.review_project_publication(uuid, text, text) from public;
grant execute on function public.submit_project_for_review(uuid) to authenticated;
grant execute on function public.review_project_publication(uuid, text, text) to authenticated;

-- Programme decisions are atomic, capacity-aware, and return a private note to the applicant.
alter table public.program_applications
  add column if not exists review_note text
    check (review_note is null or char_length(review_note) <= 2000),
  add column if not exists reviewed_by uuid references public.profiles(id) on delete set null,
  add column if not exists reviewed_at timestamptz;

-- Private programme IDs must not be a backdoor into an unpublished application cycle.
drop policy if exists "Members apply to programs" on public.program_applications;
create policy "Members apply to programs" on public.program_applications for insert
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.programs p where p.id = program_id and p.published = true)
  );

create or replace function public.guard_program_application_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin') then return new; end if;
  raise exception 'Programme decisions require an administrator';
end;
$$;

drop trigger if exists guard_program_application_update_trigger on public.program_applications;
create trigger guard_program_application_update_trigger
  before update on public.program_applications
  for each row execute function public.guard_program_application_update();

create or replace function public.review_program_application(
  p_application_id uuid,
  p_status text,
  p_note text default null
)
returns public.program_applications
language plpgsql
security definer
set search_path = public
as $$
declare app public.program_applications;
declare program_row public.programs;
declare safe_note text := nullif(trim(coalesce(p_note, '')), '');
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if not exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin') then
    raise exception 'Administrator access required';
  end if;
  if p_status not in ('accepted', 'declined', 'waitlist') then raise exception 'Invalid review status'; end if;
  if safe_note is not null and char_length(safe_note) > 2000 then raise exception 'Review note is too long'; end if;

  select * into app from public.program_applications where id = p_application_id for update;
  if not found then raise exception 'Application not found'; end if;
  select * into program_row from public.programs where id = app.program_id for update;
  if p_status = 'accepted' and app.status <> 'accepted' and program_row.capacity is not null
     and (select count(*) from public.program_applications where program_id = app.program_id and status = 'accepted') >= program_row.capacity then
    raise exception 'Programme capacity has been reached';
  end if;
  update public.program_applications
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

revoke all on function public.review_program_application(uuid, text, text) from public;
grant execute on function public.review_program_application(uuid, text, text) to authenticated;

-- Preserve at least one operational administrator. This avoids accidentally locking the institution
-- out of its own moderation controls.
create or replace function public.prevent_last_admin_removal()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role = 'admin' and (tg_op = 'DELETE' or new.role <> 'admin')
     and (select count(*) from public.profiles where role = 'admin') <= 1 then
    raise exception 'At least one administrator must remain';
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists prevent_last_admin_removal_trigger on public.profiles;
create trigger prevent_last_admin_removal_trigger
  before update of role or delete on public.profiles
  for each row execute function public.prevent_last_admin_removal();

-- Reviewer status grants a tightly-scoped way to create and revise unpublished analysis without
-- granting administrator powers. Published work still goes through the editorial queue.
drop policy if exists "Members read published papers" on public.papers;
create policy "Members read published papers" on public.papers for select
  using (
    auth.uid() is not null and (
      published = true
      or reviewer_id = auth.uid()
      or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
    )
  );

drop policy if exists "Reviewers submit paper drafts" on public.papers;
create policy "Reviewers submit paper drafts" on public.papers for insert
  with check (
    reviewer_id = auth.uid()
    and published = false
    and review_status = 'draft'
    and public.has_institution_role(auth.uid(), 'reviewer')
  );

drop policy if exists "Reviewers revise own paper drafts" on public.papers;
create policy "Reviewers revise own paper drafts" on public.papers for update
  using (reviewer_id = auth.uid() and public.has_institution_role(auth.uid(), 'reviewer'))
  with check (
    reviewer_id = auth.uid()
    and published = false
    and review_status in ('draft', 'in_review')
    and public.has_institution_role(auth.uid(), 'reviewer')
  );

insert into public.schema_migrations (phase) values ('phase21') on conflict (phase) do nothing;
