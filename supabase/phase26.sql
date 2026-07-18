-- Phase 26 — Pass 2 heavy additions: profile enrichment, paper metadata,
-- public papers catalog, research paths, application questions, project datasets.
-- Additive migration. Apply after phase25.sql.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Profile enrichment
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists availability_hours_per_week integer
    check (availability_hours_per_week is null or availability_hours_per_week between 0 and 80);

alter table public.profiles
  add column if not exists experience_level text
    check (experience_level is null or experience_level in (
      'student', 'early_career', 'mid_career', 'senior', 'researcher'
    ));

alter table public.profiles
  add column if not exists desired_roles text[] not null default '{}';

alter table public.profiles
  add column if not exists member_skills text[] not null default '{}';

-- ---------------------------------------------------------------------------
-- Paper metadata + public catalog RLS
-- ---------------------------------------------------------------------------
alter table public.papers
  add column if not exists venue text check (venue is null or char_length(venue) <= 200);

alter table public.papers
  add column if not exists prerequisites text[] not null default '{}';

alter table public.papers
  add column if not exists editorial_summary text
    check (editorial_summary is null or char_length(editorial_summary) <= 4000);

-- Anon may read fully published papers (separate from authenticated member policy)
drop policy if exists "Public reads published papers catalog" on public.papers;
create policy "Public reads published papers catalog" on public.papers for select
  to anon
  using (published = true and review_status = 'published');

-- Ensure authenticated can still read published papers without auth.uid() gate for catalog
drop policy if exists "Authenticated read published papers catalog" on public.papers;
create policy "Authenticated read published papers catalog" on public.papers for select
  to authenticated
  using (published = true and review_status = 'published');

-- ---------------------------------------------------------------------------
-- Research paths (DB-backed learning pathways)
-- ---------------------------------------------------------------------------
create table if not exists public.research_paths (
  id text primary key check (char_length(trim(id)) between 2 and 80),
  title text not null check (char_length(trim(title)) between 3 and 160),
  description text not null default '' check (char_length(description) <= 2000),
  published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.research_path_steps (
  id uuid primary key default gen_random_uuid(),
  path_id text not null references public.research_paths(id) on delete cascade,
  step_kind text not null check (step_kind in ('guide', 'paper')),
  step_slug text not null check (char_length(trim(step_slug)) between 2 and 120),
  sort_order integer not null default 0,
  unique (path_id, step_kind, step_slug)
);

create index if not exists research_path_steps_path_idx
  on public.research_path_steps (path_id, sort_order);

create table if not exists public.research_path_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  path_id text not null references public.research_paths(id) on delete cascade,
  completed_steps integer not null default 0 check (completed_steps >= 0),
  last_step_slug text,
  updated_at timestamptz not null default now(),
  primary key (user_id, path_id)
);

alter table public.research_paths enable row level security;
alter table public.research_path_steps enable row level security;
alter table public.research_path_progress enable row level security;

revoke all on table public.research_paths from anon;
revoke all on table public.research_path_steps from anon;
revoke all on table public.research_path_progress from anon;

grant select on table public.research_paths to anon, authenticated;
grant select on table public.research_path_steps to anon, authenticated;
grant select, insert, update, delete on table public.research_paths to authenticated;
grant select, insert, update, delete on table public.research_path_steps to authenticated;
grant select, insert, update, delete on table public.research_path_progress to authenticated;

drop policy if exists "Public reads published research paths" on public.research_paths;
create policy "Public reads published research paths" on public.research_paths for select
  to anon, authenticated
  using (published = true or public.is_platform_admin());

drop policy if exists "Admins manage research paths" on public.research_paths;
create policy "Admins manage research paths" on public.research_paths for all
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

drop policy if exists "Public reads research path steps" on public.research_path_steps;
create policy "Public reads research path steps" on public.research_path_steps for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.research_paths p
      where p.id = path_id and (p.published = true or public.is_platform_admin())
    )
  );

drop policy if exists "Admins manage research path steps" on public.research_path_steps;
create policy "Admins manage research path steps" on public.research_path_steps for all
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

drop policy if exists "Members manage own path progress" on public.research_path_progress;
create policy "Members manage own path progress" on public.research_path_progress for all
  to authenticated
  using (user_id = auth.uid() or public.is_platform_admin())
  with check (user_id = auth.uid() or public.is_platform_admin());

-- Seed static research paths when empty
insert into public.research_paths (id, title, description, sort_order)
values
  ('foundations', 'Transformer foundations',
   'Start with attention mechanics, then read the paper that made it the default.', 1),
  ('world-models', 'World models & JEPA',
   'Representation-space prediction and residual tokenization threads.', 2),
  ('scaling-alignment', 'Scaling & alignment',
   'Compute budgeting and preference optimization in practice.', 3),
  ('build-method', 'Paper → prototype',
   'How The Bu1ld reads papers and scopes prototypes.', 4)
on conflict (id) do nothing;

