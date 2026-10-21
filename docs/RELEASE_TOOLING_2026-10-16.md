# Release tooling repairs — 2026-10-16

This changes local verification and deployment commands. No remote schema, secret, account, or Worker was changed.

## Corrected failure modes

- Production config now uses Vite's own environment loader, including `.env.local`, `.env.production`, `.env.production.local`, expansion, and shell overrides. Public keys follow the same precedence as the client and generated runtime payload. Privileged public configuration is rejected before building.
- Anonymous API verification makes actual bounded requests to Auth settings and a permitted public project column. It no longer treats anonymous denials on private tables as missing tables or claims a local `getSession()` proves Auth reachability.
- Database verification runs the read-only `VERIFY_SETUP.sql`: all 52 tables, all 51 intended RLS flags, listed functions, and phases 19–34. Catalog joins are constrained to the public namespace without silently omitting objects when another schema contains the same name. This checks catalog state, not per-role authorization semantics.
- DB connection resolution accepts an exact dashboard URL or password plus project reference. It no longer guesses a pooler region or accepts a password alone. Strict release and schema-apply commands check that the connection identifies the same project as the public Supabase URL.
- Database TLS validates the certificate; `SUPABASE_DB_CA_FILE` supports an explicitly supplied trusted CA. Schema-apply scripts share configuration/identity checks, close their connection on failure, and no longer require a password when an exact connection URL is supplied. Single-phase apply requires an explicit `phaseN.sql` argument rather than silently applying phase11. Migration SQL itself was not changed.
- `deploy:cf` requires strict checks and uses the installed Wrangler. It checks the configured Worker's binding names before uploading. It no longer bypasses release verification or prints a guessed successful production URL.
- GitHub deployment uses the production environment, serializes deploy jobs, supports publishable-only public keys in both stages, and calls the same guarded deploy command. No CI run or deployment was triggered.
- Same-origin `/api/email` configuration now resolves correctly; email requests time out and do not follow redirects with credentials.

## Deployment inputs and remaining checks

Provision values through the deployment environment/secret manager, never in public source. The build requires the intended Supabase URL plus anon/publishable key. Strict verification also needs an exact DB URL (and a trusted CA file when required), server-only service-role key, Resend key, digest secret, and email endpoint. Cloudflare deployment needs the intended account ID and token.

The configured Worker must already have bindings named `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (an anon or publishable value), `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, and `DIGEST_API_SECRET`. Binding-name checks cannot verify secret values match the build; verify the actual runtime using the role/email/account-deletion checks. For a new Worker, provision it and its bindings deliberately before this guarded deploy path. Set the verified sender and digest schedule in the deployment environment as needed.

The user selected this BU1LD-Web checkout as the successor source and explicitly requested local coding followed by waiting for connection. The local Wrangler configuration now names the existing `the-bu1ld-nexus` Worker, uses the narrow generated-output wrapper, and targets its existing `thebu1ld.com` custom domain. This prepares the intended release without uploading code or changing routing. Correct BU1LD backend access and deployment connection are still pending; do not deploy until that phase is authorized.

Run `bun run release:prod` in a resourced, correctly configured environment, then the role/browser QA described in `docs/WEBSITE_STATUS_2026-10-16.md`. API reachability, catalog flags, and local regression tests do not certify email delivery, live RLS behavior, third-party OAuth, or successful account deletion. No destructive live test was performed.
