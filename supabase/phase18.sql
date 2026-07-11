-- Phase 18 — secure cross-user notifications + project subscriber lookup
-- Run after phase17.sql

-- Helper: caller may notify a project subscriber/team member when posting updates.
create or replace function public.can_notify_project_subscriber(
  caller_id uuid,
  p_project_id uuid,
  target_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.projects pr
    where pr.id = p_project_id
      and (
        pr.lead_id = caller_id
        or exists (
          select 1
          from public.project_applications pa
          where pa.project_id = p_project_id
            and pa.user_id = caller_id
            and pa.status = 'accepted'
        )
        or exists (
          select 1 from public.profiles p where p.id = caller_id and p.role = 'admin'
        )
      )
  )
  and (
    target_id = (select lead_id from public.projects where id = p_project_id)
    or exists (
      select 1
      from public.project_follows pf
      where pf.project_id = p_project_id
        and pf.user_id = target_id
        and pf.notify_updates = true
    )
    or exists (
      select 1
      from public.project_applications pa
      where pa.project_id = p_project_id
        and pa.user_id = target_id
        and pa.status = 'accepted'
    )
  );
$$;

-- Insert notifications for other users (SECURITY DEFINER bypasses RLS with auth checks).
create or replace function public.notify_users(
  target_user_ids uuid[],
  p_title text,
  p_body text,
  p_href text default null,
  p_project_id uuid default null
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  caller_role text;
  target_id uuid;
  inserted int := 0;
  safe_title text;
  safe_body text;
  safe_href text;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  safe_title := left(trim(coalesce(p_title, '')), 200);
  safe_body := left(trim(coalesce(p_body, '')), 500);
  safe_href := nullif(left(trim(coalesce(p_href, '')), ''), '');

  if safe_title = '' or safe_body = '' then
    return 0;
  end if;

  if safe_href is not null and safe_href !~ '^(/|https://)' then
    safe_href := null;
  end if;

  select role into caller_role from public.profiles where id = uid;

  foreach target_id in array coalesce(target_user_ids, '{}') loop
    if target_id is null then
      continue;
    end if;

    if not (
      target_id = uid
      or caller_role = 'admin'
      or (
        caller_role in ('project_lead', 'admin')
        and exists (
          select 1
          from public.project_applications pa
          join public.projects pr on pr.id = pa.project_id
          where pa.user_id = target_id
            and pr.lead_id = uid
        )
      )
      or (
        p_project_id is not null
        and public.can_notify_project_subscriber(uid, p_project_id, target_id)
      )
    ) then
      continue;
    end if;

    insert into public.notifications (user_id, title, body, href, read)
    values (target_id, safe_title, safe_body, safe_href, false);
    inserted := inserted + 1;
  end loop;

  return inserted;
end;
$$;

-- Return follower + accepted-member IDs for project update fan-out (bypasses project_follows RLS).
create or replace function public.get_project_update_subscribers(p_project_id uuid)
returns setof uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1
    from public.projects pr
    where pr.id = p_project_id
      and (
        pr.lead_id = uid
        or exists (
          select 1
          from public.project_applications pa
          where pa.project_id = p_project_id
            and pa.user_id = uid
            and pa.status = 'accepted'
        )
        or exists (
          select 1 from public.profiles p where p.id = uid and p.role = 'admin'
        )
      )
  ) then
    raise exception 'Not authorized';
  end if;

  return query
    select distinct s.user_id
    from (
      select pf.user_id
      from public.project_follows pf
      where pf.project_id = p_project_id
        and pf.notify_updates = true
      union
      select pa.user_id
      from public.project_applications pa
      where pa.project_id = p_project_id
        and pa.status = 'accepted'
    ) s;
end;
$$;

-- Atomic reading activity increment (avoids read-modify-write races).
create or replace function public.increment_reading_activity(p_user_id uuid, p_date date)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'Not authorized';
  end if;

  insert into public.reading_activity (user_id, activity_date, papers_read)
  values (p_user_id, p_date, 1)
  on conflict (user_id, activity_date)
  do update set papers_read = public.reading_activity.papers_read + 1;
end;
$$;

-- Track applied migration phases.
create table if not exists public.schema_migrations (
  phase text primary key,
  applied_at timestamptz not null default now()
);

insert into public.schema_migrations (phase)
values ('phase18')
on conflict (phase) do nothing;

grant execute on function public.notify_users(uuid[], text, text, text, uuid) to authenticated;
grant execute on function public.get_project_update_subscribers(uuid) to authenticated;
grant execute on function public.increment_reading_activity(uuid, date) to authenticated;
