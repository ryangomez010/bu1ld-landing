-- The Bu1ld Supabase setup verification.
-- Run this in the Supabase SQL editor after applying supabase/FINAL_SETUP.sql.
-- Expected result: every row should have status = 'ok'. Any 'missing' or 'blocked' row is a setup failure.

with required_tables(table_name) as (
  values
    ('mentor_profiles'),
    ('mentorship_requests'),
    ('mentorship_sessions'),
    ('mentorship_feedback'),
    ('community_channels'),
    ('community_posts'),
    ('community_comments'),
    ('community_reactions'),
    ('profiles'),
    ('events'),
    ('papers'),
    ('paper_analyses'),
    ('paper_editorial_workflows'),
    ('paper_editorial_events'),
    ('newsletter_issues'),
    ('reading_progress'),
    ('projects'),
    ('project_applications'),
    ('lead_verification_requests'),
    ('jobs'),
    ('notifications'),
    ('saved_items'),
    ('announcements'),
    ('project_updates'),
    ('paper_reads'),
    ('event_rsvps'),
    ('event_registration_requests'),
    ('newsletter_subscriptions'),
    ('admin_audit_log'),
    ('saved_collections'),
    ('saved_collection_items'),
    ('security_events'),
    ('notification_preferences'),
    ('reading_activity'),
    ('paper_highlights'),
    ('project_follows'),
    ('skill_endorsements'),
    ('job_applications'),
    ('member_feedback'),
    ('content_reports'),
    ('member_preferences'),
    ('member_roles'),
    ('project_memberships'),
    ('project_milestones'),
    ('project_contributions'),
    ('programs'),
    ('program_applications'),
    ('institutional_claims'),
    ('labs'),
    ('lab_memberships'),
    ('competitions'),
    ('competition_submissions'),
    ('partnerships'),
    ('invitations'),
    ('project_experiments'),
    ('project_deliverables'),
    ('research_paths'),
    ('research_path_steps'),
    ('research_path_progress'),
    ('project_application_questions'),
    ('project_application_answers'),
    ('project_datasets'),
    ('schema_migrations')
),
table_status as (
  select
    'table:' || rt.table_name as check_name,
    case when c.oid is null then 'missing' else 'ok' end as status
  from required_tables rt
  left join pg_namespace n on n.nspname = 'public'
  left join pg_class c on c.relname = rt.table_name and c.relnamespace = n.oid and c.relkind in ('r', 'p')
),
required_rls(table_name) as (
  values
    ('mentor_profiles'),
    ('mentorship_requests'),
    ('mentorship_sessions'),
    ('mentorship_feedback'),
    ('community_channels'),
    ('community_posts'),
    ('community_comments'),
    ('community_reactions'),
    ('admin_audit_log'),
    ('announcements'),
    ('competition_submissions'),
    ('competitions'),
    ('content_reports'),
    ('event_rsvps'),
    ('event_registration_requests'),
    ('events'),
    ('institutional_claims'),
    ('invitations'),
    ('job_applications'),
    ('jobs'),
    ('lab_memberships'),
    ('labs'),
    ('lead_verification_requests'),
    ('member_feedback'),
    ('member_preferences'),
    ('member_roles'),
    ('newsletter_issues'),
    ('newsletter_subscriptions'),
    ('notification_preferences'),
    ('notifications'),
    ('paper_analyses'),
    ('paper_highlights'),
    ('paper_editorial_workflows'),
    ('paper_editorial_events'),
    ('paper_reads'),
    ('papers'),
    ('partnerships'),
    ('profiles'),
    ('program_applications'),
    ('programs'),
    ('project_application_answers'),
    ('project_application_questions'),
    ('project_applications'),
    ('project_contributions'),
    ('project_datasets'),
    ('project_deliverables'),
    ('project_experiments'),
    ('project_follows'),
    ('project_memberships'),
    ('project_milestones'),
    ('project_updates'),
    ('projects'),
    ('reading_activity'),
    ('reading_progress'),
    ('research_path_progress'),
    ('research_path_steps'),
    ('research_paths'),
    ('saved_collection_items'),
    ('saved_collections'),
    ('saved_items'),
    ('security_events'),
    ('skill_endorsements')
),
rls_status as (
  select
    'rls:' || rr.table_name as check_name,
    case
      when c.oid is null then 'missing'
      when c.relrowsecurity then 'ok'
      else 'blocked'
    end as status
  from required_rls rr
  left join pg_namespace n on n.nspname = 'public'
  left join pg_class c on c.relname = rr.table_name and c.relnamespace = n.oid and c.relkind in ('r', 'p')
),
required_functions(function_name) as (
  values
    ('review_project_application'),
    ('review_project_contribution'),
    ('resubmit_project_contribution'),
    ('set_project_membership_status'),
    ('review_institutional_claim'),
    ('accept_invitation'),
    ('assert_private_collaboration_tables'),
    ('review_competition_submission'),
    ('review_project_deliverable'),
    ('assign_contribution_reviewer'),
    ('submit_project_application'),
    ('is_project_collaborator'),
    ('set_event_registration'),
    ('validate_event_operations'),
    ('transition_paper_editorial'),
    ('guard_paper_editorial_publication')
),
function_status as (
  select
    'function:' || rf.function_name as check_name,
    case when p.oid is null then 'missing' else 'ok' end as status
  from required_functions rf
  left join pg_namespace n on n.nspname = 'public'
  left join pg_proc p on p.proname = rf.function_name and p.pronamespace = n.oid
),
event_security_status as (
  select 'event:private-columns-denied' as check_name,
    case when not has_column_privilege('anon', 'public.events', 'prep_notes', 'select')
      and not has_column_privilege('anon', 'public.events', 'resources', 'select') then 'ok' else 'blocked' end as status
  union all
  select 'event:direct-registration-writes-denied',
    case when not has_table_privilege('authenticated', 'public.event_rsvps', 'insert')
      and not has_table_privilege('authenticated', 'public.event_rsvps', 'update')
      and not has_table_privilege('authenticated', 'public.event_rsvps', 'delete')
      and not has_table_privilege('anon', 'public.event_rsvps', 'select') then 'ok' else 'blocked' end
  union all
  select 'event:request-log-private',
    case when not has_table_privilege('anon', 'public.event_registration_requests', 'select')
      and not has_table_privilege('authenticated', 'public.event_registration_requests', 'select') then 'ok' else 'blocked' end
),
migration_status as (
  select
    'migration:phase' || phase_id as check_name,
    case
      when exists (select 1 from public.schema_migrations where phase = 'phase' || phase_id)
      then 'ok'
      else 'missing'
    end as status
  from (values (19), (20), (21), (22), (23), (24), (25), (26), (27), (28), (29), (30), (31), (32), (33), (34), (35), (36), (37), (38), (39), (40)) as phases(phase_id)
),
paper_editorial_security as (
  select 'paper:editorial-records-private' as check_name,
    case when not has_table_privilege('anon', 'public.paper_editorial_workflows', 'select')
      and not has_table_privilege('anon', 'public.paper_editorial_events', 'select') then 'ok' else 'blocked' end as status
  union all
  select 'paper:workflow-writes-rpc-only',
    case when not has_table_privilege('authenticated', 'public.paper_editorial_workflows', 'insert,update,delete')
      and not has_table_privilege('authenticated', 'public.paper_editorial_events', 'insert,update,delete')
      and not has_function_privilege('anon', 'public.transition_paper_editorial(uuid,text,text,uuid,jsonb)', 'execute') then 'ok' else 'blocked' end
  union all
  select 'paper:publication-guard-enabled',
    case when exists (select 1 from pg_trigger where tgrelid = 'public.papers'::regclass
      and tgname = 'guard_paper_editorial_publication_trigger' and tgenabled = 'O') then 'ok' else 'blocked' end
),
definer_security_status as (
  select 'definer:notification-helper-private' as check_name,
    case when not has_function_privilege('anon', 'public.can_notify_project_subscriber(uuid,uuid,uuid)', 'execute')
      and not has_function_privilege('authenticated', 'public.can_notify_project_subscriber(uuid,uuid,uuid)', 'execute')
      then 'ok' else 'blocked' end as status
  union all
  select 'definer:authenticated-rpcs-not-anonymous',
    case when not has_function_privilege('anon', 'public.notify_users(uuid[],text,text,text,uuid)', 'execute')
      and not has_function_privilege('anon', 'public.get_project_update_subscribers(uuid)', 'execute')
      and not has_function_privilege('anon', 'public.increment_reading_activity(uuid,date)', 'execute')
      and not has_function_privilege('anon', 'public.has_institution_role(uuid,text)', 'execute')
      and not has_function_privilege('anon', 'public.request_account_deletion()', 'execute')
      and has_function_privilege('authenticated', 'public.notify_users(uuid[],text,text,text,uuid)', 'execute')
      and has_function_privilege('authenticated', 'public.request_account_deletion()', 'execute')
      then 'ok' else 'blocked' end
  union all
  select 'definer:trigger-functions-private',
    case when not has_function_privilege('anon', 'public.protect_profile_role()', 'execute')
      and not has_function_privilege('authenticated', 'public.protect_profile_role()', 'execute')
      and not has_function_privilege('anon', 'public.validate_event_operations()', 'execute')
      and not has_function_privilege('authenticated', 'public.validate_event_operations()', 'execute')
      and not has_function_privilege('anon', 'public.guard_paper_editorial_publication()', 'execute')
      and not has_function_privilege('authenticated', 'public.guard_paper_editorial_publication()', 'execute')
      then 'ok' else 'blocked' end
  union all
  select 'definer:remaining-trigger-functions-private',
    case when not has_function_privilege('anon', 'public.handle_new_user()', 'execute')
      and not has_function_privilege('authenticated', 'public.handle_new_user()', 'execute')
      and not has_function_privilege('anon', 'public.promote_event_waitlist(uuid)', 'execute')
      and not has_function_privilege('authenticated', 'public.promote_event_waitlist(uuid)', 'execute')
      then 'ok' else 'blocked' end
  union all
  select 'notifications:internal-href-check',
    case when exists (
      select 1 from pg_constraint
      where conrelid = 'public.notifications'::regclass
        and conname = 'notifications_safe_href_check'
        and convalidated
    ) then 'ok' else 'blocked' end
),
member_feature_security as (
  select 'member-feature:private:' || name as check_name,
    case when to_regclass('public.' || name) is null then 'missing'
      when not has_table_privilege('anon', to_regclass('public.' || name), 'select,insert,update,delete')
        and not has_any_column_privilege('anon', to_regclass('public.' || name), 'select,insert,update')
        and has_table_privilege('authenticated', to_regclass('public.' || name), 'select')
      then 'ok' else 'blocked' end as status
  from (values ('mentor_profiles'), ('mentorship_requests'), ('mentorship_sessions'), ('mentorship_feedback'), ('community_channels'), ('community_posts'), ('community_comments'), ('community_reactions')) as tables(name)
  union all
  select 'member-feature:guard:' || name,
    case when exists (select 1 from pg_trigger where tgname = name and tgenabled = 'O'
      and tgrelid = to_regclass('public.' || table_name)) then 'ok' else 'missing' end
  from (values
    ('guard_mentor_profile_update_trigger', 'mentor_profiles'),
    ('guard_mentorship_decision_trigger', 'mentorship_requests'),
    ('guard_community_post_update_trigger', 'community_posts')) as guards(name, table_name)
  union all
  select 'member-feature:parent-policy:' || table_name,
    case when exists (select 1 from pg_policies p where p.schemaname = 'public'
      and p.tablename = table_name and p.policyname = policy_name and p.permissive = 'RESTRICTIVE'
      and p.cmd = 'ALL' and p.roles = array['authenticated']::name[]) then 'ok' else 'missing' end
  from (values
    ('community_posts', 'Community posts require a published channel'),
    ('community_comments', 'Community comments require a published post'),
    ('community_reactions', 'Community reactions require a published post')) as policies(table_name, policy_name)
  union all
  select 'member-feature:trigger-private:' || name,
    case when to_regprocedure('public.' || name || '()') is null then 'missing'
      when not has_function_privilege('anon', to_regprocedure('public.' || name || '()'), 'execute')
        and not has_function_privilege('authenticated', to_regprocedure('public.' || name || '()'), 'execute')
      then 'ok' else 'blocked' end
  from (values ('guard_mentor_profile_update'), ('guard_mentorship_decision'), ('guard_community_post_update')) as functions(name)
  union all
  select 'member-feature:immutable-request-columns',
    case when to_regclass('public.mentorship_requests') is null then 'missing'
      when not has_column_privilege('authenticated', to_regclass('public.mentorship_requests'), 'requester_id', 'update')
        and not has_column_privilege('authenticated', to_regclass('public.mentorship_requests'), 'mentor_id', 'update')
        and not has_column_privilege('authenticated', to_regclass('public.mentorship_requests'), 'goal', 'update')
        and has_column_privilege('authenticated', to_regclass('public.mentorship_requests'), 'status', 'update')
      then 'ok' else 'blocked' end
)
select * from table_status
union all select * from rls_status
union all select * from function_status
union all select * from event_security_status
union all select * from migration_status
union all select * from paper_editorial_security
union all select * from definer_security_status
union all select * from member_feature_security
order by check_name;
