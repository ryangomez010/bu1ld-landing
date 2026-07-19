-- phase33: atomic project application submission
-- Inserts the application and its project-specific answers in one transaction.

revoke insert on table public.project_applications from authenticated;
revoke insert on table public.project_application_answers from authenticated;
drop policy if exists "Members apply to projects" on public.project_applications;
drop policy if exists "Applicants insert answers" on public.project_application_answers;

create or replace function public.submit_project_application(
  p_project_id uuid,
  p_pitch text,
  p_answers jsonb default '[]'::jsonb
)
returns public.project_applications
language plpgsql
security definer
set search_path = public
as $$
declare
  project_row public.projects;
  application_row public.project_applications;
  safe_pitch text := trim(coalesce(p_pitch, ''));
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if char_length(safe_pitch) not between 20 and 4000 then
    raise exception 'Pitch must be between 20 and 4000 characters';
  end if;
  if jsonb_typeof(coalesce(p_answers, '[]'::jsonb)) <> 'array' then
    raise exception 'Application answers must be an array';
  end if;

  select * into project_row
  from public.projects
  where id = p_project_id
  for update;
  if not found then raise exception 'Project not found'; end if;
  if project_row.published is not true or project_row.status <> 'open' then
    raise exception 'This project is not accepting applications';
  end if;
  if project_row.team_count >= project_row.capacity then
    raise exception 'This project is at capacity';
  end if;
  if project_row.lead_id = auth.uid() then
    raise exception 'Project leads cannot apply to their own project';
  end if;
  if exists (
    select 1 from public.project_memberships m
    where m.project_id = p_project_id
      and m.user_id = auth.uid()
      and m.status in ('active', 'paused')
  ) then
    raise exception 'You are already a member of this project';
  end if;
  if exists (
    select 1 from public.project_applications a
    where a.project_id = p_project_id and a.user_id = auth.uid()
  ) then
    raise exception 'You already applied to this project';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(coalesce(p_answers, '[]'::jsonb)) item
    where not (item ? 'questionId')
       or not (item ? 'answer')
       or jsonb_typeof(item -> 'questionId') <> 'string'
       or jsonb_typeof(item -> 'answer') <> 'string'
       or (item ->> 'questionId') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
       or char_length(trim(item ->> 'answer')) > 4000
  ) then
    raise exception 'Application answers are malformed';
  end if;

  if exists (
    select 1
    from (
      select item ->> 'questionId' as question_id, count(*) as answer_count
      from jsonb_array_elements(coalesce(p_answers, '[]'::jsonb)) item
      group by item ->> 'questionId'
    ) supplied
    where supplied.answer_count > 1
  ) then
    raise exception 'Each application question may be answered once';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(coalesce(p_answers, '[]'::jsonb)) item
    left join public.project_application_questions q
      on q.id = (item ->> 'questionId')::uuid
      and q.project_id = p_project_id
    where q.id is null
  ) then
    raise exception 'An application answer references an invalid question';
  end if;

  if exists (
    select 1
    from public.project_application_questions q
    where q.project_id = p_project_id
      and q.required is true
      and not exists (
        select 1
        from jsonb_array_elements(coalesce(p_answers, '[]'::jsonb)) item
        where (item ->> 'questionId')::uuid = q.id
          and char_length(trim(item ->> 'answer')) between 1 and 4000
      )
  ) then
    raise exception 'Answer every required application question';
  end if;

  insert into public.project_applications (project_id, user_id, pitch, status)
  values (p_project_id, auth.uid(), safe_pitch, 'pending')
  returning * into application_row;

  insert into public.project_application_answers (application_id, question_id, answer)
  select
    application_row.id,
    (item ->> 'questionId')::uuid,
    trim(item ->> 'answer')
  from jsonb_array_elements(coalesce(p_answers, '[]'::jsonb)) item
  where char_length(trim(item ->> 'answer')) between 1 and 4000;

  return application_row;
end;
$$;

revoke all on function public.submit_project_application(uuid, text, jsonb) from public;
grant execute on function public.submit_project_application(uuid, text, jsonb) to authenticated;

insert into public.schema_migrations (phase) values ('phase33')
on conflict (phase) do nothing;
