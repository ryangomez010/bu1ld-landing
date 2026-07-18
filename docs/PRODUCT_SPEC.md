# Product Specification

Pass 1 product spec for The Bu1ld Nexus. Canonical context: [PROJECT_MEMORY.md](./PROJECT_MEMORY.md).

## Product definition

Role-aware research and building institution platform. Combines public institution site, member portal, project workspaces, research library, programs/fellowships, and admin governance.

## User stories by domain

### Public institution site

| ID     | Story                                          | Route(s)                   | Implementation                                       |
| ------ | ---------------------------------------------- | -------------------------- | ---------------------------------------------------- |
| PUB-01 | Visitor understands mission and research areas | `/`                        | **Real** — `src/data/landing.ts`, landing components |
| PUB-02 | Visitor browses six research labs              | `/labs/*`                  | **Static** — `src/data/institution.ts` LABS array    |
| PUB-03 | Visitor views people and partnerships          | `/people`, `/partnerships` | **Static** — institution.ts                          |
| PUB-04 | Visitor applies to institution                 | `/apply`                   | **Static** — links to signup/programs                |
| PUB-05 | Visitor verifies public claims                 | `/evidence`                | **Real** — `institutional_claims` via Supabase       |
| PUB-06 | Visitor sees publications teaser               | `/publications`            | **Placeholder** — marketing page → `/papers`         |
| PUB-07 | Visitor browses competitions                   | `/competitions/*`          | **Hybrid** — DB + static fallback                    |
| PUB-08 | Visitor views public program catalog           | `/programs-public`         | **Static** — INSTITUTION_PROGRAMS                    |
| PUB-09 | Legal pages                                    | `/terms`, `/privacy`       | **Real** — static routes                             |

### Research divisions (labs)

Organized per mission brief. Code term: **lab**.

| Division (mission)                      | Lab slug                  | Content | Projects           |
| --------------------------------------- | ------------------------- | ------- | ------------------ |
| ML for Scientific Discovery             | scientific-discovery      | Static  | Seed + DB projects |
| Mathematical Approaches to Intelligence | mathematical-intelligence | Static  | Seed + DB          |
| Robotics and Autonomous Intelligence    | robotics                  | Static  | Seed + DB          |
| Computational Finance and Economics     | computational-finance     | Static  | Seed + DB          |
| Real-World Applications and Systems     | real-world-ai             | Static  | Seed + DB          |
| Cross-disciplinary experimental         | emerging                  | Static  | Seed + DB          |

### Member platform

| ID     | Story                     | Route(s)                              | Implementation                      |
| ------ | ------------------------- | ------------------------------------- | ----------------------------------- |
| MEM-01 | Sign up / login / OAuth   | `/signup`, `/login`, `/auth/callback` | **Real** — Supabase auth            |
| MEM-02 | Complete onboarding       | `/onboarding`                         | **Real** — 4-step flow              |
| MEM-03 | Manage profile            | `/profile`                            | **Real** — profiles table           |
| MEM-04 | Member directory          | `/members/*`                          | **Real** — directory_visible filter |
| MEM-05 | Dashboard recommendations | `/dashboard`                          | **Real** — aggregated queries       |
| MEM-06 | Search portal             | `/search/`                            | **Real** — RPC + client index       |
| MEM-07 | Notifications             | `/notifications/`                     | **Real** — notifications table      |
| MEM-08 | Saved items / collections | `/saved/*`                            | **Real** — saved_collections        |

### Projects and applications

