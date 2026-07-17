# Security Audit — The Bu1ld

## Implemented controls

- Supabase Auth is used for identity.
- Password validation and auth attempt throttling are implemented in app utilities.
- Protected routes redirect or deny unauthorized users.
- Database RLS and guarded RPCs are the authoritative access boundary.
- Service-role and email/digest secrets are blocked from `VITE_` exposure by `release:check`.
- Email, digest, and account-deletion handlers validate methods, bearer tokens, origins, payload size, and sensitive configuration.
- URL validation blocks unsafe schemes for external links and profile fields.
- Text limits and sanitization are applied across forms and email HTML.
- Avatar uploads enforce allowed MIME types, size limits, and magic-byte validation.
- Project application review, contribution review, membership status changes, and claim review are handled through guarded SQL functions.
- Public institutional claims require evidence URLs and admin review.
- Seed content is scanned for unsupported affiliation, customer, and benchmark-style claims.

## RLS and authorization

Core user-sensitive tables have RLS policies in migrations:

- profiles
- project applications
- project memberships
- project milestones
- project contributions
- saved items and collections
- notifications
- reports and feedback
- programmes and applications
- institutional claims
- security/audit records

`supabase/VERIFY_SETUP.sql` and `bun run supabase:rls` verify RLS state after applying the database setup.

## External security checks still required

- Run Supabase Security Advisor in the project dashboard.
- Confirm OAuth redirect URLs exactly match the production domain.
- Confirm storage bucket policies for avatars after bucket creation.
- Confirm server-only secrets are not present in the client bundle or public environment variables.
- Run `bun audit --audit-level=high` from an approved network before public launch.

## Known limitations

- Reviewer/mentor assignment is partially modeled; independent reviewer-only workflows need more schema/UI before production-scale review operations.
- Immutable experiment metrics and confidential startup diligence are not first-class schemas yet.
