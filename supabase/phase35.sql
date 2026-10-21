-- Phase 35: verified event operations and atomic, private registration.
-- Existing date-only records and RSVPs are retained. No event is opened by migration.
begin;

drop policy if exists "Admins manage events" on public.events;
create policy "Admins manage events" on public.events for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());

alter table public.events
  add column if not exists starts_at timestamptz,
  add column if not exists ends_at timestamptz,
  add column if not exists timezone text,
  add column if not exists operational_state text not null default 'scheduled'
    check (operational_state in ('scheduled', 'cancelled', 'postponed')),
  add column if not exists archived boolean not null default false,
  add column if not exists registration_mode text not null default 'unavailable'
    check (registration_mode in ('unavailable', 'internal', 'external')),
  add column if not exists registration_state text not null default 'closed'
    check (registration_state in ('open', 'waitlist', 'closed')),
  add column if not exists registration_opens_at timestamptz,
  add column if not exists registration_deadline timestamptz,
  add column if not exists registration_url text,
  add column if not exists capacity integer check (capacity is null or capacity >= 0),
  add column if not exists waitlist_enabled boolean not null default false,
  add column if not exists organizer text,
  add column if not exists eligibility text,
  add column if not exists format_details text,
  add column if not exists price_details text,
  add column if not exists agenda text,
  add column if not exists contact_url text,
  add column if not exists source_url text,
  add column if not exists verified_at timestamptz,
  add column if not exists public_materials jsonb not null default '[]';

-- Anonymous access is limited to the public projection; legacy preparation notes stay private.
drop policy if exists "Visitors read published events" on public.events;
create policy "Visitors read published events" on public.events for select to anon using (published = true);
revoke select on public.events from public, anon;
grant select (id, slug, title, summary, location, start_date, end_date, topics, url, published,
  created_at, updated_at, starts_at, ends_at, timezone, operational_state, archived,
  registration_mode, registration_state, registration_opens_at, registration_deadline,
  registration_url, capacity, waitlist_enabled, organizer, eligibility, format_details,
  price_details, agenda, contact_url, source_url, verified_at, public_materials)
  on public.events to anon;

alter table public.event_rsvps
  add column if not exists status text not null default 'legacy'
    check (status in ('legacy', 'confirmed', 'waitlisted', 'cancelled')),
  add column if not exists updated_at timestamptz not null default now();
create index if not exists event_rsvps_capacity_idx
  on public.event_rsvps (event_id, status, created_at, user_id);

-- Request identities make retries safe even if a later cancellation has occurred.
create table if not exists public.event_registration_requests (
  user_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid not null,
  event_id uuid not null references public.events(id) on delete cascade,
  action text not null check (action in ('register', 'cancel')),
  created_at timestamptz not null default now(),
  primary key (user_id, request_id)
);
alter table public.event_registration_requests enable row level security;
revoke all on public.event_registration_requests from anon, authenticated;
-- Only the security-definer transaction can mutate registration rows.
revoke all on public.event_rsvps from anon, authenticated;
grant select on public.event_rsvps to authenticated;
drop policy if exists "Members read event rsvps" on public.event_rsvps;
drop policy if exists "Users read own event rsvps" on public.event_rsvps;
drop policy if exists "Users manage own event rsvps" on public.event_rsvps;
drop policy if exists "Users delete own event rsvps" on public.event_rsvps;
create policy "Users read own event rsvps" on public.event_rsvps
  for select to authenticated using (user_id = (select auth.uid()));

create or replace function public.validate_event_operations()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.timezone is not null and not exists (
    select 1 from pg_catalog.pg_timezone_names where name = new.timezone
  ) then raise exception 'Use a valid IANA timezone.'; end if;
  if new.starts_at is not null and new.ends_at is not null and new.ends_at <= new.starts_at then
    raise exception 'The event must end after it starts.';
  end if;
  if new.registration_opens_at is not null and new.registration_deadline is not null
     and new.registration_deadline <= new.registration_opens_at then
    raise exception 'The registration deadline must follow opening.';
  end if;
  if new.verified_at > now() then raise exception 'Verification cannot be future dated.'; end if;
  if jsonb_typeof(new.public_materials) <> 'array' then raise exception 'Materials must be a list.'; end if;
  if exists (select 1 from unnest(array[new.registration_url, new.contact_url, new.source_url]) u
     where u is not null and u !~ '^https://[^/@[:space:]]+([/?#][^[:space:]]*)?$') then
    raise exception 'Public event links must use HTTPS without credentials.';
  end if;
  if exists (select 1 from jsonb_array_elements(new.public_materials) m
     where jsonb_typeof(m) <> 'object' or coalesce(m->>'label', '') = ''
       or coalesce(m->>'url', '') !~ '^https://[^/@[:space:]]+([/?#][^[:space:]]*)?$') then
    raise exception 'Each public material needs a label and HTTPS link.';
  end if;
  if new.registration_state <> 'closed' then
    if new.registration_mode = 'unavailable' or new.archived or new.operational_state <> 'scheduled'
       or new.verified_at is null or new.timezone is null or new.starts_at is null or new.ends_at is null
       or new.registration_deadline is null or new.registration_opens_at is null
       or new.registration_deadline > new.ends_at
       or nullif(trim(new.organizer), '') is null or nullif(trim(new.eligibility), '') is null
       or nullif(trim(new.format_details), '') is null or nullif(trim(new.price_details), '') is null
       or nullif(trim(new.agenda), '') is null or new.contact_url is null or new.source_url is null
    then raise exception 'Confirm event details and registration window before opening.'; end if;
    if new.registration_mode = 'internal' and (new.capacity is null or new.price_details <> 'Free') then
      raise exception 'Internal registration requires verified capacity and Free pricing.';
    end if;
    if new.registration_mode = 'external' and new.registration_url is null then
      raise exception 'External registration requires the canonical organizer form.';
    end if;
    if new.registration_state = 'waitlist' and not new.waitlist_enabled then
      raise exception 'Enable the waitlist before opening waitlist registration.';
    end if;
  end if;
  if new.capacity is not null and new.capacity < (
    select count(*) from public.event_rsvps where event_id = new.id and status in ('confirmed', 'legacy')
  ) then raise exception 'Capacity cannot be lower than retained registrations.'; end if;
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists validate_event_operations on public.events;
create trigger validate_event_operations before insert or update on public.events
  for each row execute function public.validate_event_operations();

