-- Phase 40: close phase39 authorization gaps without changing historical migrations.
begin;

-- Do not inherit Supabase's default table grants or PUBLIC policy roles.
do $$
declare entry record;
begin
  for entry in select tablename, policyname from pg_policies
    where schemaname = 'public' and tablename in (
      'mentor_profiles', 'mentorship_requests', 'mentorship_sessions', 'mentorship_feedback',
      'community_channels', 'community_posts', 'community_comments', 'community_reactions'
    )
  loop
    execute format('alter policy %I on public.%I to authenticated', entry.policyname, entry.tablename);
  end loop;
end;
$$;

revoke all on table public.mentor_profiles, public.mentorship_requests,
  public.mentorship_sessions, public.mentorship_feedback, public.community_channels,
  public.community_posts, public.community_comments, public.community_reactions
  from public, anon, authenticated;
grant select on table public.mentor_profiles, public.mentorship_requests,
  public.mentorship_sessions, public.mentorship_feedback, public.community_channels,
  public.community_posts, public.community_comments, public.community_reactions to authenticated;
grant insert (mentor_id, headline, expertise, availability_note, monthly_capacity, accepting_requests, visible),
  update (mentor_id, headline, expertise, availability_note, monthly_capacity, accepting_requests, visible)
  on public.mentor_profiles to authenticated;
grant insert (mentor_id, requester_id, topic, goal, availability_note),
  update (status, decision_note) on public.mentorship_requests to authenticated;
grant insert (request_id, scheduled_for, summary, follow_up, created_by)
  on public.mentorship_sessions to authenticated;
grant insert (session_id, author_id, rating, body) on public.mentorship_feedback to authenticated;
grant insert (slug, title, description, published), update (title, description, published)
  on public.community_channels to authenticated;
grant insert (channel_id, author_id, body), update (body, status)
  on public.community_posts to authenticated;
grant insert (post_id, author_id, body) on public.community_comments to authenticated;
grant insert (post_id, user_id, reaction), delete on public.community_reactions to authenticated;

create or replace function public.guard_mentor_profile_update()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.mentor_id is distinct from old.mentor_id or new.created_at is distinct from old.created_at then
    raise exception 'Mentor identity is immutable' using errcode = '23514';
  end if;
  new.updated_at := now();
  return new;
end;
$$;
create trigger guard_mentor_profile_update_trigger before update on public.mentor_profiles
  for each row execute function public.guard_mentor_profile_update();
revoke all on function public.guard_mentor_profile_update() from public, anon, authenticated;

alter policy "Mentors create own availability" on public.mentor_profiles
  with check (mentor_id = (select auth.uid()) and (
    public.has_institution_role((select auth.uid()), 'mentor')
    or public.has_institution_role((select auth.uid()), 'lab_lead') or public.is_platform_admin()));

-- Revoking a mentor role also revokes availability writes and request decisions.
alter policy "Mentors update own availability" on public.mentor_profiles
  using ((mentor_id = (select auth.uid()) and (public.has_institution_role((select auth.uid()), 'mentor') or public.has_institution_role((select auth.uid()), 'lab_lead'))) or public.is_platform_admin())
  with check ((mentor_id = (select auth.uid()) and (public.has_institution_role((select auth.uid()), 'mentor') or public.has_institution_role((select auth.uid()), 'lab_lead'))) or public.is_platform_admin());
alter policy "Mentors decide own requests" on public.mentorship_requests
  using ((mentor_id = (select auth.uid()) and (public.has_institution_role((select auth.uid()), 'mentor') or public.has_institution_role((select auth.uid()), 'lab_lead'))) or public.is_platform_admin())
  with check (((mentor_id = (select auth.uid()) and (public.has_institution_role((select auth.uid()), 'mentor') or public.has_institution_role((select auth.uid()), 'lab_lead'))) or public.is_platform_admin()) and status in ('accepted', 'declined', 'closed'));

create or replace function public.guard_mentorship_decision()
returns trigger language plpgsql set search_path = public as $$
begin
  if row(new.id, new.mentor_id, new.requester_id, new.topic, new.goal, new.availability_note, new.created_at)
    is distinct from row(old.id, old.mentor_id, old.requester_id, old.topic, old.goal, old.availability_note, old.created_at) then
    raise exception 'Request identity and submitted content are immutable' using errcode = '23514';
  end if;
  if not ((old.status = 'pending' and new.status in ('accepted', 'declined'))
    or (old.status = 'accepted' and new.status = 'closed')) then
    raise exception 'Invalid mentorship request transition' using errcode = '23514';
  end if;
  new.updated_at := now();
  return new;
end;
$$;
create trigger guard_mentorship_decision_trigger before update on public.mentorship_requests
  for each row execute function public.guard_mentorship_decision();
revoke all on function public.guard_mentorship_decision() from public, anon, authenticated;

-- Restrictive policies apply to every permissive policy, including author-owned rows.
-- Unpublishing a channel or moderating a post hides its descendant content.
create policy "Community posts require a published channel" on public.community_posts
  as restrictive for all to authenticated
  using (public.is_platform_admin() or exists (select 1 from public.community_channels c where c.id = channel_id and c.published))
  with check (public.is_platform_admin() or exists (select 1 from public.community_channels c where c.id = channel_id and c.published));
create policy "Community comments require a published post" on public.community_comments
  as restrictive for all to authenticated
  using (public.is_platform_admin() or exists (select 1 from public.community_posts p where p.id = post_id and p.status = 'published'))
  with check (public.is_platform_admin() or exists (select 1 from public.community_posts p where p.id = post_id and p.status = 'published'));
create policy "Community reactions require a published post" on public.community_reactions
  as restrictive for all to authenticated
  using (public.is_platform_admin() or exists (select 1 from public.community_posts p where p.id = post_id and p.status = 'published'))
  with check (public.is_platform_admin() or exists (select 1 from public.community_posts p where p.id = post_id and p.status = 'published'));

create or replace function public.guard_community_post_update()
returns trigger language plpgsql set search_path = public as $$
begin
  if row(new.id, new.channel_id, new.author_id, new.created_at)
    is distinct from row(old.id, old.channel_id, old.author_id, old.created_at) then
    raise exception 'Post identity and channel are immutable' using errcode = '23514';
  end if;
  if not public.is_platform_admin() and (old.status <> 'published' or new.status <> 'published') then
    raise exception 'Only administrators can change moderation status' using errcode = '23514';
  end if;
  new.updated_at := now();
  return new;
end;
$$;
create trigger guard_community_post_update_trigger before update on public.community_posts
  for each row execute function public.guard_community_post_update();
revoke all on function public.guard_community_post_update() from public, anon, authenticated;

-- Index referencing columns used by the parent visibility checks and pair lookups.
create index if not exists mentorship_requests_requester_idx on public.mentorship_requests (requester_id);
create index if not exists mentorship_sessions_request_idx on public.mentorship_sessions (request_id);
create index if not exists community_posts_channel_idx on public.community_posts (channel_id);
create index if not exists community_comments_post_idx on public.community_comments (post_id);

insert into public.schema_migrations (phase) values ('phase40') on conflict (phase) do nothing;
commit;
