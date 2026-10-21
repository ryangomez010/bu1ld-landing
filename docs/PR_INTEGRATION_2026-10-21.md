# BU1LD PR integration — 2026-10-21

Status: **committed locally; public push requires explicit approval; no remote PR merged**.

## Review target

Repository: `ryangomez010/bu1ld-landing` (public).
Branch: `codex/finalize-bu1ld-20261021`.

- `701b76b` records the finalized application, member workflows, learning material, public discovery, phase35–40 migrations, and verification documentation (328 files).
- Local merge `a64eab1` preserves PR #4 head `7a0d5042c36d00a1ff887ab2a30e09bdd06dd4b7`.
- Local merge `050e7a6` preserves PR #5 head `36986195e0d4efd6bfab18e29ba1ec4b7536a28d`.
- `664283d` repairs the combined dependency upgrade and frozen lockfile. The already newer Lovable configuration remains at 2.26.6 rather than reverting to PR #4's older proposal.

The final integration must use a merge commit, preserving ancestry, so the original PR commits are included in main. The two GitHub PRs remain OPEN; local merge commits are not remote merges.

## Publication boundary

`research/paper-reviews/` (private drafts and source cache) and `.serena/` remain local and ignored. Existing environment/credential exclusions remain. The staged full-source scan covered approximately 5.07 MB. Gitleaks reported 28 candidate matches; each was checked against the exact JSON source-file SHA-256-entry pattern in the historical verification receipt. None was a credential.

The attempted push was rejected by automatic approval review: publishing hundreds of local files to a public repository needs explicit authorization beyond the instruction to merge existing PRs. No alternate transport or other remote was used. A user approval request is pending for publishing this integration branch for CI review.

## Compatibility changes

- Regenerated `bun.lock`; both original dependency PRs failed CI because their manifest changes did not update the frozen lockfile.
- Use TypeScript 7 for the compiler and TypeScript 6 for the JavaScript API required by typescript-eslint and bounded diagnostics. This follows the [TypeScript side-by-side compatibility guidance](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-6.0). The typecheck command explicitly invokes the native compiler to avoid executable-name ambiguity.
- Removed the global brace-expansion v1 override that broke minimatch's current API under ESLint 10; resolved transitive dependencies pass the high-severity audit.
- Updated Zod error access to `issues`, Recharts tooltip/legend content types, and removed Lucide brand exports to available code/professional icons while retaining provider/link labels.
- React Hooks 7 adds compiler-migration diagnostics to its recommended preset. This app does not enable React Compiler. The normal lint command explicitly retains the established rules-of-hooks/error and exhaustive-deps/warning policy. `lint:react-compiler` retains the complete newer preset for a separate migration audit; its current result is **46 errors**, so this is not a claim of React Compiler compatibility.

## Verification and outstanding gates

- Combined dependency suite: **322 passing tests / 5,554 assertions / 68 files**.
- Frozen install: passed without lockfile changes.
- High-severity dependency audit: passed.
- Normal lint with the preserved Hooks baseline: **0 errors, 134 warnings**. Warnings concern TanStack route component exports under the newer refresh plugin.
- Runtime export inspection covers 234 named imports from the five upgraded production packages; removed brand exports were repaired.
- Full semantic typecheck, Vite bundle, and browser checks have **not run on the integrated dependency versions**. Local memory remains below the documented admission floor; hosted CI awaits push approval.
- Source migrations have not been executed against PostgreSQL. Hosted RLS/provider/email, production configuration and deployment acceptance remain open as documented in `COMPLETION_2026-10-21.md`.

After approval, push the branch, create and attach the integration PR, wait for its checks, repair any actual compiler/build failures, and only then merge without overriding required checks. Confirm main ancestry and the remote state of PRs #4 and #5. Preserve the prior failed checks and local verification receipts.
