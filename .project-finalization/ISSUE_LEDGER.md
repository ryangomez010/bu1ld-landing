# Issue ledger

| ID | Severity | Evidence / impact | Resolution | Status |
|---|---|---|---|---|
| FIN-001 | P0 | Reviewer RPC previously allowed an author who was also lead/admin/assigned reviewer to review their own submission | phase32 rejects self-review and self-assignment; client gate + regression tests | Fixed locally |
| FIN-002 | P1 | Admin overview emphasized inventory rather than blocked operations | Added contribution-review backlog, overdue milestones, unowned projects, and 30-day stalled projects | Fixed locally |
| FIN-003 | P1 | Account export omitted contribution evidence | Added contribution rows to full account export and dedicated verified-work export | Fixed locally |
| FIN-004 | P1 | Live Supabase/RLS/schema state is unknown | Apply through phase33 and run credentialed verification | External blocker |
| FIN-005 | P1 | OAuth/email/deletion/multi-account flows lack production evidence | Configure providers/secrets and execute role smoke protocol | External blocker |
| FIN-006 | P1 | No full Playwright suite for auth + role-separated project lifecycle | Add after test identities and a staging project exist | Open |
| FIN-007 | P2 | Public project key and project URL were committed in Wrangler | Removed; CI/deploy now consume environment values | Fixed locally |
| FIN-008 | P2 | Product UI exposed vendor/setup language in failures | Replaced with user-safe temporary-unavailable states; regression scan expanded | Fixed locally |
| FIN-009 | P2 | Labs/competitions could remain loading on slow backend | Added abort timeouts, fallback catalog, and settled loading state | Fixed locally |
| FIN-010 | P2 | Release docs referenced phases 25/31 | Updated canonical setup and finalization records through phase32 | Fixed locally |
| FIN-011 | P0 | Homepage primary CTA optimized for signup instead of project contribution | Hero/header now route to `/projects`; featured projects section added | Fixed locally |
| FIN-012 | P1 | First-visit cinematic intro delayed conversion | GenesisIntro removed | Fixed locally |
| FIN-013 | P1 | Public routes lacked canonical/OG consistency and structured data | `pageHead` + Organization JSON-LD | Fixed locally |
| FIN-014 | P0 | Application + answer writes were non-atomic; direct inserts possible | phase33 RPC; revoke authenticated inserts | Fixed locally; live apply pending |
| FIN-015 | P2 | Decorative clocks forced 1 Hz header/footer re-renders | Removed | Fixed locally |

No issue is marked closed solely from documentation. Live-only items remain blocked.