create or replace function public.promote_event_waitlist(p_event_id uuid)
returns integer language plpgsql security definer set search_path = '' as $$
declare ev public.events%rowtype; seats integer; promoted integer;
begin
  select * into ev from public.events where id = p_event_id for update;
  if not found or ev.published is not true or ev.archived or ev.operational_state <> 'scheduled'
    or ev.registration_mode <> 'internal' or ev.registration_state <> 'open'
    or ev.verified_at is null or ev.capacity is null or ev.registration_opens_at is null
    or ev.registration_deadline is null or ev.ends_at is null
    or now() < ev.registration_opens_at or now() >= ev.registration_deadline or now() >= ev.ends_at
  then return 0; end if;
  select greatest(ev.capacity - count(*), 0)::integer into seats from public.event_rsvps
    where event_id = ev.id and status in ('confirmed', 'legacy');
  update public.event_rsvps set status = 'confirmed', updated_at = now()
    where (event_id, user_id) in (select event_id, user_id from public.event_rsvps
      where event_id = ev.id and status = 'waitlisted' order by created_at, user_id limit seats);
  get diagnostics promoted = row_count;
  return promoted;
end;
$$;
revoke all on function public.promote_event_waitlist(uuid) from public, anon, authenticated;

create or replace function public.refresh_event_waitlist()
returns trigger language plpgsql security definer set search_path = '' as $$
begin perform public.promote_event_waitlist(new.id); return new; end;
$$;
revoke all on function public.refresh_event_waitlist() from public, anon, authenticated;
drop trigger if exists refresh_event_waitlist on public.events;
create trigger refresh_event_waitlist after update on public.events
  for each row execute function public.refresh_event_waitlist();

create or replace function public.set_event_registration(p_event_id uuid, p_action text, p_request_id uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := (select auth.uid());
  ev public.events%rowtype;
  current_status text;
  previous_request public.event_registration_requests%rowtype;
begin
  if actor is null then raise exception 'Sign in to register.' using errcode = '42501'; end if;
  if p_action is null or p_action not in ('register', 'cancel') or p_request_id is null then
    raise exception 'Invalid registration request.' using errcode = '22023';
  end if;
  -- Serializes seats, waitlist promotion, and concurrent editor changes per event.
  select * into ev from public.events where id = p_event_id for update;
  if not found then raise exception 'Event unavailable.'; end if;
  if p_action = 'register' then perform public.promote_event_waitlist(ev.id); end if;
  select status into current_status from public.event_rsvps where event_id = ev.id and user_id = actor;
  select * into previous_request from public.event_registration_requests
    where user_id = actor and request_id = p_request_id;
  if found then
    if previous_request.event_id <> ev.id or previous_request.action <> p_action then
      raise exception 'Request identity was already used.' using errcode = '22023';
    end if;
    return coalesce(current_status, 'cancelled');
  end if;
  if p_action = 'cancel' then
    update public.event_rsvps set status = 'cancelled', updated_at = now()
      where event_id = ev.id and user_id = actor;
    perform public.promote_event_waitlist(ev.id);
    current_status := 'cancelled';
  elsif current_status in ('confirmed', 'waitlisted', 'legacy') then
    null; -- Repeated registration returns the durable existing state.
  else
    if ev.published is not true or ev.archived or ev.operational_state <> 'scheduled'
       or ev.registration_mode <> 'internal' or ev.registration_state = 'closed'
       or ev.verified_at is null or ev.capacity is null or ev.starts_at is null or ev.ends_at is null
       or ev.registration_opens_at is null or ev.registration_deadline is null
       or now() < ev.registration_opens_at or now() >= ev.registration_deadline or now() >= ev.ends_at
    then raise exception 'Registration is not open.' using errcode = '42501'; end if;
    if ev.registration_state = 'waitlist' or (
      select count(*) from public.event_rsvps where event_id = ev.id and status in ('confirmed', 'legacy')
    ) >= ev.capacity then
      if not ev.waitlist_enabled then raise exception 'This event is full.'; end if;
      current_status := 'waitlisted';
    else current_status := 'confirmed'; end if;
    insert into public.event_rsvps (user_id, event_id, status, created_at, updated_at)
      values (actor, ev.id, current_status, now(), now())
      on conflict (user_id, event_id) do update
      set status = excluded.status, created_at = excluded.created_at, updated_at = excluded.updated_at;
  end if;
  insert into public.event_registration_requests (user_id, request_id, event_id, action)
    values (actor, p_request_id, ev.id, p_action);
  return current_status;
end;
$$;
revoke all on function public.set_event_registration(uuid, text, uuid) from public, anon;
grant execute on function public.set_event_registration(uuid, text, uuid) to authenticated;
revoke all on function public.validate_event_operations() from public, anon, authenticated;

insert into public.schema_migrations (phase) values ('phase35') on conflict (phase) do nothing;
commit;
