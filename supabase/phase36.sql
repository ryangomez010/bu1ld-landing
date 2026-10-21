-- Phase 36: human paper editorial workflow. UNAPPLIED until owner deployment.
-- Existing public rows retain an explicit legacy state, never an invented approval.
begin;

create table if not exists public.paper_editorial_workflows (
  paper_id uuid primary key references public.papers(id) on delete cascade,
  state text not null default 'draft' check (state in ('draft', 'source_checked', 'editorial_pending', 'approved', 'published', 'legacy_published', 'withdrawn')),
  revision_hash text not null,
  decision_token uuid not null default gen_random_uuid(),
  source_evidence jsonb not null default '{}',
  checked_by uuid references public.profiles(id) on delete set null,
  checked_at timestamptz,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  approval_note text,
  published_by uuid references public.profiles(id) on delete set null,
  published_at timestamptz,
  updated_at timestamptz not null default now()
);
create table if not exists public.paper_editorial_events (
  id bigint generated always as identity primary key,
  paper_id uuid references public.papers(id) on delete set null,
  paper_identity uuid not null,
  actor_id uuid references public.profiles(id) on delete set null,
  from_state text,
  to_state text not null,
  revision_hash text not null,
  evidence jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists paper_editorial_events_paper_idx
  on public.paper_editorial_events (paper_id, created_at desc, id desc);
alter table public.paper_editorial_workflows enable row level security;
alter table public.paper_editorial_events enable row level security;
revoke all on public.paper_editorial_workflows, public.paper_editorial_events from public, anon, authenticated;
grant select on public.paper_editorial_workflows, public.paper_editorial_events to authenticated;
drop policy if exists "Editors read paper workflow" on public.paper_editorial_workflows;
drop policy if exists "Editors read paper audit" on public.paper_editorial_events;
create policy "Editors read paper workflow" on public.paper_editorial_workflows
  for select to authenticated using ((select public.is_platform_admin()));

drop policy if exists "Admins manage papers" on public.papers;
create policy "Admins manage papers" on public.papers for all to authenticated
  using ((select public.is_platform_admin())) with check ((select public.is_platform_admin()));
create policy "Editors read paper audit" on public.paper_editorial_events
  for select to authenticated using ((select public.is_platform_admin()));

-- Bind all material metadata and text; operational timestamps/state are excluded.
create or replace function public.paper_revision_hash(p public.papers)
returns text language sql immutable set search_path = '' as $$
  select encode(sha256(convert_to((to_jsonb(p) - array['id', 'published', 'published_at', 'review_status', 'created_at', 'updated_at'])::text, 'UTF8')), 'hex');
$$;
create or replace function public.paper_quality_issues(p public.papers)
returns text[] language plpgsql immutable set search_path = '' as $$
declare issues text[] := '{}'; words integer;
begin
  words := cardinality(regexp_split_to_array(trim(coalesce(p.review_body, '')), '[[:space:]]+'));
  if length(trim(coalesce(p.title, ''))) < 5 then issues := array_append(issues, 'Add a descriptive title.'); end if;
  if length(trim(coalesce(p.authors, ''))) < 3 then issues := array_append(issues, 'Identify the paper authors.'); end if;
  if coalesce(p.source_url, p.arxiv_url, '') !~ '^https://[^/@?#[:space:]]+([/?#][^[:space:]]*)?$' then issues := array_append(issues, 'Add an HTTPS primary source.'); end if;
  if length(trim(coalesce(p.editorial_summary, p.summary, ''))) < 40 then issues := array_append(issues, 'Add an editorial summary of at least 40 characters.'); end if;
  if words < 700 or words > 1200 then issues := array_append(issues, 'The review must contain 700–1200 words.'); end if;
  if (select count(*) from regexp_matches(p.review_body, '^##[[:space:]]+[^#]', 'gn')) < 8 then issues := array_append(issues, 'Use eight clearly headed review sections.'); end if;
  return issues;
end;
$$;

insert into public.paper_editorial_workflows (paper_id, state, revision_hash)
  select p.id, case when p.published and p.review_status = 'published' then 'legacy_published' else 'draft' end,
    public.paper_revision_hash(p) from public.papers p
  on conflict (paper_id) do nothing;
insert into public.paper_editorial_events (paper_id, paper_identity, to_state, revision_hash, evidence)
  select w.paper_id, w.paper_id, w.state, w.revision_hash,
    jsonb_build_object('migration', 'phase36', 'note', 'Imported existing state; no historical source check or approval asserted.')
  from public.paper_editorial_workflows w
  where not exists (select 1 from public.paper_editorial_events e where e.paper_id = w.paper_id);

create or replace function public.guard_paper_editorial_publication()
returns trigger language plpgsql security definer set search_path = '' as $$
declare w public.paper_editorial_workflows; revision text;
begin
  if tg_op = 'INSERT' then
    new.published := false;
    new.review_status := 'draft';
    return new;
  end if;
  revision := public.paper_revision_hash(new);
  select * into w from public.paper_editorial_workflows where paper_id = old.id for update;
  if not found then raise exception 'Paper editorial workflow unavailable.'; end if;
  if revision is distinct from w.revision_hash then
    -- Editing a checked or public revision always revokes its old evidence and approval.
    insert into public.paper_editorial_events (paper_id, paper_identity, actor_id, from_state, to_state, revision_hash, evidence)
      values (old.id, old.id, auth.uid(), w.state, 'draft', revision,
        jsonb_build_object('reason', 'Material content changed; prior checks retained in audit history.'));
    update public.paper_editorial_workflows set state = 'draft', revision_hash = revision, decision_token = gen_random_uuid(),
      source_evidence = '{}', checked_by = null, checked_at = null, approved_by = null,
      approved_at = null, approval_note = null, published_by = null, published_at = null, updated_at = now()
      where paper_id = old.id;
    new.published := false;
    new.review_status := 'draft';
  elsif new.published is distinct from old.published
    or new.review_status is distinct from old.review_status
    or new.published_at is distinct from old.published_at then
    if auth.uid() is null or not public.is_platform_admin() then raise exception 'Editor access required.'; end if;
    if new.published then
      if w.state <> 'published' or w.approved_at is null or w.checked_at is null
        or w.published_by is distinct from auth.uid() or w.published_at is distinct from new.published_at
        or new.review_status <> 'published' then
        raise exception 'Publish through the approved editorial workflow.';
      end if;
    elsif w.state in ('published', 'legacy_published') or new.review_status <> 'draft' then
      raise exception 'Withdraw through the editorial workflow.';
    end if;
  end if;
  return new;
end;
$$;
create or replace function public.initialize_paper_editorial_workflow()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.paper_editorial_workflows (paper_id, revision_hash)
    values (new.id, public.paper_revision_hash(new));
  insert into public.paper_editorial_events (paper_id, paper_identity, actor_id, to_state, revision_hash)
    values (new.id, new.id, auth.uid(), 'draft', public.paper_revision_hash(new));
  return new;
end;
$$;
drop trigger if exists guard_paper_editorial_publication_trigger on public.papers;
create trigger guard_paper_editorial_publication_trigger before insert or update on public.papers
  for each row execute function public.guard_paper_editorial_publication();
drop trigger if exists initialize_paper_editorial_workflow_trigger on public.papers;
create trigger initialize_paper_editorial_workflow_trigger after insert on public.papers
  for each row execute function public.initialize_paper_editorial_workflow();

create or replace function public.transition_paper_editorial(
  p_paper_id uuid, p_action text, p_revision_hash text, p_decision_token uuid, p_evidence jsonb default '{}'
) returns public.paper_editorial_workflows
language plpgsql security definer set search_path = '' as $$
declare p public.papers; w public.paper_editorial_workflows; previous text; issues text[]; citation jsonb;
begin
  if auth.uid() is null or not public.is_platform_admin() then raise exception 'Editor access required.'; end if;
  -- Consistent lock order with direct editing: paper first, then workflow.
  select * into p from public.papers where id = p_paper_id for update;
  if not found then raise exception 'Paper not found.'; end if;
  select * into w from public.paper_editorial_workflows where paper_id = p_paper_id for update;
  if not found then raise exception 'Paper editorial workflow unavailable.'; end if;
  if p_revision_hash is null or w.revision_hash <> p_revision_hash or w.revision_hash <> public.paper_revision_hash(p) then
    raise exception 'This revision changed. Reload before recording a decision.';
  end if;
  if p_decision_token is null or w.decision_token <> p_decision_token then
    raise exception 'The editorial evidence or state changed. Reload before recording a decision.';
  end if;
  if p_action is null or p_action not in ('source_check', 'submit', 'approve', 'publish', 'withdraw', 'request_changes') then raise exception 'Invalid editorial action.'; end if;
  if p_evidence is null or jsonb_typeof(p_evidence) <> 'object' or octet_length(p_evidence::text) > 32000 then raise exception 'Invalid editorial evidence.'; end if;
  previous := w.state;
  if p_action in ('source_check', 'submit', 'approve', 'publish') then
    issues := public.paper_quality_issues(p);
    if cardinality(issues) > 0 then raise exception '%', array_to_string(issues, ' '); end if;
  end if;
  if p_action = 'source_check' then
    if w.state <> 'draft' then raise exception 'Source checks require a private draft.'; end if;
    if p_evidence->>'human_attestation' is distinct from 'true'
      or p_evidence->>'full_text_read' is distinct from 'true'
      or p_evidence->>'appendices_inspected' is distinct from 'true'
      or p_evidence->>'figures_inspected' is distinct from 'true' then
      raise exception 'Explicit human full-text, appendix and figure attestation required.';
    end if;
    if coalesce(p_evidence->>'full_text_url', '') !~ '^https://[^/@?#[:space:]]+([/?#][^[:space:]]*)?$'
      or coalesce(p_evidence->>'source_sha256', '') !~ '^[a-f0-9]{64}$'
      or length(trim(coalesce(p_evidence->>'source_version', ''))) < 1
      or length(trim(coalesce(p_evidence->>'license', ''))) < 3
      or length(trim(coalesce(p_evidence->>'notes', ''))) < 40
      or length(trim(coalesce(p_evidence->>'ai_disclosure', ''))) < 10 then
      raise exception 'Provide source version, license, SHA256, full-text URL, check notes and AI disclosure.';
    end if;
    if jsonb_typeof(p_evidence->'citations') is distinct from 'array' then raise exception 'Provide at least three claim-level citations.'; end if;
    if jsonb_array_length(p_evidence->'citations') < 3 then raise exception 'Provide at least three claim-level citations.'; end if;
    for citation in select value from jsonb_array_elements(p_evidence->'citations') loop
      if coalesce(citation->>'url', '') !~ '^https://[^/@?#[:space:]]+([/?#][^[:space:]]*)?$'
        or length(trim(coalesce(citation->>'locator', ''))) < 3
        or length(trim(coalesce(citation->>'claim', ''))) < 10 then raise exception 'Each citation needs an HTTPS source, locator and supported claim.'; end if;
    end loop;
    w.state := 'source_checked'; w.checked_by := auth.uid(); w.checked_at := now();
    -- Whitelist fields; caller-supplied actor identities and timestamps are never trusted.
    w.source_evidence := jsonb_build_object('full_text_url', p_evidence->>'full_text_url', 'source_sha256', p_evidence->>'source_sha256',
      'source_version', p_evidence->>'source_version', 'license', p_evidence->>'license', 'notes', p_evidence->>'notes',
      'ai_disclosure', p_evidence->>'ai_disclosure', 'citations', p_evidence->'citations',
      'human_attestation', true, 'full_text_read', true, 'appendices_inspected', true, 'figures_inspected', true);
  elsif p_action = 'submit' then
    if w.state <> 'source_checked' then raise exception 'A recorded source check is required.'; end if;
    w.state := 'editorial_pending';
  elsif p_action = 'approve' then
    if w.state <> 'editorial_pending' or w.checked_at is null then raise exception 'Submit the checked revision for editorial review first.'; end if;
    if p_evidence->>'human_attestation' is distinct from 'true' or length(trim(coalesce(p_evidence->>'note', ''))) < 40 then
      raise exception 'Explicit human editorial approval and a 40-character rationale are required.';
    end if;
    w.state := 'approved'; w.approved_by := auth.uid(); w.approved_at := now(); w.approval_note := p_evidence->>'note';
  elsif p_action = 'publish' then
    if w.state <> 'approved' or w.approved_at is null or w.checked_at is null then raise exception 'Approve this checked revision before publishing.'; end if;
    w.state := 'published'; w.published_by := auth.uid(); w.published_at := now();
  elsif p_action = 'withdraw' then
    if w.state not in ('published', 'legacy_published') then raise exception 'Only a public paper can be withdrawn.'; end if;
    if length(trim(coalesce(p_evidence->>'note', ''))) < 10 then raise exception 'Record a withdrawal reason.'; end if;
    w.state := 'withdrawn'; w.published_by := null; w.published_at := null;
  elsif p_action = 'request_changes' then
    if length(trim(coalesce(p_evidence->>'note', ''))) < 10 then raise exception 'Record the requested changes.'; end if;
    w.state := 'draft'; w.source_evidence := '{}'; w.checked_by := null; w.checked_at := null;
    w.approved_by := null; w.approved_at := null; w.approval_note := null; w.published_by := null; w.published_at := null;
  end if;
  update public.paper_editorial_workflows set state = w.state, source_evidence = w.source_evidence, decision_token = gen_random_uuid(),
    checked_by = w.checked_by, checked_at = w.checked_at, approved_by = w.approved_by, approved_at = w.approved_at,
    approval_note = w.approval_note, published_by = w.published_by, published_at = w.published_at, updated_at = now()
    where paper_id = p_paper_id returning * into w;
  if p_action = 'publish' then
    update public.papers set published = true, review_status = 'published', published_at = w.published_at, updated_at = now() where id = p_paper_id;
  elsif p_action in ('withdraw', 'request_changes') then
    update public.papers set published = false, review_status = 'draft', updated_at = now() where id = p_paper_id;
  end if;
  insert into public.paper_editorial_events (paper_id, paper_identity, actor_id, from_state, to_state, revision_hash, evidence)
    values (p_paper_id, p_paper_id, auth.uid(), previous, w.state, w.revision_hash,
      case when p_action = 'source_check' then w.source_evidence
      else jsonb_build_object('action', p_action, 'note', p_evidence->>'note', 'human_attestation', p_action = 'approve') end);
  return w;
end;
$$;
revoke all on function public.paper_revision_hash(public.papers), public.paper_quality_issues(public.papers),
  public.guard_paper_editorial_publication(), public.initialize_paper_editorial_workflow() from public, anon, authenticated;
revoke all on function public.transition_paper_editorial(uuid, text, text, uuid, jsonb) from public, anon;
grant execute on function public.transition_paper_editorial(uuid, text, text, uuid, jsonb) to authenticated;
insert into public.schema_migrations (phase) values ('phase36') on conflict (phase) do nothing;
commit;
