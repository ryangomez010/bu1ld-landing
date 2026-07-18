# Project identity

- **Product:** The Bu1ld Nexus
- **Classification:** Community platform, research institution operating system, public website
- **Confidence:** High
- **Canonical repository:** `/Users/ryan/Downloads/the-bu1ld-nexus-main`
- **Remote:** `origin` → `ryangomez010/bu1ld-landing`
- **Primary audience:** ML researchers, engineers, founders, and serious students
- **Core promise:** Move from reading and discovery into scoped work, reviewed evidence, and a truthful public contribution record.
- **Repeated-use loop:** Discover → apply → join → complete milestone → submit evidence → receive review → build portfolio → take next milestone.
- **Trust model:** Public claims require evidence; private records are protected by RLS; privileged state transitions use guarded RPCs.
- **Must not become:** A social vanity directory, fake accelerator, unsupported research gallery, or client-authorized admin system.
- **Stack:** React 19, TanStack Start/Router/Query, TypeScript, Vite, Tailwind/Radix, Supabase Auth/Postgres/RLS/Storage, Cloudflare Worker.
- **Deployment target:** Cloudflare Worker (`wrangler.jsonc`); Vercel-compatible API handlers remain supported.
