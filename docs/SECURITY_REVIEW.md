# Security Review

Pass 1 security review. Supersedes narrative in `docs/SECURITY_AUDIT.md`; root `SECURITY_AUDIT.md` retained as release artifact.

Status: **source-level review complete; live verification blocked on owner credentials.**

## Threat model summary

| Asset                | Threat                     | Mitigation                                      |
| -------------------- | -------------------------- | ----------------------------------------------- |
| User PII / profiles  | Unauthorized read/write    | RLS owner policies                              |
| Project applications | Cross-user tampering       | RLS + lead-only review RPC                      |
| Admin actions        | Privilege escalation       | `is_platform_admin()`, role trigger             |
| Server secrets       | Client exposure            | No `VITE_` prefix on secrets; release gate scan |
| Email/digest APIs    | Abuse, CSRF                | Bearer auth, same-origin, rate limits           |
| Public claims        | False institutional claims | Evidence URL + admin review                     |
| File uploads         | Malicious content          | URL validation, magic-byte check                |
| Auth endpoints       | Brute force                | Rate limiting helpers                           |

## Implemented controls

### Authentication and session

- Supabase Auth (email, OAuth, password reset)
- Route guards: `RequireAuth`, `RequireMember`, `RequireAdmin`, `RequireProjectLead`
- Auth rate limiting (`src/lib/auth-rate-limit.ts`)
- Production-safe unavailable messaging (no setup instructions in UI)

### Authorization

- `profiles.role` + `member_roles` institutional roles
- `protect_profile_role()` prevents client role mutation
- `is_platform_admin()` unifies admin checks (phase25)
- Project lead checks in UI and RPCs
- phase32 bans contribution self-review and self-reviewer assignment regardless of role

### Database security

- RLS enabled on 27+ core tables (verified by script when credentialed)
- SECURITY DEFINER RPCs with PUBLIC revoke
- `paper_analyses` scoped to owner + admin
- Cross-user inserts via `notify_users` RPC only

### Application security

- Input sanitization: `clampText`, `sanitizeText`, `sanitizeEmailHtml`
- URL safety: `isSafeUrl`, `safeHref`, `isTrustedSupabaseUrl`
- Password validation with complexity rules
- UUID/email validation
- Security headers on API responses
- Same-origin check on POST handlers in production

### Server handlers

| Handler                   | Auth                                 | Secrets                          |
| ------------------------- | ------------------------------------ | -------------------------------- |
| `api/email.ts`            | Bearer session / optional dev bypass | RESEND_API_KEY, EMAIL_API_SECRET |
| `api/digest.ts`           | Bearer DIGEST_API_SECRET             | SUPABASE_SERVICE_ROLE_KEY        |
| `api/account-deletion.ts` | Bearer session                       | SUPABASE_SERVICE_ROLE_KEY        |

### Release security checks

- `release:check` scans for setup copy, TODO, lorem, unsupported claims
- Blocks `VITE_*` server secrets
- Requires phase19–32 SQL artifacts
- Verifies RPC revoke/grant in phase22

## Residual risks

| ID      | Risk                                  | Severity | Status                   |
| ------- | ------------------------------------- | -------- | ------------------------ |
| AUD-003 | Live RLS not verified                 | Critical | BLOCKED                  |
| AUD-007 | Storage policies not live-verified    | High     | BLOCKED                  |
| AUD-029 | In-memory rate limits not distributed | Medium   | PARTIAL                  |
| AUD-032 | Admin claim URL not enforced          | Medium   | RESOLVED (client + RPC)  |
| —       | Public claims truth                   | Medium   | Human review required    |
| —       | OAuth misconfiguration                | High     | BLOCKED until configured |

## Live verification checklist (Pass 2)

- [ ] `bun run supabase:verify` on target project
- [ ] `bun run supabase:rls` on target project
- [ ] `bun run release:prod` with all secrets
- [ ] Confirm no service-role key in client bundle (`dist/` grep)
- [ ] OAuth round-trip on production domain
- [ ] Member A cannot read Member B's `paper_analyses`
- [ ] Removed member loses project access
- [ ] Storage cross-user write denied
- [ ] Email handler rejects cross-origin POST in production

## Compliance notes

- Account deletion handler exists; requires deployed endpoint
- Privacy/terms routes present
- No analytics tracking implemented (privacy-positive default; product gap)

## References

- [AUDIT_MASTER.md](./AUDIT_MASTER.md) — security-related issues
- [DATA_MODEL.md](./DATA_MODEL.md) — RLS and RPC details
- Legacy: [SECURITY_AUDIT.md](./SECURITY_AUDIT.md)