insert into public.research_path_steps (path_id, step_kind, step_slug, sort_order)
select * from (values
  ('foundations', 'guide', 'what-is-attention', 1),
  ('foundations', 'paper', 'attention-is-all-you-need', 2),
  ('foundations', 'guide', 'math-behind-ai', 3),
  ('world-models', 'guide', 'what-is-jepa', 1),
  ('world-models', 'paper', 'lecun-jepa-world-models', 2),
  ('world-models', 'paper', 'residual-event-tokenization', 3),
  ('scaling-alignment', 'paper', 'chinchilla-scaling-laws', 1),
  ('scaling-alignment', 'paper', 'direct-preference-optimization', 2),
  ('scaling-alignment', 'guide', 'how-llms-work', 3),
  ('build-method', 'guide', 'paper-to-prototype', 1),
  ('build-method', 'guide', 'physics-informed-nns', 2),
  ('build-method', 'paper', 'residual-event-tokenization', 3)
) as v(path_id, step_kind, step_slug, sort_order)
where not exists (
  select 1 from public.research_path_steps s
  where s.path_id = v.path_id and s.step_kind = v.step_kind and s.step_slug = v.step_slug
);

-- ---------------------------------------------------------------------------
-- Project application questions
-- ---------------------------------------------------------------------------
create table if not exists public.project_application_questions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  prompt text not null check (char_length(trim(prompt)) between 5 and 500),
  required boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists project_application_questions_project_idx
  on public.project_application_questions (project_id, sort_order);

create table if not exists public.project_application_answers (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.project_applications(id) on delete cascade,
  question_id uuid not null references public.project_application_questions(id) on delete cascade,
  answer text not null check (char_length(trim(answer)) between 1 and 4000),
  created_at timestamptz not null default now(),
  unique (application_id, question_id)
);

alter table public.project_application_questions enable row level security;
alter table public.project_application_answers enable row level security;

revoke all on table public.project_application_questions from anon;
revoke all on table public.project_application_answers from anon;
grant select on table public.project_application_questions to authenticated;
grant select, insert, update, delete on table public.project_application_questions to authenticated;
grant select, insert on table public.project_application_answers to authenticated;

drop policy if exists "Members read project questions" on public.project_application_questions;
create policy "Members read project questions" on public.project_application_questions for select
  to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and (p.published = true or p.lead_id = auth.uid() or public.is_platform_admin())
    )
  );

drop policy if exists "Leads manage project questions" on public.project_application_questions;
create policy "Leads manage project questions" on public.project_application_questions for all
  to authenticated
  using (
    public.is_platform_admin()
    or exists (select 1 from public.projects p where p.id = project_id and p.lead_id = auth.uid())
  )
  with check (
    public.is_platform_admin()
    or exists (select 1 from public.projects p where p.id = project_id and p.lead_id = auth.uid())
  );

drop policy if exists "Applicants insert answers" on public.project_application_answers;
create policy "Applicants insert answers" on public.project_application_answers for insert
  to authenticated
  with check (
    exists (
      select 1 from public.project_applications a
      where a.id = application_id and a.user_id = auth.uid()
    )
  );

drop policy if exists "Applicants and leads read answers" on public.project_application_answers;
create policy "Applicants and leads read answers" on public.project_application_answers for select
  to authenticated
  using (
    public.is_platform_admin()
    or exists (
      select 1 from public.project_applications a
      where a.id = application_id and a.user_id = auth.uid()
    )
    or exists (
      select 1 from public.project_applications a
      join public.projects p on p.id = a.project_id
      where a.id = application_id and p.lead_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Project datasets registry
-- ---------------------------------------------------------------------------
create table if not exists public.project_datasets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete restrict,
  name text not null check (char_length(trim(name)) between 2 and 160),
  version_label text not null default 'v1' check (char_length(trim(version_label)) between 1 and 40),
  description text not null default '' check (char_length(description) <= 4000),
  source_url text check (source_url is null or source_url ~ '^https?://'),
  license text check (license is null or char_length(license) <= 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_datasets_project_idx
  on public.project_datasets (project_id, created_at desc);

alter table public.project_datasets enable row level security;
revoke all on table public.project_datasets from anon;
grant select, insert, update, delete on table public.project_datasets to authenticated;

drop policy if exists "Collaborators read project datasets" on public.project_datasets;
create policy "Collaborators read project datasets" on public.project_datasets for select
  to authenticated
  using (
    public.is_platform_admin()
    or exists (
      select 1 from public.projects p
      where p.id = project_id and (p.lead_id = auth.uid() or p.published = true)
    )
    or exists (
      select 1 from public.project_memberships m
      where m.project_id = project_datasets.project_id
        and m.user_id = auth.uid()
        and m.status = 'active'
    )
  );

drop policy if exists "Leads and members write project datasets" on public.project_datasets;
create policy "Leads and members write project datasets" on public.project_datasets for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and (
      public.is_platform_admin()
      or exists (select 1 from public.projects p where p.id = project_id and p.lead_id = auth.uid())
      or exists (
        select 1 from public.project_memberships m
        where m.project_id = project_id and m.user_id = auth.uid() and m.status = 'active'
      )
    )
  );

drop policy if exists "Leads update project datasets" on public.project_datasets;
create policy "Leads update project datasets" on public.project_datasets for update
  to authenticated
  using (
    public.is_platform_admin()
    or exists (select 1 from public.projects p where p.id = project_id and p.lead_id = auth.uid())
    or created_by = auth.uid()
  )
  with check (
    public.is_platform_admin()
    or exists (select 1 from public.projects p where p.id = project_id and p.lead_id = auth.uid())
    or created_by = auth.uid()
  );

drop policy if exists "Leads delete project datasets" on public.project_datasets;
create policy "Leads delete project datasets" on public.project_datasets for delete
  to authenticated
  using (
    public.is_platform_admin()
    or exists (select 1 from public.projects p where p.id = project_id and p.lead_id = auth.uid())
  );

insert into public.schema_migrations (phase) values ('phase26') on conflict (phase) do nothing;
