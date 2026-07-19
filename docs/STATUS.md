# Status

Updated: 2026-07-19

## Current milestone

BU1LD public landing completion for an honest source release candidate (find a project → apply → evidence).

## Current state

- Dominant public journey is project discovery: hero, header, contact, membership, and apply CTAs lead with `/projects`.
- Project statuses are labeled Recruiting / Active / Completed (no invented experimental status).
- Public route metadata uses shared `pageHead` / `privatePageHead`; robots/sitemap keep auth and member surfaces out of the public index.
- Anonymous project detail fetches use public catalog columns only (no discord/workspace fields).
- Landing no longer gates visitors behind GenesisIntro; decorative clocks and duplicate `#top` ids removed.
- Local gates passed: typecheck, lint, 151+ unit tests, smoke, `release:check`, build, `audit:ci`, scoped `portfolio:preflight`.

## Not final-release complete

Public production claims still require live Supabase schema/RLS verification, Auth/OAuth/email checks, multi-role smoke tests, and a clean committed release branch. Dirty worktree remains intentional until the owner commits.

