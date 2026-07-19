# Next Handoff

Updated: 2026-07-19

## Immediate next step

Owner review of the dirty landing worktree, then commit when ready. Do not claim public production readiness until live gates below pass.

## External / live queue

1. Apply `FINAL_SETUP.sql` through phase33 on the live Supabase project; run `VERIFY_SETUP`.
2. Configure production secrets, Auth Site URL / redirects, OAuth, email/digest/deletion endpoints.
3. Run multi-account role smokes: visitor → member → project lead → reviewer → admin.
4. Run `BU1LD_RELEASE_STRICT=1 bun run release:check` in the deployment environment.
5. Confirm published project rows exist so the public catalog is not empty by omission.

## Do not do

- Do not invent partners, benchmarks, user counts, or experimental project statuses.
- Do not reintroduce cinematic intro gates or decorative per-second clock re-renders.
- Do not index `/login`, `/signup`, or member surfaces in the sitemap.
- Do not commit or push unless the owner explicitly asks.

