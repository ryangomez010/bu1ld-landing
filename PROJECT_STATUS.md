# Project status

**Date:** 2026-07-19
**Branch:** `main`
**Governor phase:** 4 (Release candidate — Pass Two)
**Focus:** Public contribution journey + SEO + atomic applications

## Verified complete (local)

- typecheck / lint / release tests / smoke / build / `release:check` / `audit:ci`
- Schema through **phase33** in repo (`FINAL_SETUP.sql`)
- Homepage primary journey is project discovery, not membership-first signup
- Featured active projects section; honest empty state when none published
- Public routes emit canonical + Open Graph metadata; Organization JSON-LD present
- Login/signup marked noindex; robots deny private member surfaces
- phase33 atomic `submit_project_application` with direct insert privileges revoked
- Anonymous project detail uses public catalog columns only
- NeuralField background throttled / reduced; decorative clocks removed
- Landing-site release package under `landing-sites-release/`

## Implemented but partially verified

- Live applications require phase33 applied on Supabase
- Live program/competition submissions still need published DB rows
- Analytics events no-op until `VITE_ANALYTICS_DOMAIN` is configured

## Externally blocked

1. Apply `FINAL_SETUP.sql` through phase33
2. Secrets + Cloudflare deploy verification
3. OAuth / storage / email
4. Multi-account role smokes

## Portfolio note

FinanceMeta and VertexED canonical trees are dirty with concurrent work and were not overwritten this pass. Obscured Records static v2 has no git remote. Oakridge Codefest remains pending isolated verify.

## Quality gates

```bash
bun run typecheck && bun run lint && bun run test && bun run smoke && bun run release:check && bun run build
```
