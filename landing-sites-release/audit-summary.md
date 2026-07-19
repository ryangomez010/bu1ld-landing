# Landing-site audit summary — 2026-07-19

## Mode

Continuation + Multi-Site Portfolio. Highest finishable site first: **The Bu1LD**.

## Discovery

| Organization | Canonical path | Decision |
|---|---|---|
| The Bu1LD | `the-bu1ld-nexus-main` | Canonical; Pass Two completed locally |
| FinanceMeta | `finance4all-global-reach-main` | Canonical but dirty concurrent branch — not overwritten |
| VertexED.ai | `VertexEDU` | Canonical public product; dirty concurrent branch — not overwritten |
| Obscured Records | `obscured-records-v2` | Static editorial prototype; no git remote |
| Oakridge Codefest | `OakridgeCodefest2027/oakridge-codefest-2027` | Canonical 2027 event site |
| Obscured Records Agent | `ObscuredRecordsAgent` | Reel production agent, not landing |
| FinanceMetaWeb / VertexED docs shells | incomplete | Not canonical |

## Highest-impact Pass Two findings on The Bu1LD

1. Primary CTA pointed at membership signup instead of project discovery.
2. First-visit cinematic intro delayed comprehension and conversion.
3. Public SEO lacked per-route canonicals and structured Organization data.
4. Decorative clocks forced 1 Hz re-renders in header/footer.
5. Neural field background was denser and less motion-aware than needed.
6. Project applications and required answers were written in two non-atomic requests, enabling half-created applications.
7. Direct authenticated inserts into application tables bypassed the hardened RPC path.

## Not claimed

- Live Cloudflare deploy
- Live Supabase phase33 application
- FinanceMeta / VertexED completion in this pass
- Obscured Records production readiness
