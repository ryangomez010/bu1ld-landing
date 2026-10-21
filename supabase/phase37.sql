-- Phase 37: close SECURITY DEFINER execution leaks and bind identity helpers to the caller.
-- Additive hardening migration. Apply after phase36.sql.
begin;

-- This helper bypasses RLS for an internal relationship check. A caller may never
-- impersonate a project lead by supplying another user's ID.
create or replace function public.can_notify_project_subscriber(
  caller_id uuid,
  p_project_id uuid,
  target_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select caller_id = (select auth.uid())
  and exists (
    select 1
    from public.projects pr
    where pr.id = p_project_id
      and (
        pr.lead_id = caller_id
        or exists (
          select 1 from public.project_applications pa
          where pa.project_id = p_project_id
            and pa.user_id = caller_id
            and pa.status = 'accepted'
        )
        or exists (
          select 1 from public.profiles p
          where p.id = caller_id and p.role = 'admin'
        )
      )
  )
  and (
    target_id = (select lead_id from public.projects where id = p_project_id)
    or exists (
      select 1 from public.project_follows pf
      where pf.project_id = p_project_id
        and pf.user_id = target_id
        and pf.notify_updates = true
    )
    or exists (
      select 1 from public.project_applications pa
      where pa.project_id = p_project_id
        and pa.user_id = target_id
        and pa.status = 'accepted'
    )
  );
$$;

-- The admin predicate remains callable by anonymous RLS policies, but an RPC caller
-- can only ask about their own JWT identity.
create or replace function public.is_platform_admin(uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select uid is not null
  and uid = (select auth.uid())
  and (
    exists (select 1 from public.profiles p where p.id = uid and p.role = 'admin')
    or exists (
      select 1 from public.member_roles mr
      where mr.user_id = uid and mr.role = 'administrator'
    )
  );
$$;

revoke all on function public.can_notify_project_subscriber(uuid, uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.notify_users(uuid[], text, text, text, uuid),
  public.get_project_update_subscribers(uuid),
  public.increment_reading_activity(uuid, date),
  public.has_institution_role(uuid, text),
  public.request_account_deletion()
  from public, anon, authenticated;
grant execute on function public.notify_users(uuid[], text, text, text, uuid),
  public.get_project_update_subscribers(uuid),
  public.increment_reading_activity(uuid, date),
  public.has_institution_role(uuid, text),
  public.request_account_deletion()
  to authenticated;

revoke all on function public.is_platform_admin(uuid) from public, anon, authenticated;
grant execute on function public.is_platform_admin(uuid) to anon, authenticated;

-- Trigger helpers have no direct API surface.
revoke all on function public.protect_profile_role(),
  public.default_profile_role(),
  public.create_lead_project_membership(),
  public.sync_project_team_count(),
  public.guard_project_application_update(),
  public.guard_project_contribution_update(),
  public.guard_project_publication(),
  public.guard_program_application_update(),
  public.prevent_last_admin_removal(),
  public.validate_project_brief(),
  public.guard_invitation_update(),
  public.guard_project_deliverable_update(),
  public.validate_event_operations(),
  public.refresh_event_waitlist(),
  public.guard_paper_editorial_publication(),
  public.initialize_paper_editorial_workflow()
  from public, anon, authenticated;

insert into public.schema_migrations (phase) values ('phase37')
on conflict (phase) do nothing;
commit;
