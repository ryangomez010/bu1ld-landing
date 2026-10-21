-- Phase 38: enforce safe notification destinations and close remaining trigger helpers.
-- Additive hardening migration. Apply after phase37.sql.
begin;

-- Notification destinations are internal application paths. Remove unsafe legacy values before
-- making the database enforce the same boundary as the browser client.
update public.notifications
set href = null
where href is not null
  and not (
    char_length(href) <= 500
    and href like '/%'
    and href not like '//%'
    and position(chr(92) in href) = 0
    and href !~ '[[:cntrl:]]'
    and lower(href) !~ '%(2f|5c|2e)'
    and split_part(split_part(href, '?', 1), '#', 1) !~ '(^|/)\.{1,2}(/|$)'
  );

alter table public.notifications
  drop constraint if exists notifications_safe_href_check;
alter table public.notifications
  add constraint notifications_safe_href_check check (
    href is null
    or (
      char_length(href) <= 500
      and href like '/%'
      and href not like '//%'
      and position(chr(92) in href) = 0
      and href !~ '[[:cntrl:]]'
      and lower(href) !~ '%(2f|5c|2e)'
      and split_part(split_part(href, '?', 1), '#', 1) !~ '(^|/)\.{1,2}(/|$)'
    )
  );

-- These functions exist only for database triggers/internal maintenance.
revoke all on function public.handle_new_user(),
  public.promote_event_waitlist(uuid)
  from public, anon, authenticated;

insert into public.schema_migrations (phase) values ('phase38')
on conflict (phase) do nothing;
commit;
