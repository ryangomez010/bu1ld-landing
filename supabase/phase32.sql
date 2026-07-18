-- phase32: contribution self-verify ban + leadership ops counters support
-- Extends review_project_contribution / assign_contribution_reviewer.

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

  -- Never allow the contributor to verify (or request changes on) their own submission,
  -- even if they are the project lead or a platform administrator.
  if contribution_row.contributor_id = auth.uid() then
    raise exception 'Contributors cannot review their own submissions';
  end if;

  if not (
    public.is_platform_admin()
    or exists (
      select 1 from public.projects p
      where p.id = contribution_row.project_id and p.lead_id = auth.uid()
    )
    or contribution_row.assigned_reviewer_id = auth.uid()
  ) then
    raise exception 'Only the project lead, assigned reviewer, or an administrator may review contributions';
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

create or replace function public.assign_contribution_reviewer(
  p_contribution_id uuid,
  p_reviewer_id uuid
)
returns public.project_contributions
language plpgsql
security definer
set search_path = public
as $$
declare contribution_row public.project_contributions;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;

  select * into contribution_row
  from public.project_contributions
  where id = p_contribution_id
  for update;
  if not found then raise exception 'Contribution not found'; end if;

  if not (
    public.is_platform_admin()
    or exists (
      select 1 from public.projects p
      where p.id = contribution_row.project_id and p.lead_id = auth.uid()
    )
  ) then
    raise exception 'Only the project lead or an administrator may assign reviewers';
  end if;

  if p_reviewer_id is not null and p_reviewer_id = contribution_row.contributor_id then
    raise exception 'Contributors cannot be assigned as reviewers of their own submissions';
  end if;

  if p_reviewer_id is not null and not exists (
    select 1 from public.profiles where id = p_reviewer_id
  ) then
    raise exception 'Reviewer profile not found';
  end if;

  update public.project_contributions
  set assigned_reviewer_id = p_reviewer_id,
      updated_at = now()
  where id = p_contribution_id
  returning * into contribution_row;
  return contribution_row;
end;
$$;

revoke all on function public.assign_contribution_reviewer(uuid, uuid) from public;
grant execute on function public.assign_contribution_reviewer(uuid, uuid) to authenticated;

insert into public.schema_migrations (phase) values ('phase32')
on conflict (phase) do nothing;
