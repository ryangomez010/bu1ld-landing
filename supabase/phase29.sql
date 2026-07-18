-- Phase 29 — Project weekly commitment (builder discovery honesty).
-- Additive. Apply after phase28.sql.

alter table public.projects
  add column if not exists weekly_commitment_hours integer;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'projects_weekly_commitment_hours_check'
  ) then
    alter table public.projects
      add constraint projects_weekly_commitment_hours_check
      check (
        weekly_commitment_hours is null
        or (weekly_commitment_hours >= 1 and weekly_commitment_hours <= 60)
      );
  end if;
end $$;

insert into public.schema_migrations (phase) values ('phase29') on conflict (phase) do nothing;
