# External blockers

| Blocker | Required value/access | Exact activation | Risk if delayed |
|---|---|---|---|
| Production schema through phase32 | `SUPABASE_DB_PASSWORD` or database URL | `bun run supabase:apply && bun run supabase:verify && bun run supabase:rls` | New integrity controls and tables are not live |
| Auth providers/domain | Supabase dashboard + OAuth provider credentials | Set Site URL, callback/reset URLs, enable providers, run auth smoke | Signup recovery/OAuth may fail on public domain |
| Transactional email/digest | Resend key, sender domain, digest secret, service role | Configure Worker secrets and cron; run dry-run then test recipient | Decisions/notifications may remain in-app only |
| Account deletion service | Service role and deployed same-origin handler | Set endpoint/secret and verify auth user removal | Profile may be removed before auth identity is fully erased |
| Role-separated E2E | Staging accounts for visitor/member/lead/reviewer/admin | Execute acceptance matrix with one real project and evidence submission | Authorization correctness remains source-tested, not live-proven |
| Production deployment | Cloudflare token/account and repository secrets | `bun run deploy:cf`, inspect logs/headers/routes | Local release candidate is not a verified deployment |

No code blocker prevents local build or static verification.
