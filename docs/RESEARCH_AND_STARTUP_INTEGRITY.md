# Research and Startup Integrity

## Research rules

- A research project must distinguish operational status from research maturity.
- A contribution is not a result until it links evidence and is reviewed.
- Failed or invalidated work remains useful and should be recorded as a contribution with limitations.
- Summary claims must identify dataset, baseline, configuration, code version, seed count, artifact, and verification status before public release.
- Public affiliation, publication, project outcome, and member-stat claims belong in the evidence register.

## Current implementation

The current platform supports research integrity through:

- paper records and reviews;
- project briefs and application pitches;
- milestones with success conditions;
- contribution evidence URLs;
- verification status and review notes;
- public institutional claims with evidence URLs and admin review.

## Missing first-class experiment model

The platform does not yet include dedicated tables for:

- experiment specifications;
- run records;
- immutable metrics;
- dataset versions;
- environment captures;
- checkpoint/artifact references;
- reproducibility reviews.

Until those are implemented, experiment claims should remain in project contributions and must not be promoted to public institutional claims unless evidence is independently reviewed.

## Startup rules

- Startup records must distinguish prototype, validation interview, pilot, customer, revenue, funding, and partnership claims.
- Self-reported traction is not public traction.
- Confidential startup material should stay team/admin-only unless explicitly published.
- Public job/startup copy should avoid implying spinouts, customers, revenue, pilots, or investors without evidence.

## Current implementation

Startup projects use the universal project engine. This is enough for closed-beta team formation and milestone tracking, but not enough for production-grade confidential startup diligence.

## Required next schema

Add first-class startup validation tables before public startup-accelerator positioning:

- `startup_records`
- `startup_validation_events`
- `startup_confidential_artifacts`
- `startup_claim_reviews`
- `startup_advisor_assignments`

All should have RLS, audit logs, and explicit verification states.
