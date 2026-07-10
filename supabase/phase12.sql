-- Phase 12 — portal search RPC, admin audit log, project workspace links

alter table public.projects
  add column if not exists workspace_links jsonb not null default '[]'::jsonb;

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null check (char_length(action) <= 120),
  target_type text check (target_type is null or char_length(target_type) <= 60),
  target_id text check (target_id is null or char_length(target_id) <= 200),
  detail jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_log_created_idx on public.admin_audit_log (created_at desc);

alter table public.admin_audit_log enable row level security;

drop policy if exists "Admins read audit log" on public.admin_audit_log;
create policy "Admins read audit log"
  on public.admin_audit_log for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "Admins insert audit log" on public.admin_audit_log;
create policy "Admins insert audit log"
  on public.admin_audit_log for insert
  with check (
    auth.uid() = actor_id
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create or replace function public.search_portal_content(search_query text)
returns table (
  content_type text,
  slug text,
  title text,
  summary text,
  rank integer
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  q text := trim(search_query);
  like_q text;
begin
  if auth.uid() is null or length(q) < 2 then
    return;
  end if;

  like_q := '%' || replace(replace(q, '%', ''), '_', '') || '%';

  return query
  select * from (
    select
      'paper'::text,
      p.slug,
      p.title,
      coalesce(p.summary, ''),
      (case when p.title ilike like_q then 12 else 0 end)
        + (case when p.summary ilike like_q then 6 else 0 end)
        + (case when p.review_body ilike like_q then 3 else 0 end)
    from public.papers p
    where p.published
      and (p.title ilike like_q or p.summary ilike like_q or p.review_body ilike like_q)

    union all

    select
      'event'::text,
      e.slug,
      e.title,
      coalesce(e.summary, ''),
      (case when e.title ilike like_q then 12 else 0 end)
        + (case when e.summary ilike like_q then 5 else 0 end)
    from public.events e
    where e.published
      and (e.title ilike like_q or e.summary ilike like_q)

    union all

    select
      'project'::text,
      pr.slug,
      pr.title,
      left(pr.description, 160),
      (case when pr.title ilike like_q then 12 else 0 end)
        + (case when pr.description ilike like_q then 4 else 0 end)
    from public.projects pr
    where pr.published
      and (pr.title ilike like_q or pr.description ilike like_q)

    union all

    select
      'job'::text,
      j.slug,
      j.title,
      left(j.company || ' — ' || j.description, 160),
      (case when j.title ilike like_q then 10 else 0 end)
        + (case when j.description ilike like_q then 4 else 0 end)
    from public.jobs j
    where j.published
      and (j.title ilike like_q or j.description ilike like_q or j.company ilike like_q)

    union all

    select
      'newsletter'::text,
      n.slug,
      n.title,
      coalesce(n.summary, ''),
      (case when n.title ilike like_q then 10 else 0 end)
        + (case when n.summary ilike like_q then 4 else 0 end)
    from public.newsletter_issues n
    where n.published
      and (n.title ilike like_q or n.summary ilike like_q)
  ) hits
  where rank > 0
  order by rank desc, title asc
  limit 40;
end;
$$;

revoke all on function public.search_portal_content(text) from public;
grant execute on function public.search_portal_content(text) to authenticated;
