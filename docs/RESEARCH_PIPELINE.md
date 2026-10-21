# Portfolio Research Pipeline

The portfolio pipeline implements the initialization and evidence-control layer
for the research lifecycle. It deliberately does not declare a project complete
because a folder, paper draft, implementation, or smoke test exists.

## Canonical records

- `research/PROJECT_REGISTRY.yaml` is the project map for this pass.
- `research/SOURCE_BINDINGS.json` records recovered source identities and the
  unresolved-source cases.
- `research/project-states/<project-id>/STATE.json` is the canonical mutable
  state for one project.
- `research/project-states/<project-id>/HISTORY.jsonl` is append-only history.
- `research/pipeline/PORTFOLIO_STATUS.*` and `ACTION_QUEUE.json` are generated
  portfolio views; they are not independent evidence.

Every future research session must read the project `STATE.json` and
`HISTORY.jsonl` before changing the project, then update the state and append a
history event before finishing. Existing decisions, failed runs, negative
results, invalid evidence, and frozen protocols must not be deleted or rewritten.

## Commands

```bash
bun run research:pipeline
bun run research:pipeline:validate
```

Initialization is idempotent. It creates missing records and generated portfolio
views but does not overwrite an existing project's canonical state.

## Advancement rules

The ten checkpoints mirror the user-provided research contract. Every checkpoint
starts `NOT_READY`. Advancement requires retained evidence in the project state;
the pipeline never infers readiness from a README or a claimed status.

Development and confirmatory work remain separate. Protected evaluation stays
closed until Checkpoint 7 records a frozen question, hypothesis, source revision,
datasets and hashes, splits, baselines, hyperparameters, metrics, endpoint,
effect threshold, seed policy, exclusions, stopping rules, environment, and
compute protocol.

Terminal scientific outcomes are `SUPPORTED`, `MIXED`, `NEGATIVE`,
`INCONCLUSIVE`, or `INVALID`. Positive results are not required for completion.
Product and archive entries require an applicability decision instead of being
forced into a paper lifecycle.

## Automation boundary

Scheduled continuations may perform source/evidence inventory, documentation,
state reconciliation, low-cost checks, and already-authorized development work.
They must obey resource admission, preserve dirty worktrees, avoid opening
protected outcomes, avoid publishing or deploying, and leave external or
credentialed work explicitly blocked.
