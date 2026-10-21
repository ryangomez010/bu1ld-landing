# Security Audit — The Bu1ld

## Implemented controls

- Supabase Auth is used for identity.
- Password validation and auth attempt throttling are implemented in app utilities.
- Protected routes redirect or deny unauthorized users.
- Database RLS and guarded RPCs are the authoritative access boundary.
- Service-role and email/digest secrets are blocked from `VITE_` exposure by `release:check`.
- Browser email delivery uses the signed-in Supabase session and never reads a public-prefixed email or Resend secret; provider credentials remain server-only.
- Email, digest, and account-deletion handlers validate methods, bearer tokens, origins, payload size, and sensitive configuration.
- Serverless adapters derive production origins from deployment-owned configuration, preserve handler security headers, and add HSTS to HTTPS API responses.
- Client services that receive Supabase bearer tokens are restricted to same-origin production endpoints.
- JSON responses disable caching; bearer automation secrets use full-length comparison.
- URL validation blocks unsafe schemes for external links and profile fields, including legacy database values at render time.
- Server-side Supabase requests require a credential-free `https://<project>.supabase.co/` origin with no custom port, path, query, or fragment.
- Inline JSON-LD escapes script-closing characters, and internal redirects reject encoded separators, traversal segments, and control characters.
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

Phase 37 revokes default execution on privileged and trigger-only `SECURITY DEFINER` functions, binds project-notification checks to the authenticated caller, and prevents callers from probing administrator status for another user ID.

Phase 38 makes notification destinations internal-path-only at the database boundary, clears unsafe legacy destinations during migration, and revokes direct execution on the remaining trigger/internal helpers.

## External security checks still required

- Run Supabase Security Advisor in the project dashboard.
- Confirm OAuth redirect URLs exactly match the production domain.
- Confirm storage bucket policies for avatars after bucket creation.
- Confirm server-only secrets are not present in the client bundle or public environment variables.
- Run `bun audit --audit-level=high` from an approved network before public launch.
- Apply phases 37–38 to the intended Supabase project, then run the schema/RLS checks and signed-in role journeys; local SQL inspection does not prove the live policy state.

## Known limitations

- Reviewer/mentor assignment is partially modeled; independent reviewer-only workflows need more schema/UI before production-scale review operations.
- Immutable experiment metrics and confidential startup diligence are not first-class schemas yet.