| ID     | Feature                  | Implementation                       | Verdict                                      |
| ------ | ------------------------ | ------------------------------------ | -------------------------------------------- |
| PRJ-01 | Project pages            | `/projects/$slug`                    | **Real** — Supabase                          |
| PRJ-02 | Open roles on projects   | project fields + apply UI            | **Real**                                     |
| PRJ-03 | Contributor applications | `project_applications`               | **Real**                                     |
| PRJ-04 | Applicant tracking       | `/applications/`                     | **Real**                                     |
| PRJ-05 | Lead review queue        | `/projects/manage/$slug`             | **Real** — review RPC                        |
| PRJ-06 | Milestones               | `project_milestones`                 | **Real**                                     |
| PRJ-07 | Contributions + evidence | `project_contributions`              | **Real**                                     |
| PRJ-08 | Repositories (links)     | evidence URLs, project links         | **Partial** — URLs not repo registry         |
| PRJ-09 | Datasets                 | `project_datasets` + workspace UI    | **Real** — phase26 registry                   |
| PRJ-10 | Demos                    | contribution evidence                | **Partial**                                  |
| PRJ-11 | Verified outputs         | verification status on contributions | **Real**                                     |
| PRJ-12 | Project archives         | closed filter + public detail/output | **Real** — read-only alumni presentation     |
| PRJ-13 | Experiments              | `project_experiments` (phase25)      | **Partial** — tables exist, full UX deferred |
| PRJ-14 | Deliverables             | `project_deliverables` (phase25)     | **Partial**                                  |

### Research library

| ID     | Feature                       | Route                           | Verdict                           |
| ------ | ----------------------------- | ------------------------------- | --------------------------------- |
| RES-01 | Paper library                 | `/papers/*`                     | **Real** — DB                     |
| RES-02 | ML paper reviews              | `/research/submit`, PaperReader | **Real**                          |
| RES-03 | Paper analyzer                | `/research/analyze`             | **Real** — private analyses RLS   |
| RES-04 | Reading lists / pathways      | `/research/`, research-paths.ts | **Static pathways**               |
| RES-05 | Reading progress / highlights | member components               | **Real** — DB + localStorage demo |
| RES-06 | Research opportunities        | projects + jobs + programs      | **Real**                          |

### Programs, fellowships, cohorts

| ID     | Feature                    | Verdict                                    |
| ------ | -------------------------- | ------------------------------------------ |
| PRG-01 | Public program catalog     | **Static** — programs-public               |
| PRG-02 | Member program apply/track | **Real** — programs + program_applications |
| PRG-03 | Research Fellowship        | **Real** — in INSTITUTION_PROGRAMS + DB    |
| PRG-04 | AI Builder Cohort          | **Real**                                   |
| PRG-05 | Startup Incubation         | **Real** — project type; CRM deferred      |

### Events, jobs, newsletter

| Feature        | Verdict                          |
| -------------- | -------------------------------- |
| Events + RSVP  | **Real** — DB                    |
| Jobs + tracker | **Real** — DB + job_applications |
| Newsletter     | **Real** — DB                    |

### Startup initiatives

| Feature                     | Verdict                |
| --------------------------- | ---------------------- |
| Startup project type        | **Real**               |
| Confidential startup CRM    | **Missing** — deferred |
| Startup validation workflow | **Missing**            |

### Open-source work

Referenced via project evidence URLs and institutional content. No dedicated OSS registry table.

### Administration

| Tab                                                         | Verdict  |
| ----------------------------------------------------------- | -------- |
| Overview, announcements, events, papers, programs, projects | **Real** |
| Claims, institutions, newsletter, jobs, guides, members     | **Real** |
| Leads, bulk publish, moderation, audit, security            | **Real** |

### Non-functional requirements

| Area           | Status                                                          |
| -------------- | --------------------------------------------------------------- |
| Mobile layouts | **Partial** — MobileTabBar, responsive; not exhaustively tested |
| Accessibility  | **Partial** — loading states, keyboard shortcuts dialog         |
| SEO            | **Partial** — sitemap.xml; meta per route varies                |
| Tests          | **Real** — 95 unit tests; no E2E                                |
| Deployment     | **Partial** — Cloudflare CI; prod secrets owner-only            |

## Out of scope (Pass 1)

- Experiment immutability model completion
- Startup CRM
- Public paper catalog on `/publications`
- Analytics

## Success metrics (Pass 2+)

- `release:prod` passes on staging
- Role smoke tests green
- Member can complete: signup → onboard → apply → lead accept → contribute → verify
