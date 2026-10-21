# Member portal UX pass — 2026-10-11

## Implemented

- Shared, grouped navigation for work, discovery, and the library; one active destination is selected by the most specific matching path segment. Account actions are in a header menu, and the desktop sidebar scrolls within the viewport.
- The mobile drawer keeps every destination and account action in one scrolling region. Larger navigation text and touch targets, explicit navigation labels, and a focusable skip-link destination improve keyboard and small-screen access.
- A visible “Jump to…” control opens the command palette. The palette shares the main destinations, retains announcements and job-tracker shortcuts, adds account-appropriate management links, and sends free-text queries to portal search. Its dialog has an accessible title, description, and trigger.
- Dashboard actions, urgent items, and onboarding appear near the top. Duplicate attention/profile prompts were removed. Reading statistics and digest sit behind an optional disclosure. The onboarding checklist now dismisses immediately. Member data loading/errors no longer display incomplete personal totals as the loaded dashboard.
- The evidence log precedes the submission form in both visual and keyboard order. It supports per-project search across result text, milestones, contribution types, and reviewer notes, plus review-status filters, counts, clear-filter recovery, and a direct revision action.
- Draft text is kept separately per project in memory while the page remains open. It is not persisted across refresh/navigation. Project switches and form edits are disabled during submission; failed submissions retain text. Late milestone responses are ignored after switching projects.
- Submissions, revisions, and exports expose pending/failure states. Visibility radio controls have a visible focus treatment. Accepted applications remain explicitly distinct from durable project membership.
- Dashboard member queries refresh when the event catalog or profile version changes, so upcoming RSVPs can populate after the catalog arrives.

## Verification

- Full local suite: 184 tests passed, 0 failed, 1,217 assertions across 39 files.
- Final typecheck and full-repository lint passed. The final focused portal/auth regression run also passed: 19 tests, 52 assertions.
- Five new behavioral tests cover nested navigation, path-boundary matching, role-specific links, combined evidence filters, empty results, and unchanged source records.
- `git diff --check` passed.
- An isolated component preview returned HTTP 200. The browser controller timed out twice under renewed system memory pressure, so no visual, responsive, or keyboard browser pass is claimed. The preview was stopped and its temporary fixture files removed. Fixture data was never written to the app or database.
- No full build or deployment was run in this pass. No schema, RLS, account, or live evidence records were changed.

## Remaining verification

Use a configured non-production Supabase account to check desktop/mobile navigation and focus return; checklist dismissal; empty and failed workspace loads; filtering/recovery; project-specific draft switching; failed/successful submissions; revision/resubmission; and export. Run the development build and live role smokes when memory and account configuration permit. Existing production release gates remain in force.
