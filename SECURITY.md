# Security

## Threat model (summary)

- Abuse of open signup / password reset → rate limits (`auth-rate-limit`, KV-backed on Workers when bound).
- Privilege escalation via profile role → DB trigger + admin-only policies.
- Client-only admin checks → insufficient; RLS must deny.
- Email API abuse → bearer secret or verified Supabase session + same-origin checks.
- XSS in member content → sanitization helpers (`security.ts`) and CSP headers on Worker responses.

## Rules

1. Never put `SUPABASE_SERVICE_ROLE_KEY` or Resend keys in `VITE_*` variables.
2. Anon JWT is public by design; treat it as such and rely on RLS.
3. Prefer security-definer RPCs for multi-step state changes (accept application, verify contribution).
4. Log sensitive actions to `security_events` / `admin_audit_log`.
5. Upload paths must validate MIME/magic bytes and size (`avatar-upload`, storage policies).

## Roles

| Capability                        | Who                                                                                                                                   |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Public browse (institution pages) | Anyone                                                                                                                                |
| Member portal                     | Authenticated + onboarding complete                                                                                                   |
| Project lead tools                | `profiles.role = project_lead` or institutional `project_lead` / `lab_lead`                                                           |
| Reviewer submit path              | Institutional `reviewer`                                                                                                              |
| Admin console                     | `profiles.role = admin` **or** institutional `administrator` (UI + `is_platform_admin()` for labs/competitions/partnerships policies) |
| Bootstrap administrator           | One owner action through the database console; subsequent role changes use protected admin operations and are audited                 |

## Headers

`src/lib/security.ts` + `src/server.ts` apply HSTS, CSP, frame deny, and related headers on Worker responses.

## Reporting

Security issues: `hello@thebu1ld.com` (see account security page). Do not open public issues with exploit PoCs.
