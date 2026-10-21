-- Disposable local Supabase only, with the full chain through phase40 applied.
-- Executable role contract; this file alone is not an execution receipt.
begin;
create function pg_temp.assert_member(ok boolean, message text) returns void
language plpgsql as $$ begin if ok is distinct from true then raise exception '%', message; end if; end; $$;
insert into auth.users (id, email) values
  ('eee40000-0000-4000-8000-000000000001', 'mentor@example.invalid'),
  ('eee40000-0000-4000-8000-000000000002', 'requester@example.invalid'),
  ('eee40000-0000-4000-8000-000000000003', 'other@example.invalid'),
  ('eee40000-0000-4000-8000-000000000004', 'administrator@example.invalid');
insert into public.member_roles (user_id, role) values
  ('eee40000-0000-4000-8000-000000000001', 'mentor'),
  ('eee40000-0000-4000-8000-000000000004', 'administrator');
insert into public.community_channels (id, slug, title, description, published) values
  ('eee40000-0000-4000-8000-000000000100', 'rollback-member-test', 'Local role test', 'Disposable role test channel', true);

set local role anon;
do $$ declare name text; begin
  foreach name in array array['mentor_profiles', 'mentorship_requests', 'mentorship_sessions', 'mentorship_feedback',
    'community_channels', 'community_posts', 'community_comments', 'community_reactions'] loop
    begin execute format('select * from public.%I limit 1', name);
      raise exception 'Anonymous access allowed to %', name;
    exception when insufficient_privilege then null; end;
  end loop;
end; $$;
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'eee40000-0000-4000-8000-000000000001', true);
insert into public.mentor_profiles (mentor_id, headline, monthly_capacity, visible, accepting_requests)
  values ('eee40000-0000-4000-8000-000000000001', 'Role contract mentor', 2, true, true);
-- Exercise the same all-inserted-column upsert used by the client.
insert into public.mentor_profiles (mentor_id, headline, monthly_capacity, visible, accepting_requests)
  values ('eee40000-0000-4000-8000-000000000001', 'Updated role contract mentor', 2, true, true)
  on conflict (mentor_id) do update set mentor_id = excluded.mentor_id, headline = excluded.headline,
    monthly_capacity = excluded.monthly_capacity, visible = excluded.visible, accepting_requests = excluded.accepting_requests;

select set_config('request.jwt.claim.sub', 'eee40000-0000-4000-8000-000000000002', true);
do $$ begin
  begin insert into public.mentor_profiles (mentor_id) values ('eee40000-0000-4000-8000-000000000002');
    raise exception 'Member could become mentor'; exception when insufficient_privilege then null; end;
end; $$;
insert into public.mentorship_requests (mentor_id, requester_id, topic, goal, availability_note)
  values ('eee40000-0000-4000-8000-000000000001', 'eee40000-0000-4000-8000-000000000002', 'Role contract',
    'Please help review the evaluation plan for this bounded local test.', 'Weekends UTC');
insert into public.community_posts (channel_id, author_id, body)
  values ('eee40000-0000-4000-8000-000000000100', 'eee40000-0000-4000-8000-000000000002', 'Local test post');
insert into public.community_comments (post_id, author_id, body)
  select id, 'eee40000-0000-4000-8000-000000000002', 'Local test comment' from public.community_posts
  where channel_id = 'eee40000-0000-4000-8000-000000000100';
insert into public.community_reactions (post_id, user_id, reaction)
  select id, 'eee40000-0000-4000-8000-000000000002', 'useful' from public.community_posts
  where channel_id = 'eee40000-0000-4000-8000-000000000100';

select set_config('request.jwt.claim.sub', 'eee40000-0000-4000-8000-000000000003', true);
select pg_temp.assert_member((select count(*) = 0 from public.mentorship_requests where topic = 'Role contract'), 'Unrelated member saw private request');
do $$ begin
  update public.mentorship_requests set status = 'accepted' where topic = 'Role contract';
  if found then raise exception 'Unrelated member decided request'; end if;
end; $$;

select set_config('request.jwt.claim.sub', 'eee40000-0000-4000-8000-000000000001', true);
do $$ begin
  begin update public.mentorship_requests set requester_id = 'eee40000-0000-4000-8000-000000000003' where topic = 'Role contract';
    raise exception 'Mentor could replace requester'; exception when insufficient_privilege then null; end;
  begin update public.mentorship_requests set goal = 'A replacement for the original submitted evaluation goal.' where topic = 'Role contract';
    raise exception 'Mentor could rewrite submitted goal'; exception when insufficient_privilege then null; end;
end; $$;
update public.mentorship_requests set status = 'accepted' where topic = 'Role contract';
select pg_temp.assert_member((select status = 'accepted' from public.mentorship_requests where topic = 'Role contract'), 'Mentor decision failed');
do $$ begin
  begin update public.mentorship_requests set status = 'declined' where topic = 'Role contract';
    raise exception 'Accepted request could be declined'; exception when check_violation then null; end;
end; $$;
update public.mentorship_requests set status = 'closed' where topic = 'Role contract';
do $$ begin
  begin update public.mentorship_requests set status = 'accepted' where topic = 'Role contract';
    raise exception 'Closed request could reopen'; exception when check_violation then null; end;
end; $$;
reset role;
delete from public.member_roles where user_id = 'eee40000-0000-4000-8000-000000000001' and role = 'mentor';
set local role authenticated;
select set_config('request.jwt.claim.sub', 'eee40000-0000-4000-8000-000000000001', true);
do $$ begin
  update public.mentor_profiles set headline = 'Unauthorized' where mentor_id = auth.uid();
  if found then raise exception 'Revoked mentor could update availability'; end if;
end; $$;

select set_config('request.jwt.claim.sub', 'eee40000-0000-4000-8000-000000000004', true);
update public.community_posts set status = 'hidden' where channel_id = 'eee40000-0000-4000-8000-000000000100';
select pg_temp.assert_member((select count(*) = 1 from public.community_posts where status = 'hidden' and channel_id = 'eee40000-0000-4000-8000-000000000100'), 'Admin moderation failed');
select set_config('request.jwt.claim.sub', 'eee40000-0000-4000-8000-000000000002', true);
do $$ begin
  begin update public.community_posts set status = 'published' where channel_id = 'eee40000-0000-4000-8000-000000000100';
    raise exception 'Author could undo moderation'; exception when check_violation then null; end;
end; $$;
select pg_temp.assert_member((select count(*) = 0 from public.community_comments where body = 'Local test comment'), 'Hidden post comments leaked');
select pg_temp.assert_member((select count(*) = 0 from public.community_reactions where user_id = auth.uid()), 'Hidden post reactions leaked');
select set_config('request.jwt.claim.sub', 'eee40000-0000-4000-8000-000000000004', true);
update public.community_posts set status = 'published' where channel_id = 'eee40000-0000-4000-8000-000000000100';
update public.community_channels set published = false where id = 'eee40000-0000-4000-8000-000000000100';
select set_config('request.jwt.claim.sub', 'eee40000-0000-4000-8000-000000000002', true);
select pg_temp.assert_member((select count(*) = 0 from public.community_posts where channel_id = 'eee40000-0000-4000-8000-000000000100'), 'Unpublished channel posts leaked');
select pg_temp.assert_member((select count(*) = 0 from public.community_comments where body = 'Local test comment'), 'Unpublished channel comments leaked');
select pg_temp.assert_member((select count(*) = 0 from public.community_reactions where user_id = auth.uid()), 'Unpublished channel reactions leaked');
reset role;
rollback;
