# Test Plan

Status: release test plan for The Bu1ld Nexus.

## Automated Checks

- `bun run test`: unit and security tests for library behavior.
- `bun run typecheck`: TypeScript correctness.
- `bun run lint`: static linting.
- `bun run build`: production bundle and runtime environment generation.
- `bun run audit:ci`: dependency audit at high severity.
- `bun run release:check`: local release readiness gate.
- `bun run release:prod`: strict production release gate with real environment.
- `bun run supabase:verify`: live database connectivity and expected schema.
- `bun run supabase:rls`: live RLS policy verification.

## Browser Smoke Coverage

- Public: `/`, `/research`, `/papers`, `/projects`, `/programs`, `/events`,
  `/guides`, `/jobs`, `/newsletter`, `/evidence`, `/privacy`, `/terms`.
- Auth: `/signup`, `/login`, `/forgot-password`, `/reset-password`,
  `/auth/callback`.
- Member: `/dashboard`, `/profile`, `/saved`, `/applications`,
  `/notifications`, `/account/security`, `/account/preferences`.
- Project lead: `/projects/new`, `/projects/manage`,
  `/projects/manage/$slug`, `/projects/edit/$slug`.
- Admin: `/admin` tabs for content, claims, moderation, members, audit, and
  security.

## Manual Role Smoke Tests

- Visitor cannot access private routes.
- New member signs up, completes onboarding, edits profile, saves content, and
  signs out/in with state preserved.
- Member applies to a project, sees status, and receives denial/success states.
- Project lead reviews an application and manages only owned project records.
- Reviewer evaluates evidence only where assigned.
- Admin publishes content, reviews claims, moderates reports, and inspects audit
  records.
- Unauthorized direct navigation shows denied/not-found states without leaking
  private data.

## Production-Only Tests

- OAuth callback and password reset on the canonical domain.
- Email and digest delivery with sender-domain verification.
- Account deletion with JWT authorization and service-role function access.
- Storage upload rejection for oversized, unsupported, and cross-user files.
- Monitoring and alerting for API/function failures.
