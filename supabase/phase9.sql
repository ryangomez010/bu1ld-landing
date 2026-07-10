-- Phase 9 — member directory + project updates (run after phase8.sql)

-- Members can browse profiles that completed onboarding
drop policy if exists "Members read directory profiles" on public.profiles;
create policy "Members read directory profiles"
  on public.profiles for select
  using (
    auth.uid() is not null
    and onboarding_completed = true
  );

create table if not exists public.project_updates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  author_id uuid references public.profiles(id) on delete set null,
  body text not null check (char_length(body) <= 2000),
  created_at timestamptz not null default now()
);

create index if not exists project_updates_project_idx
  on public.project_updates (project_id, created_at desc);

alter table public.project_updates enable row level security;

drop policy if exists "Members read project updates" on public.project_updates;
create policy "Members read project updates"
  on public.project_updates for select
  using (
    auth.uid() is not null
    and exists (
      select 1 from public.projects p
      where p.id = project_updates.project_id
      and (
        p.published = true
        or p.lead_id = auth.uid()
        or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
      )
    )
  );

drop policy if exists "Leads insert project updates" on public.project_updates;
create policy "Leads insert project updates"
  on public.project_updates for insert
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.projects
      where id = project_id and lead_id = auth.uid()
    )
  );

drop policy if exists "Leads delete own project updates" on public.project_updates;
create policy "Leads delete own project updates"
  on public.project_updates for delete
  using (author_id = auth.uid());
