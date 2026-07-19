# Execution Plan

Updated: 2026-07-19

## Current milestone

Build an executable portfolio preflight for the BU1LD-centered workspace.

## Why this milestone

The portfolio now has a static registry, but static docs decay quickly. The next highest-leverage step is a reproducible command that inspects the active roots, reads the canonical registry, detects release blockers, and emits audit artifacts that Cursor and external reviewers can rerun.

## Acceptance criteria

- A local command inspects all configured portfolio roots.
- The command reports repository path, branch, dirty state, detected commands, migrations, placeholder risks, secret-like source risks, broken local Markdown links, evidence level, and release blockers.
- The command writes JSON and Markdown artifacts under `research/preflight/`.
- Tests cover status parsing, risk detection, registry mapping, broken link detection, and blocker generation.
- The command does not print `.env` contents or secret values.
- Existing product/UI work is preserved.

## Dependency order

1. Add scanner library and CLI.
2. Add test coverage for deterministic scanner behavior.
3. Add product handoff docs.
4. Run `bun run portfolio:preflight`.
5. Run typecheck, tests, lint, build, and local release gate.
6. Record evidence and limitations.
