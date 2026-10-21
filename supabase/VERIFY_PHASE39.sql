-- Superseded for release acceptance: apply phase40 and run VERIFY_SETUP.sql.
-- The queries below are historical phase39 inventory checks, not authorization evidence.
-- Run after phase39.sql in the intended Supabase SQL editor; retain the result with release evidence.
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('mentor_profiles', 'mentorship_requests', 'mentorship_sessions', 'mentorship_feedback', 'community_channels', 'community_posts', 'community_comments', 'community_reactions')
order by tablename;

select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('mentor_profiles', 'mentorship_requests', 'mentorship_sessions', 'mentorship_feedback', 'community_channels', 'community_posts', 'community_comments', 'community_reactions')
order by tablename, policyname;

select phase from public.schema_migrations where phase = 'phase39';

-- Required live role matrix (execute with separate sessions, not service role):
-- member: cannot insert mentor profile, cannot decide another member's request,
--         cannot read another mentorship pair's request/session/feedback;
-- mentor: can manage only own availability and decide only addressed pending requests;
-- admin: can read/moderate governed records; anonymous: sees none of these member tables.
