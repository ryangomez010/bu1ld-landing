-- Disposable local Supabase only. Executed by scripts/test-event-registration.mjs.
-- This is an executable contract, not an execution receipt. Every fixture rolls back.
begin;
create function pg_temp.assert_event(ok boolean, message text) returns void
language plpgsql as $$ begin if ok is distinct from true then raise exception '%', message; end if; end; $$;
insert into auth.users (id, email) values
  ('eee00000-0000-4000-8000-000000000001', 'event-test-a@example.invalid'),
  ('eee00000-0000-4000-8000-000000000002', 'event-test-b@example.invalid');
insert into public.events (id, slug, title, published, starts_at, ends_at, timezone,
  registration_mode, registration_state, registration_opens_at, registration_deadline,
  capacity, waitlist_enabled, organizer, eligibility, format_details, price_details,
  agenda, contact_url, source_url, verified_at)
values ('eee00000-0000-4000-8000-000000000100', 'rollback-event-registration-test', 'Local rollback test', true,
  now() + interval '1 day', now() + interval '2 days', 'Asia/Kolkata', 'internal', 'open',
  now() - interval '1 day', now() + interval '1 day', 1, true, 'Test fixture', 'Test users only',
  'Local test only', 'Free', 'No real event', 'https://example.invalid/contact', 'https://example.invalid/source', now());

set local role anon;
select pg_temp.assert_event((select count(*) = 1 from public.events where slug = 'rollback-event-registration-test'), 'Anonymous public event missing');
do $$ begin
  begin perform prep_notes from public.events; raise exception 'Private notes were readable';
  exception when insufficient_privilege then null; end;
  begin perform public.set_event_registration('eee00000-0000-4000-8000-000000000100', 'register', gen_random_uuid());
    raise exception 'Anonymous registration was allowed'; exception when insufficient_privilege then null; end;
end; $$;
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'eee00000-0000-4000-8000-000000000001', true);
select pg_temp.assert_event(public.set_event_registration('eee00000-0000-4000-8000-000000000100', 'register', 'eee00000-0000-4000-8000-000000000201') = 'confirmed', 'First seat not confirmed');
select pg_temp.assert_event(public.set_event_registration('eee00000-0000-4000-8000-000000000100', 'register', 'eee00000-0000-4000-8000-000000000201') = 'confirmed', 'Duplicate request changed result');
do $$ begin
  begin insert into public.event_rsvps (event_id, user_id) values ('eee00000-0000-4000-8000-000000000100', 'eee00000-0000-4000-8000-000000000002');
    raise exception 'Direct registration insert allowed'; exception when insufficient_privilege then null; end;
  begin delete from public.event_rsvps; raise exception 'Direct registration delete allowed';
    exception when insufficient_privilege then null; end;
  update public.events set capacity = 99 where id = 'eee00000-0000-4000-8000-000000000100';
  if found then raise exception 'Member could edit capacity'; end if;
end; $$;
select set_config('request.jwt.claim.sub', 'eee00000-0000-4000-8000-000000000002', true);
select pg_temp.assert_event((select count(*) = 0 from public.event_rsvps where event_id = 'eee00000-0000-4000-8000-000000000100'), 'Other participant leaked');
select pg_temp.assert_event(public.set_event_registration('eee00000-0000-4000-8000-000000000100', 'register', 'eee00000-0000-4000-8000-000000000202') = 'waitlisted', 'Capacity did not waitlist');
select set_config('request.jwt.claim.sub', 'eee00000-0000-4000-8000-000000000001', true);
select pg_temp.assert_event(public.set_event_registration('eee00000-0000-4000-8000-000000000100', 'cancel', 'eee00000-0000-4000-8000-000000000203') = 'cancelled', 'Cancellation failed');
select pg_temp.assert_event(public.set_event_registration('eee00000-0000-4000-8000-000000000100', 'register', 'eee00000-0000-4000-8000-000000000201') = 'cancelled', 'Delayed retry resurrected cancelled seat');
select set_config('request.jwt.claim.sub', 'eee00000-0000-4000-8000-000000000002', true);
select pg_temp.assert_event((select status = 'confirmed' from public.event_rsvps where event_id = 'eee00000-0000-4000-8000-000000000100'), 'Waitlist did not promote');
reset role;

select pg_temp.assert_event((select count(*) = 1 from public.event_rsvps where event_id = 'eee00000-0000-4000-8000-000000000100' and status = 'confirmed'), 'Capacity was exceeded');
-- An expanded capacity promotes the queue immediately, before any newcomer can register.
set local role authenticated;
select set_config('request.jwt.claim.sub', 'eee00000-0000-4000-8000-000000000001', true);
select pg_temp.assert_event(public.set_event_registration('eee00000-0000-4000-8000-000000000100', 'register', 'eee00000-0000-4000-8000-000000000204') = 'waitlisted', 'Full event did not queue returning participant');
reset role;
update public.events set capacity = 2 where id = 'eee00000-0000-4000-8000-000000000100';
select pg_temp.assert_event((select count(*) = 2 from public.event_rsvps where event_id = 'eee00000-0000-4000-8000-000000000100' and status = 'confirmed'), 'Capacity increase did not promote queue');
set local role authenticated;
select set_config('request.jwt.claim.sub', 'eee00000-0000-4000-8000-000000000001', true);
select public.set_event_registration('eee00000-0000-4000-8000-000000000100', 'cancel', gen_random_uuid());
reset role;
update public.events set published = null where id = 'eee00000-0000-4000-8000-000000000100';
set local role authenticated;
do $$ begin
  begin perform public.set_event_registration('eee00000-0000-4000-8000-000000000100', 'register', gen_random_uuid());
    raise exception 'NULL publication allowed registration'; exception when insufficient_privilege then null; end;
end; $$;
reset role;
update public.events set operational_state = 'cancelled', registration_state = 'closed' where id = 'eee00000-0000-4000-8000-000000000100';
set local role authenticated;
select set_config('request.jwt.claim.sub', 'eee00000-0000-4000-8000-000000000001', true);
do $$ begin
  begin perform public.set_event_registration('eee00000-0000-4000-8000-000000000100', 'register', gen_random_uuid());
    raise exception 'Cancelled event accepted registration'; exception when insufficient_privilege then null; end;
end; $$;
reset role;
rollback;
