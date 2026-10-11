# Project status

**Date:** 2026-10-11
**Branch:** `main`
**Governor phase:** 4 (Release candidate — Pass Two)
**Focus:** Unified membership workspace + linked, evidence-gated portfolio network

## Verified complete (local)

- Current checkout: typecheck, lint, **164 tests**, 24-route smoke, research-state validation, high-severity dependency audit, frozen-lockfile install, and development client/SSR build pass
- Schema through **phase34** in repo (`FINAL_SETUP.sql`)
- Homepage primary journey is project discovery, not membership-first signup
- Featured active projects section; honest empty state when none published
- Public routes emit canonical + Open Graph metadata; Organization JSON-LD present
- Login/signup marked noindex; robots deny private member surfaces
- phase33 atomic `submit_project_application` with direct insert privileges revoked
- Anonymous project detail uses public catalog columns only
- NeuralField background throttled / reduced; decorative clocks removed
- Landing-site release package under `landing-sites-release/`
- Member-facing `/workspace` unifies durable memberships, milestone-linked contribution submission, revision/resubmission, explicit verification states, and JSON evidence export
- Workspace is linked from desktop/mobile navigation, command palette, dashboard, and accepted applications
- `/network` links verified public destinations and all 20 canonical portfolio identities without publishing local paths or bypassing owner-only access
- Network projection tests enforce the canonical 17 bound / 3 unresolved split and exact binding metadata

## Implemented but partially verified

- Live applications require phase33 applied on Supabase; private member workspaces require phase34
- `/workspace` compiles in client/SSR development builds; signed-out browser QA confirms one stable `/login?redirect=%2Fworkspace` redirect with no nesting loop
- Production build and `release:check` fail closed until `VITE_SUPABASE_URL` and an anon/publishable key are supplied
- Live program/competition submissions still need published DB rows
- Analytics events no-op until `VITE_ANALYTICS_DOMAIN` is configured

## Externally blocked

1. Apply `FINAL_SETUP.sql` through phase34
2. Secrets + Cloudflare deploy verification
3. OAuth / storage / email
4. Multi-account role smokes

## Portfolio note

FinanceMeta and VertexED canonical trees are dirty with concurrent work and were not overwritten this pass. FinanceMeta and the VertexED fallback deployment returned HTTP 200 on 2026-10-11; the VertexED custom domain still fails TLS. Obscured Records remains owner-only and returns HTTP 401 by design. Oakridge Codefest remains pending isolated verify.

## Quality gates

```bash
bun run typecheck && bun run lint && bun run test && bun run smoke && bun run release:check && bun run build
```
