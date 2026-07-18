# Demo Guide

## Local demo (no Supabase)

```bash
bun install
bun run dev
```

Open `http://localhost:3000`. Without `.env` Supabase keys, the app runs in **demo mode**: seed labs, papers, projects appear; auth and writes that need a live database are unavailable.

## Local demo (with Supabase)

1. Copy `.env.example` → `.env` and set `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`.
2. Apply schema: paste `supabase/FINAL_SETUP.sql` in the SQL editor (through **phase27**), then `VERIFY_SETUP.sql`.
3. `bun run supabase:verify` (when DB credentials are available)
4. `bun run dev`
5. Sign up → complete onboarding → browse `/labs`, `/publications`, `/projects`, `/research`.

Promote yourself to admin:

```sql
update public.profiles set role = 'admin' where id = '<your-user-uuid>';
```

## Suggested walkthrough

| #   | Path                      | What to verify                                                              |
| --- | ------------------------- | --------------------------------------------------------------------------- |
| 1   | `/`                       | Institution positioning                                                     |
| 2   | `/labs`                   | Six labs (DB or seed)                                                       |
| 3   | `/publications`           | Published papers or empty CTA                                               |
| 4   | `/signup` → `/onboarding` | Profile enrichment fields                                                   |
| 5   | `/projects/$slug`         | Apply with pitch (+ custom questions if lead added any)                     |
| 6   | `/projects/$slug`         | Evidence: lead assigns reviewer; assigned reviewer can verify / request changes |
| 7   | `/projects/manage/$slug`  | Experiments, deliverables, datasets                                         |
| 8   | `/admin` → Labs / Claims / Papers | Lab CMS; claim verify requires evidence URL; papers paginate at 25 |
| 9   | `/research`               | Reading paths; progress upserts when Supabase live                          |

## Quality commands

```bash
bun run typecheck && bun run test && bun run lint && bun run smoke && bun run release:check && bun run build
```

Last local verification (2026-07-17): typecheck, 117 unit tests, lint, route smoke, `release:check`, and production build all passed.
