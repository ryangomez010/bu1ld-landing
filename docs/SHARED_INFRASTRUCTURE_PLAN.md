# Shared Infrastructure Plan

## Reuse responsibly

The projects can share practices, not one monolithic codebase.

Reusable:

- release readiness scripts;
- copy/claim scanners;
- auth security test patterns;
- Supabase RLS review checklist;
- email template safety rules;
- accessibility/browser smoke scripts;
- documentation structure.

Not reusable without redesign:

- Supabase schemas;
- role names and authorization policies;
- institutional claims;
- public brand copy;
- dashboards and information architecture.

## Recommended standards

1. Every web app has `release:check` and a strict deployment-environment gate.
2. Every public product has a claim/evidence policy.
3. Every membership app has role-based tests proving private data remains private.
4. Every research repo has a reproducibility command and a claims/limitations document.
