-- Rollback-only phase36 integration scenarios. NOT EXECUTED by Codex.
-- Run as the database owner in a staging project after phase36, with one existing
-- platform admin and one ordinary member. Synthetic fixture attestations below
-- test guards only; they do not approve any real paper or persist any record.
begin;
do $$
declare editor uuid; member uuid;
begin
  select id into editor from public.profiles where role = 'admin' limit 1;
  select id into member from public.profiles where role = 'member' and not public.is_platform_admin(id) limit 1;
  if editor is null or member is null then raise exception 'Staging fixtures require an admin and an ordinary member.'; end if;
  perform set_config('test.paper_editor', editor::text, true);
  perform set_config('test.paper_member', member::text, true);
  perform set_config('request.jwt.claim.sub', editor::text, true);
end;
$$;
set local role authenticated;
do $$
declare pid uuid; w public.paper_editorial_workflows; before_hash text; stale_token uuid; denied boolean; evidence jsonb; body text;
begin
  body := (select string_agg('## Section ' || n || E'\n' || repeat('fixture ', 90), E'\n') from generate_series(1, 8) n);
  insert into public.papers (slug, title, authors, summary, editorial_summary, review_body, source_url, published, review_status)
    values ('editorial-fixture-' || gen_random_uuid(), 'Synthetic editorial guard fixture', 'Fixture author',
      'Synthetic fixture summary used only to exercise database guards and rolled back.',
      'Synthetic fixture summary used only to exercise database guards and rolled back.',
      body, 'https://example.org/paper', true, 'published') returning id into pid;
  perform set_config('test.paper_id', pid::text, true);
  if (select published from public.papers where id = pid) then raise exception 'FAIL insert published directly'; end if;
  select * into w from public.paper_editorial_workflows where paper_id = pid;
  before_hash := w.revision_hash;
  denied := false;
  begin update public.papers set published = true, review_status = 'published' where id = pid;
  exception when raise_exception then denied := true; end;
  if not denied then raise exception 'FAIL direct publish bypass'; end if;
  denied := false;
  begin update public.paper_editorial_workflows set state = 'approved' where paper_id = pid;
  exception when insufficient_privilege then denied := true; end;
  if not denied then raise exception 'FAIL direct workflow write'; end if;
  denied := false;
  begin perform public.transition_paper_editorial(pid, 'source_check', before_hash, w.decision_token, '{}');
  exception when raise_exception then denied := true; end;
  if not denied then raise exception 'FAIL missing source evidence'; end if;
  evidence := jsonb_build_object('human_attestation', true, 'full_text_read', true, 'appendices_inspected', true,
    'figures_inspected', true, 'full_text_url', 'https://example.org/fulltext', 'source_sha256', repeat('a',64),
    'source_version','fixture-v1','license','test fixture', 'notes',repeat('Synthetic fixture only. ',3),
    'ai_disclosure','Synthetic test evidence; no real paper reviewed.',
    'checked_by',current_setting('test.paper_member'), 'checked_at','1900-01-01',
    'citations',jsonb_build_array(
      jsonb_build_object('url','https://example.org/paper','locator','Table 1','claim','Synthetic claim for guard testing.'),
      jsonb_build_object('url','https://example.org/paper','locator','Table 2','claim','Synthetic claim for guard testing.'),
      jsonb_build_object('url','https://example.org/paper','locator','Table 3','claim','Synthetic claim for guard testing.')));
  w := public.transition_paper_editorial(pid, 'source_check', before_hash, w.decision_token, evidence);
  if w.checked_by::text <> current_setting('test.paper_editor') or w.checked_at <> now()
    or w.source_evidence ? 'checked_by' or w.source_evidence ? 'checked_at' then raise exception 'FAIL caller forged actor or timestamp'; end if;
  denied := false;
  begin perform public.transition_paper_editorial(pid, 'approve', before_hash, w.decision_token, jsonb_build_object('human_attestation',true,'note',repeat('Test approval. ',4)));
  exception when raise_exception then denied := true; end;
  if not denied then raise exception 'FAIL approve before submission'; end if;
  w := public.transition_paper_editorial(pid, 'submit', before_hash, w.decision_token);
  stale_token := w.decision_token;
  w := public.transition_paper_editorial(pid, 'request_changes', before_hash, w.decision_token,
    jsonb_build_object('note','Synthetic replacement of source evidence for ABA test.'));
  evidence := jsonb_set(evidence, '{source_sha256}', to_jsonb(repeat('b',64)));
  w := public.transition_paper_editorial(pid, 'source_check', before_hash, w.decision_token, evidence);
  w := public.transition_paper_editorial(pid, 'submit', before_hash, w.decision_token);
  denied := false;
  begin perform public.transition_paper_editorial(pid, 'approve', before_hash, stale_token,
    jsonb_build_object('human_attestation',true,'note',repeat('Stale evidence approval. ',3)));
  exception when raise_exception then denied := true; end;
  if not denied then raise exception 'FAIL same-content changed-evidence ABA approval'; end if;
  denied := false;
  begin perform public.transition_paper_editorial(pid, 'approve', repeat('b',64), w.decision_token, jsonb_build_object('human_attestation',true,'note',repeat('Test approval. ',4)));
  exception when raise_exception then denied := true; end;
  if not denied then raise exception 'FAIL stale approval'; end if;
  w := public.transition_paper_editorial(pid, 'approve', before_hash, w.decision_token, jsonb_build_object('human_attestation',true,'note',repeat('Synthetic test approval only. ',3)));
  if (select published from public.papers where id = pid) then raise exception 'FAIL approval published automatically'; end if;
  w := public.transition_paper_editorial(pid, 'publish', before_hash, w.decision_token);
  if not (select published from public.papers where id = pid) then raise exception 'FAIL approved publication'; end if;
  update public.papers set review_body = review_body || ' Changed.' where id = pid;
  select * into w from public.paper_editorial_workflows where paper_id = pid;
  if w.state <> 'draft' or w.checked_at is not null or w.approved_at is not null
    or w.revision_hash = before_hash or (select published from public.papers where id = pid) then raise exception 'FAIL stale checks survived material edit'; end if;
  if not exists(select 1 from public.paper_editorial_events where paper_id = pid and to_state = 'approved') then raise exception 'FAIL prior approval audit lost'; end if;
  denied := false;
  begin perform public.transition_paper_editorial(pid, 'publish', w.revision_hash, w.decision_token);
  exception when raise_exception then denied := true; end;
  if not denied then raise exception 'FAIL republish edited revision'; end if;
