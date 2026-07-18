# Security review

## Scope

Source-level defensive review of authentication boundaries, RLS/RPC migration chain, public evidence, role mutation, API handlers, uploads, redirects, security headers, and deployment configuration. This is not a third-party penetration test.

## Controls verified in source/tests

- Profile role mutation is guarded; admin capability is unified through `is_platform_admin()`.
- Applications, memberships, invitations, competition reviews, deliverables, and contribution reviews use guarded policies/RPCs.
- phase32 prevents self-review regardless of lead/admin status and prevents assigning the author as reviewer.
- `SECURITY DEFINER` functions set an explicit search path and revoke public execution.
- Public project/evidence reads expose only published/verified fields.
- Redirects are restricted to safe in-app paths.
- Server APIs authenticate and apply same-origin/rate-limit controls where relevant.
- Avatar upload validates MIME, magic bytes, size, and storage path rules.
- Worker responses add CSP, frame denial, nosniff, referrer policy, permissions policy, and HSTS over HTTPS.
- Service-role, email, and digest secrets remain server-only.
- Project-specific public credentials were removed from `wrangler.jsonc`.

## Residual risks

- Live RLS, storage policies, OAuth redirects, and service-role handlers require credentialed verification.
- CSP still permits inline scripts/styles because of current framework/runtime needs.
- Full object-level authorization needs separate live visitor/member/lead/reviewer/admin accounts.
- Dependency audit must be rerun at release time.
