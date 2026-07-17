-- Phase 23 — private research paper analyzer workspace.
-- Apply after phase22.sql.

create table if not exists public.paper_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 4 and 180),
  source_url text check (source_url is null or source_url ~ '^https?://'),
  input_kind text not null default 'text' check (input_kind in ('text')),
  input_excerpt text not null check (char_length(trim(input_excerpt)) between 200 and 2400),
  input_sha256 text not null check (input_sha256 ~ '^[a-f0-9]{64}$'),
  status text not null default 'completed' check (status in ('completed', 'failed')),
  provider text not null default 'local_structured_v1' check (provider in ('local_structured_v1')),
  prompt_version text not null default 'paper-analysis-v1',
  structured_result jsonb not null check (
    jsonb_typeof(structured_result) = 'object'
    and structured_result ? 'problem'
    and structured_result ? 'contribution'
    and structured_result ? 'method'
    and structured_result ? 'limitations'
    and structured_result ? 'safety_note'
    and jsonb_typeof(structured_result -> 'problem') = 'array'
    and jsonb_typeof(structured_result -> 'contribution') = 'array'
    and jsonb_typeof(structured_result -> 'method') = 'array'
    and jsonb_typeof(structured_result -> 'limitations') = 'array'
    and jsonb_typeof(structured_result -> 'safety_note') = 'string'
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists paper_analyses_user_created_idx
  on public.paper_analyses (user_id, created_at desc);
create index if not exists paper_analyses_hash_idx
  on public.paper_analyses (user_id, input_sha256);

alter table public.paper_analyses enable row level security;
revoke all on table public.paper_analyses from anon;
grant select, insert, delete on table public.paper_analyses to authenticated;

drop policy if exists "Members read their paper analyses" on public.paper_analyses;
create policy "Members read their paper analyses" on public.paper_analyses for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
  );

drop policy if exists "Members create their paper analyses" on public.paper_analyses;
create policy "Members create their paper analyses" on public.paper_analyses for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and jsonb_array_length(coalesce(structured_result -> 'problem', '[]'::jsonb)) <= 6
    and jsonb_array_length(coalesce(structured_result -> 'contribution', '[]'::jsonb)) <= 6
    and jsonb_array_length(coalesce(structured_result -> 'method', '[]'::jsonb)) <= 6
    and jsonb_array_length(coalesce(structured_result -> 'limitations', '[]'::jsonb)) <= 6
  );

drop policy if exists "Members delete their paper analyses" on public.paper_analyses;
create policy "Members delete their paper analyses" on public.paper_analyses for delete
  to authenticated
  using (
    user_id = (select auth.uid())
    or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
  );

insert into public.schema_migrations (phase) values ('phase23') on conflict (phase) do nothing;
