-- Phase 7 — security hardening (run after phase6.sql)
-- Fixes: role self-escalation, notification fan-out, lead profile reads,
-- members-only content, project lead_id binding, notification deletes.

-- ─── Profiles: prevent non-admins from changing role ───────────────────────
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role then
    if not exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    ) then
      new.role := old.role;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_role_trigger on public.profiles;
create trigger protect_profile_role_trigger
  before update on public.profiles
  for each row
  execute function public.protect_profile_role();

-- Tighten user update policy — role column protected by trigger above
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Project leads can read profiles of applicants to their projects
drop policy if exists "Leads read applicant profiles" on public.profiles;
create policy "Leads read applicant profiles"
  on public.profiles for select
  using (
    exists (
      select 1
      from public.project_applications pa
      join public.projects pr on pr.id = pa.project_id
      where pa.user_id = profiles.id
        and pr.lead_id = auth.uid()
    )
  );

-- ─── Notifications: admin fan-out + user dismiss ───────────────────────────
drop policy if exists "System insert notifications" on public.notifications;
create policy "Users insert own notifications"
  on public.notifications for insert
  with check (auth.uid() = user_id);

create policy "Admins insert notifications"
  on public.notifications for insert
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "Users delete own notifications" on public.notifications;
create policy "Users delete own notifications"
  on public.notifications for delete
  using (auth.uid() = user_id);

-- ─── Projects: bind lead_id on insert + lead_name column ─────────────────────
alter table public.projects add column if not exists lead_name text;

drop policy if exists "Leads and admins insert projects" on public.projects;
create policy "Leads and admins insert projects"
  on public.projects for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('project_lead', 'admin')
    )
    and (
      lead_id is null
      or lead_id = auth.uid()
      or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    )
  );

-- ─── Members-only content reads (require authenticated session) ──────────────
drop policy if exists "Members read published events" on public.events;
create policy "Members read published events"
  on public.events for select
  using (
    auth.uid() is not null
    and (
      published = true
      or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    )
  );

drop policy if exists "Members read published papers" on public.papers;
create policy "Members read published papers"
  on public.papers for select
  using (
    auth.uid() is not null
    and (
      published = true
      or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    )
  );

drop policy if exists "Members read published newsletters" on public.newsletter_issues;
create policy "Members read published newsletters"
  on public.newsletter_issues for select
  using (
    auth.uid() is not null
    and (
      published = true
      or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    )
  );

drop policy if exists "Members read published projects" on public.projects;
create policy "Members read published projects"
  on public.projects for select
  using (
    auth.uid() is not null
    and (
      published = true
      or lead_id = auth.uid()
      or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    )
  );

drop policy if exists "Members read published jobs" on public.jobs;
create policy "Members read published jobs"
  on public.jobs for select
  using (
    auth.uid() is not null
    and (
      published = true
      or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    )
  );

-- Announcements (phase5)
drop policy if exists "Members read published announcements" on public.announcements;
create policy "Members read published announcements"
  on public.announcements for select
  using (
    auth.uid() is not null
    and (
      published = true
      or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    )
  );
