-- The Bu1ld Supabase setup verification.
-- Run this in the Supabase SQL editor after applying supabase/FINAL_SETUP.sql.
-- Expected result: every row should have status = 'ok'. Any 'missing' or 'blocked' row is a setup failure.

with required_tables(table_name) as (
  values
    ('profiles'),
    ('events'),
    ('papers'),
    ('paper_analyses'),
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
  left join pg_class c on c.relname = rt.table_name
  left join pg_namespace n on n.oid = c.relnamespace and n.nspname = 'public'
  where c.oid is null or n.nspname = 'public'
),
required_rls(table_name) as (
  values
    ('profiles'),
    ('projects'),
    ('project_applications'),
    ('saved_items'),
    ('saved_collections'),
    ('notifications'),
    ('security_events'),
    ('admin_audit_log'),
    ('papers'),
    ('paper_analyses'),
    ('events'),
    ('jobs'),
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
    ('project_datasets')
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
  left join pg_class c on c.relname = rr.table_name
  left join pg_namespace n on n.oid = c.relnamespace and n.nspname = 'public'
  where c.oid is null or n.nspname = 'public'
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
    ('submit_project_application')
),
function_status as (
  select
    'function:' || rf.function_name as check_name,
    case when p.oid is null then 'missing' else 'ok' end as status
  from required_functions rf
  left join pg_proc p on p.proname = rf.function_name
  left join pg_namespace n on n.oid = p.pronamespace and n.nspname = 'public'
  where p.oid is null or n.nspname = 'public'
),
migration_status as (
  select
    'migration:phase' || phase_id as check_name,
    case
      when exists (select 1 from public.schema_migrations where phase = 'phase' || phase_id)
      then 'ok'
      else 'missing'
    end as status
  from (values (19), (20), (21), (22), (23), (24), (25), (26), (27), (28), (29), (30), (31), (32), (33)) as phases(phase_id)
)
select * from table_status
union all select * from rls_status
union all select * from function_status
union all select * from migration_status
order by check_name;