end;
$$;
select set_config('request.jwt.claim.sub', current_setting('test.paper_member'), true);
do $$
declare denied boolean := false;
begin
  if exists(select 1 from public.paper_editorial_workflows) then raise exception 'FAIL member read editorial evidence'; end if;
  begin perform public.transition_paper_editorial(current_setting('test.paper_id')::uuid, 'publish', repeat('a',64), gen_random_uuid());
  exception when raise_exception then denied := true; end;
  if not denied then raise exception 'FAIL non-editor decision'; end if;
end;
$$;
reset role;
set local role anon;
do $$
declare denied boolean := false;
begin
  begin perform * from public.paper_editorial_events;
  exception when insufficient_privilege then denied := true; end;
  if not denied then raise exception 'FAIL anonymous audit access'; end if;
  denied := false;
  begin perform public.transition_paper_editorial(current_setting('test.paper_id')::uuid,'publish',repeat('a',64),gen_random_uuid());
  exception when insufficient_privilege then denied := true; end;
  if not denied then raise exception 'FAIL anonymous RPC'; end if;
end;
$$;
reset role;
select set_config('request.jwt.claim.sub', current_setting('test.paper_editor'), true);
set local role authenticated;
delete from public.papers where id = current_setting('test.paper_id')::uuid;
do $$ begin
  if not exists(select 1 from public.paper_editorial_events where paper_identity = current_setting('test.paper_id')::uuid and paper_id is null)
    then raise exception 'FAIL audit erased by paper deletion'; end if;
end; $$;
reset role;
rollback;
