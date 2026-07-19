# Final release report — Landing Pass Two

## Project

- Detected project: The Bu1ld Nexus (portfolio landing finisher, continuation mode)
- Pass completed: Pass Two — adversarial landing conversion, SEO, performance, and application integrity
- Branch: `main`
- Starting commit: `c72fe2abf34aeca853526362af3a0b78347bff55`
- Ending commit: pending commit
- Push result: pending

## What was discovered

- Pass One left a strong member platform, but the public homepage still optimized for membership signup rather than project contribution.
- First-visit cinematic intro and perpetual decorative clocks harmed conversion and performance.
- SEO lacked route-level canonicals and Organization structured data.
- Project applications could become half-created if answer persistence failed after the application insert.

## What was changed

### Conversion / UX
- Hero primary CTA: Find a project → `/projects`
- Secondary CTA: Inspect public evidence
- Featured active projects section on homepage
- Header CTA and nav prioritize Projects / Evidence
- Footer rebuilt into Explore / Institution groups
- Removed GenesisIntro

### SEO / discoverability
- `src/lib/seo.ts` pageHead + privatePageHead helpers
- Canonical/OG/Twitter on public routes
- Organization JSON-LD in root shell
- robots.txt expanded for private surfaces
- sitemap trimmed of auth pages; people added

### Performance
- NeuralField density reduced; vignette cached; pointer listeners only on fine pointers; frame throttle; pause when hidden
- Removed 1 Hz header/footer clock re-renders

### Security / integrity
- `supabase/phase33.sql`: atomic `submit_project_application`
- Revoked direct authenticated inserts on applications and answers
- Client `applyToProject` now uses the RPC exclusively
- Anonymous project detail uses public columns only

### Tests
- Landing release, SEO, application-submit, release-artifact regressions

## Verification

| Check | Result |
|---|---|
| typecheck | PASS |
| release:check | PASS |
| audit:ci | PASS |
| smoke | PASS — 22 paths |
| production build | PASS |
| public HTTP probe | PASS — 12 routes with canonicals |
| Live deploy / live phase33 | BLOCKED on credentials |

## Portfolio status

| Site | Final state |
|---|---|
| The Bu1LD | Production release candidate (stronger than Pass One) |
| FinanceMeta | Blocked — dirty concurrent tree |
| VertexED.ai | Blocked — dirty concurrent tree |
| Obscured Records | Prototype static site, no git remote |
| Oakridge Codefest | Pending local verify after root switch |

## Remaining blockers

1. Apply phase33 to live Supabase and run role-separated application smoke.
2. Deploy Cloudflare with configured secrets.
3. Continue portfolio sites from clean checkouts without overwriting concurrent agent work.
