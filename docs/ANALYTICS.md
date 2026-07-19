# Analytics

Updated: 2026-07-19

## Principles

Analytics should measure institutional progress without inventing traction. Do not display user counts, member statistics, cohort outcomes, partnerships, or publication metrics unless they are backed by production data and approved for public display.

## Events to track

- Public discovery: landing view, project directory view, publication/library view, program view.
- Conversion: application start, application submit, signup start, onboarding complete.
- Research flow: paper save, paper analysis submit, project follow, project contribution request.
- Collaboration flow: request review, request decision, milestone submit, contribution review decision.
- Administration: content publish, evidence verify, role change, moderation action.

## Privacy boundaries

- Avoid collecting paper text, private application details, unpublished contribution contents, or sensitive profile fields in analytics payloads.
- Prefer event names, resource IDs, role class, and coarse journey state.
- Keep analytics disabled/no-op when the configured analytics domain is absent.

## Release evidence

Analytics code must remain covered by tests proving no-op behavior when unconfigured and safe event dispatch when configured.
