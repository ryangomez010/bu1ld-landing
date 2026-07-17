-- Phase 25 — platform admin helper, institution seeds, experiments & deliverables
-- Additive migration. Apply after phase24.sql.

create extension if not exists pgcrypto;

-- Unified admin check: legacy profiles.role = 'admin' OR member_roles.administrator
create or replace function public.is_platform_admin(uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = uid and p.role = 'admin'
  )
  or exists (
    select 1 from public.member_roles mr
    where mr.user_id = uid and mr.role = 'administrator'
  );
$$;

revoke all on function public.is_platform_admin(uuid) from public;
grant execute on function public.is_platform_admin(uuid) to authenticated, anon;

-- Refresh phase24 admin policies to accept institutional administrators
drop policy if exists "Admins manage labs" on public.labs;
create policy "Admins manage labs" on public.labs for all
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

drop policy if exists "Admins manage competitions" on public.competitions;
create policy "Admins manage competitions" on public.competitions for all
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

drop policy if exists "Admins review competition submissions" on public.competition_submissions;
create policy "Admins review competition submissions" on public.competition_submissions for update
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

drop policy if exists "Admins manage partnerships" on public.partnerships;
create policy "Admins manage partnerships" on public.partnerships for all
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- First-class experiment records (linked to projects)
create table if not exists public.project_experiments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete restrict,
  title text not null check (char_length(trim(title)) between 3 and 160),
  hypothesis text not null check (char_length(trim(hypothesis)) between 10 and 4000),
  method text not null default '' check (char_length(method) <= 8000),
  result_summary text not null default '' check (char_length(result_summary) <= 8000),
  status text not null default 'planned' check (status in ('planned', 'running', 'completed', 'abandoned')),
  evidence_url text check (evidence_url is null or evidence_url ~ '^https?://'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_experiments_project_idx on public.project_experiments (project_id, created_at desc);
alter table public.project_experiments enable row level security;
revoke all on table public.project_experiments from anon;
grant select, insert, update, delete on table public.project_experiments to authenticated;

drop policy if exists "Collaborators read project experiments" on public.project_experiments;
create policy "Collaborators read project experiments" on public.project_experiments for select
  to authenticated
  using (
    public.is_platform_admin()
    or exists (
      select 1 from public.projects p
      where p.id = project_id and (p.lead_id = auth.uid() or p.published = true)
    )
    or exists (
      select 1 from public.project_memberships pm
      where pm.project_id = project_experiments.project_id
        and pm.user_id = auth.uid()
        and pm.status = 'active'
    )
  );

drop policy if exists "Collaborators write project experiments" on public.project_experiments;
create policy "Collaborators write project experiments" on public.project_experiments for all
  to authenticated
  using (
    public.is_platform_admin()
    or exists (select 1 from public.projects p where p.id = project_id and p.lead_id = auth.uid())
    or (
      created_by = auth.uid()
      and exists (
        select 1 from public.project_memberships pm
        where pm.project_id = project_experiments.project_id
          and pm.user_id = auth.uid()
          and pm.status = 'active'
      )
    )
  )
  with check (
    created_by = auth.uid()
    and (
      public.is_platform_admin()
      or exists (select 1 from public.projects p where p.id = project_id and p.lead_id = auth.uid())
      or exists (
        select 1 from public.project_memberships pm
        where pm.project_id = project_id and pm.user_id = auth.uid() and pm.status = 'active'
      )
    )
  );

-- Deliverables (milestone-adjacent artifacts with review)
create table if not exists public.project_deliverables (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  milestone_id uuid references public.project_milestones(id) on delete set null,
  submitted_by uuid not null references public.profiles(id) on delete restrict,
  title text not null check (char_length(trim(title)) between 3 and 160),
  description text not null default '' check (char_length(description) <= 8000),
  artifact_url text check (artifact_url is null or artifact_url ~ '^https?://'),
  status text not null default 'draft' check (status in ('draft', 'submitted', 'accepted', 'changes_requested')),
  review_note text check (review_note is null or char_length(review_note) <= 4000),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_deliverables_project_idx on public.project_deliverables (project_id, status, created_at desc);
alter table public.project_deliverables enable row level security;
revoke all on table public.project_deliverables from anon;
grant select, insert, update, delete on table public.project_deliverables to authenticated;

drop policy if exists "Collaborators read project deliverables" on public.project_deliverables;
create policy "Collaborators read project deliverables" on public.project_deliverables for select
  to authenticated
  using (
    public.is_platform_admin()
    or submitted_by = auth.uid()
    or exists (select 1 from public.projects p where p.id = project_id and p.lead_id = auth.uid())
    or exists (
      select 1 from public.project_memberships pm
      where pm.project_id = project_deliverables.project_id
        and pm.user_id = auth.uid()
        and pm.status = 'active'
    )
  );

drop policy if exists "Members submit project deliverables" on public.project_deliverables;
create policy "Members submit project deliverables" on public.project_deliverables for insert
  to authenticated
  with check (
    submitted_by = auth.uid()
    and (
      public.is_platform_admin()
      or exists (select 1 from public.projects p where p.id = project_id and p.lead_id = auth.uid())
      or exists (
        select 1 from public.project_memberships pm
        where pm.project_id = project_id and pm.user_id = auth.uid() and pm.status = 'active'
      )
    )
  );

drop policy if exists "Leads and authors update deliverables" on public.project_deliverables;
create policy "Leads and authors update deliverables" on public.project_deliverables for update
  to authenticated
  using (
    public.is_platform_admin()
    or submitted_by = auth.uid()
    or exists (select 1 from public.projects p where p.id = project_id and p.lead_id = auth.uid())
  )
  with check (
    public.is_platform_admin()
    or submitted_by = auth.uid()
    or exists (select 1 from public.projects p where p.id = project_id and p.lead_id = auth.uid())
  );

-- Seed published labs (idempotent by slug)
insert into public.labs (slug, name, short_name, tagline, summary, focus, methods, open_roles, color, published)
values
  (
    'scientific-discovery',
    'Machine Learning for Scientific Discovery',
    'Scientific Discovery',
    'Surrogates, simulators, and discovery loops that survive contact with real data.',
    'This lab studies how learned models accelerate scientific workflows — from PDE surrogates and experimental design to literature-grounded hypothesis generation — without treating benchmark wins as discovery.',
    array['Neural PDE surrogates and dynamical phase transitions','Active learning and experimental design under budget','Scientific literature → testable hypothesis pipelines','Uncertainty, calibration, and failure localization'],
    array['Controlled defect injection in world models','Reproducible training recipes with published configs','Ablations that name when a surrogate silently breaks'],
    array['Research contributor','Systems engineer','Domain collaborator'],
    'green',
    true
  ),
  (
    'mathematical-intelligence',
    'Mathematical Approaches to Intelligence',
    'Mathematical Intelligence',
    'Geometry, information, and theory that constrain what models can and cannot learn.',
    'We treat representation geometry, inductive bias, and information bottlenecks as first-class objects — not afterthoughts to scale. The lab connects classical theory to measurable structure inside modern models.',
    array['Latent manifold geometry and intrinsic dimension','Theory-laden structure in adaptive representations','Formalizing residual / surprise-bearing tokenization','Limits of generalization under distribution shift'],
    array['Probe suites on synthetic and real manifolds','Scaling-law aware experimental design','Proof-oriented writeups paired with runnable notebooks'],
    array['Theory researcher','ML engineer','Reviewer'],
    'blue',
    true
  ),
  (
    'robotics',
    'Robotics and Autonomous Intelligence',
    'Robotics',
    'Agents that plan, recover, and explain themselves when the world breaks.',
    'Autonomy fails at the edge cases. This lab focuses on recovery under perturbation, residual event streams, and evaluation protocols that punish confident wrongness.',
    array['Latent safety and recovery under perturbation','Residual event tokenization for continuous streams','Sim-to-real evaluation with explicit failure catalogs','Multi-agent coordination under partial observability'],
    array['Counterfactual defect worlds','Closed-loop demos with logged trajectories','Weekly postmortems on silent failure modes'],
    array['Robotics engineer','RL researcher','Hardware collaborator'],
    'red',
    true
  ),
  (
    'computational-finance',
    'Computational Finance and Economics',
    'Comp. Finance',
    'Markets as dynamical systems — models that are inspectable under stress.',
    'We build decision systems for financial and economic regimes where calibration, regime detection, and auditability matter more than leaderboard deltas.',
    array['Regime-aware forecasting and risk models','Market microstructure and agent-based simulation','Causal evaluation under non-stationarity','Governance-ready model cards for financial ML'],
    array['Walk-forward evaluation with frozen protocols','Adversarial stress tests on regime shifts','Public postmortems on what failed and why'],
    array['Quant researcher','ML engineer','Risk reviewer'],
    'violet',
    true
  ),
  (
    'real-world-ai',
    'Real-World AI Applications',
    'Real-World AI',
    'End-to-end systems that ship evidence, not decks.',
    'Applied threads that turn a narrow technical hypothesis into an inspectable prototype — with users, evaluators, or operators who can falsify the claim.',
    array['Text-to-structure and generative design tools','Documented research-to-product decision gates','Reliability under messy real inputs','Member-facing tools that dogfood our own methods'],
    array['30-day shipping checkpoints','User / evaluator sessions with written findings','Kill criteria decided before the first demo'],
    array['Founding engineer','Product-minded researcher','Designer'],
    'orange',
    true
  ),
  (
    'emerging',
    'Interdisciplinary & Emerging Projects',
    'Emerging',
    'Threads that do not fit a single lab — yet.',
    'A holding bay for interdisciplinary proposals, early probes, and cross-lab collaborations. Threads graduate into a home lab once scope, method, and ownership are clear.',
    array['Cross-lab collaborations with shared milestones','Early probes that need two weeks, not six months','Open calls for emerging problem statements'],
    array['Lightweight charters with explicit kill dates','Rotation of mentors across labs','Promotion criteria into a primary lab'],
    array['Any background with a falsifiable claim'],
    'bone',
    true
  )
on conflict (slug) do update set
  name = excluded.name,
  short_name = excluded.short_name,
  tagline = excluded.tagline,
  summary = excluded.summary,
  focus = excluded.focus,
  methods = excluded.methods,
  open_roles = excluded.open_roles,
  color = excluded.color,
  published = excluded.published,
  updated_at = now();

-- Seed competitions
insert into public.competitions (slug, title, summary, status, prize, deadline, lab_id, evaluation_protocol, published)
select
  'defect-worlds-challenge',
  'Defect Worlds Challenge',
  'Inject controlled defects into a shared world-model baseline and measure recovery quality under a frozen evaluation protocol.',
  'upcoming',
  'Lab invitation + featured project record',
  null,
  l.id,
  'Protocol freezes before submissions open. Scoring weights recovery quality, calibration under defect, and reproducibility of the submission package.',
  true
from public.labs l where l.slug = 'scientific-discovery'
on conflict (slug) do update set
  title = excluded.title,
  summary = excluded.summary,
  status = excluded.status,
  prize = excluded.prize,
  evaluation_protocol = excluded.evaluation_protocol,
  published = excluded.published,
  lab_id = excluded.lab_id,
  updated_at = now();

insert into public.competitions (slug, title, summary, status, prize, deadline, lab_id, evaluation_protocol, published)
select
  'residual-stream-hack',
  'Residual Stream Hack',
  'Compress a continuous sensor stream with residual event tokens and beat a published bitrate / fidelity frontier.',
  'upcoming',
  'Mentorship slot + demo day feature',
  null,
  l.id,
  'Entrants receive a fixed stream corpus and bitrate budget. Primary metric: fidelity under budget; secondary: recovery after stream corruption.',
  true
from public.labs l where l.slug = 'robotics'
on conflict (slug) do update set
  title = excluded.title,
  summary = excluded.summary,
  status = excluded.status,
  prize = excluded.prize,
  evaluation_protocol = excluded.evaluation_protocol,
  published = excluded.published,
  lab_id = excluded.lab_id,
  updated_at = now();

insert into public.partnerships (name, kind, summary, status, published)
select v.name, v.kind, v.summary, v.status, v.published
from (
  values
    (
      'Academic collaborators',
      'academic',
      'Co-advised research threads targeting strong venue submissions and clean open-source reference code. Selective — apply through the fellowship track.',
      'exploring',
      true
    ),
    (
      'Infrastructure partners',
      'infrastructure',
      'Compute, data, and tooling relationships that remove bottlenecks for member experiments — disclosed when active and material.',
      'exploring',
      true
    ),
    (
      'Builder communities',
      'community',
      'Discord and peer networks for demos, paper clubs, and cross-project critique. Community channels are opt-in and moderated.',
      'active',
      true
    )
) as v(name, kind, summary, status, published)
where not exists (
  select 1 from public.partnerships p where p.name = v.name
);

insert into public.schema_migrations (phase) values ('phase25') on conflict (phase) do nothing;
