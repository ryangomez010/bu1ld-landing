# Member, authentication, application, and deletion completion pass

Date: 2026-10-16 (Asia/Kolkata). Source: the existing BU1LD-Web checkout. All work is local. No account, database, deployment, or other live state was changed. Existing dirty public/member/content changes were preserved.

## Implemented repairs

| Problem | Cause and impact | Repair |
| --- | --- | --- |
| OAuth and password-recovery links could fail after a successful exchange | Callback pages manually exchanged a one-use PKCE code although `getSupabase()` already configures `detectSessionInUrl: true` and PKCE. | Both callbacks await the SDK's single initialization owner, handle initialization/network errors, and expose recovery links. URL errors are decoded once. The installed Auth SDK source confirms initialization owns URL code exchange. |
| Returning from sign-in lost the original task | OAuth always sent completed members to dashboard; the redirect map omitted several member pages and discarded filters/anchors. | Callback consumes the saved destination; email signup includes a sanitized destination in its confirmation callback URL for a new tab. Known member routes, query parameters, and anchors survive login/onboarding. Unknown routes, auth loops, controls, and nested or encoded traversal paths fall back to dashboard. |
| A stale profile response could replace the current account | Async profile requests were not invalidated when the auth identity changed; an initial session response could overwrite a newer auth event. | Session revisions and profile request generations reject stale results. Identity changes immediately clear the previous profile. Guards wait for profile loading; profile/role fetch failures expose retry instead of silently deciding access. |
| Email-confirmation signup appeared complete too early | The form assumed signup always returned an authenticated session. | Signup distinguishes a confirmation-required response and renders a neutral check-email state. A live session proceeds to onboarding. |
| Sign-out failures could appear successful | Supabase error results were ignored. | Auth returns a recoverable error; desktop/mobile account controls display it, and account security does not claim global sign-out success on failure. Global sign-out audit detail records the request state. |
| Onboarding could reuse another account's draft, skip validation, or loop | One browser-global key, unvalidated JSON, missing final-step fields, Enter submitting early, and a skip link to a guarded dashboard. | Drafts are validated and keyed by account; all steps persist. Enter advances unfinished steps. Final submission validates name/interests. Finish-later returns to the public site. A single redirect consumer prevents a second navigation from overwriting the destination. Legacy unscoped drafts remain untouched and are not attributed to another user. |
| Profile completion could look failed after a successful save | A secondary welcome notification could reject after the profile had already been saved. | Notification delivery is nonblocking and failures are logged. Client profile updates also strip computed institutional-role fields; server/RLS authorization remains authoritative. |
| Workspace evidence drafts vanished on refresh | Drafts existed only in a component map. | Drafts persist by account/project, including type, visibility, evidence URL, and milestone. Hydration gates saving/submission. In-memory drafts remain available if browser storage fails; the editor explicitly reports whether browser persistence succeeded. |
| Project application drafts could be written under the wrong project/account | Draft loading and saving ran in the same transition; answers were never saved. | Detail components remount by slug/account; saving waits for hydration. Question answers persist with existing pitch keys preserved. Stale reads are ignored; failed pitch updates recover without trapping the form in a pending state. |
| Account deletion falsely reported completion | The browser ran irreversible data scrubbing first, ignored missing/failed Auth finalization, signed out, then emitted a completion audit. | The server now verifies session/configuration before calling the existing scrub RPC with the user's token, then deletes that same Auth user. The client requires `deleted: true` from a successful response. Partial deletion and lost-response uncertainty are explicit, retain the session for retry, and never create a false completed audit. Missing configuration prevents the scrub step. |

No schema or RLS migration was made. The existing `request_account_deletion` SQL remains the member-data scrub operation. Client and server deletion changes belong in the same deployment.

## Completed local verification

The focused test command below passed **43 tests, 0 failures, 134 assertions across 11 files**. It covered redirect safety/state, onboarding validation and account isolation, application/workspace persistence, disabled storage, reported/thrown auth errors, existing member workspace/application contracts, and account deletion's ordered steps, missing configuration, failed RPC, partial finalization, and lost responses.

```sh
rtk bun test src/lib/auth-request.test.ts src/lib/onboarding-draft.test.ts src/lib/auth-guards.test.ts src/lib/post-auth-redirect.test.ts src/lib/application-draft.test.ts src/lib/project-application-submit.test.ts src/lib/member-workspace.test.ts src/lib/member-portal-ux.test.ts src/lib/workspace-draft.test.ts src/lib/account-deletion-client.test.ts src/lib/account-deletion-handler.test.ts
```

That result preceded the final PKCE-owner source-contract assertion, single-consumer onboarding redirect, and sign-out error refinements. The coordinating website pass owns the final aggregate-suite result; this document does not relabel the intermediate run as testing later changes.

All modified files were formatted with the installed Prettier. The first focused ESLint run found a control-regex rule violation, which was corrected; the next completed run had zero errors and one hook dependency warning, which was then corrected using stable primitive identity dependencies. **Final targeted ESLint over all 30 changed code/test files passed with exit 0 and no output**, using a 160 MiB old-space cap. The coordinating pass also reports a full-repository ESLint pass with exit 0 and no output under a 192 MiB cap. No application compiler, install, build, local server, or browser run was started by this pass: the host remained below the 512 MiB admission floor and formatting/lint became very slow under memory pressure.

## Remaining acceptance gates

- Final combined tests and lint, semantic application typecheck, and production build against the completed checkout.
- Browser QA for OAuth, signup with/without email confirmation, confirmation opened in a new tab, password recovery/expired links, profile loading failure/retry, rapid account switching, onboarding Enter/finish-later, and destination/query/hash preservation.
- Browser QA for workspace/project draft restoration after refresh, two accounts and two projects, storage denial/quota exhaustion, milestone changes, pending application edits, and export flows.
- Connected multi-account role/RLS checks for contributor, lead, reviewer, and administrator; no live authorization claim follows from client guards or these unit tests.
- Real deletion QA only with an explicitly disposable test account after connection: successful scrub + Auth removal, server misconfiguration before scrub, and failure/retry after scrub. Mocked tests performed no real deletion.
- Deploy the client and ordered deletion handler together once the user connects the intended environment. No deployment was attempted; the user requested local completion and waiting for connection.

These repairs improve local behavior and failure reporting. They do not establish production acceptance or external research validity.
