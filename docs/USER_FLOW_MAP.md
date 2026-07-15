# User Flow Map

## Visitor

Entry points: `/`, `/research`, `/papers`, `/projects`, `/programs`, `/events`, `/guides`, `/jobs`, `/newsletter`, `/evidence`.

Expected outcome: understand The Bu1ld, inspect public work, verify claims, and decide whether to join.

## Applicant

Entry points: `/signup`, `/login`, `/onboarding`, `/lead/apply`, project/programme application routes.

Expected outcome: create account, complete technical profile, apply to a project/programme or lead role, and receive status feedback.

## New member

Entry points: `/onboarding`, `/dashboard`, `/profile`.

Expected outcome: complete profile, save content, discover relevant papers/projects/programmes, and start a concrete contribution path.

## Active member

Entry points: `/dashboard`, `/projects`, `/saved`, `/applications`, `/notifications`, `/account/*`.

Expected outcome: track applications, contribute to accepted projects, submit evidence, save papers/projects, and manage account settings.

## Project lead

Entry points: `/projects/manage`, `/projects/manage/$slug`, `/projects/new`, `/projects/edit/$slug`.

Expected outcome: publish or manage scoped projects, review contribution requests, manage members, review evidence, and communicate project updates.

## Reviewer or mentor

Supported through institutional roles and project/contribution review tools. Expected outcome: assess evidence, request revisions, approve contributions, and maintain standards.

## Moderator

Entry point: `/admin` moderation surfaces.

Expected outcome: review content reports and feedback without gaining unrelated project ownership rights.

## Administrator

Entry point: `/admin`.

Expected outcome: manage institutional content, publication state, programmes, members, claims, reports, security records, and operational readiness.

## Organization owner

Current repository supports this as an operator responsibility rather than a product UI role. Expected outcome: configure Supabase, deployment secrets, email sender, OAuth redirects, cron, monitoring, and release gates.

## Acceptance Matrix

- Visitor: can inspect public routes, understand the mission, verify public
  claims through the evidence register, and reach signup/login without dead
  controls.
- Applicant: can create an account, recover access, complete onboarding, apply
  to a project/programme or lead role, and receive saved status feedback.
- Member: can search, read, save, join/track work, manage collections, update
  preferences, and preserve state after sign-out/sign-in.
- Project lead: can create/manage owned projects, review applications, manage
  collaboration, and publish updates only within permitted scope.
- Reviewer/mentor: can review contribution evidence and request revision only
  where assigned by role or project policy.
- Moderator/admin: can moderate reports and manage content without gaining
  arbitrary member ownership.
- Operator: can deploy, verify, monitor, and roll back without exposing secrets
  or changing unrelated products.
