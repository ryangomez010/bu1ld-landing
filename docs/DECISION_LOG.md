# Decision Log

Architectural and process decisions. Append-only.

---

## DEC-001 — Repository path resolution (2026-07-17)

**Context:** Pass 1 prompt specified `~/Downloads/bu1ld-landing`.

**Decision:** Use `/Users/ryan/Downloads/the-bu1ld-nexus-main` as canonical workspace.

**Rationale:** `bu1ld-landing` absent; nexus repo matches mission (58 routes, Supabase member platform, six labs).

**Recorded in:** [WORKSPACE_PATHS.md](./WORKSPACE_PATHS.md)

---

## DEC-002 — Memory file consolidation (2026-07-17)

**Context:** 14 legacy docs exist (`MASTER_AUDIT.md`, `SYSTEM_MAP.md`, etc.).

**Decision:** Create 15 new Pass memory files; preserve legacy docs; `PROJECT_MEMORY.md` is canonical.

**Rationale:** Prompt requires specific file names; legacy docs contain valuable detail worth cross-linking not deleting.

---

## DEC-003 — Labs not divisions (2026-07-17)

**Context:** Mission brief uses "research divisions"; codebase uses "labs."

**Decision:** Document mapping in PRODUCT_SPEC and PROJECT_MEMORY; do not rename code in Pass 1.

**Rationale:** Pass 1 is audit-only; renaming would be broad rewrite without user request.

---

## DEC-004 — Static institution content is intentional (2026-07-17)

**Context:** Audit asks real vs placeholder for labs, people, partnerships.

**Decision:** Mark as **Static/Partial** — curated marketing content, not unfinished stubs.

**Rationale:** `src/data/institution.ts` is deliberate; DB `labs` table exists for future CMS (phase25).

---

## DEC-005 — Pass 1 low-risk fix scope (2026-07-17)

**Context:** Many issues found; prompt limits to low-risk blockers.

**Decision:** Fix only: `.env.example` gap, phase25 doc drift, stale test counts, CI typecheck. No schema or route changes.

**Rationale:** Aligns with "no broad speculative rewrites."

---

## DEC-006 — Invalidate uncommitted-changes risk (2026-07-17)

**Context:** `PRODUCT_AUDIT.md` cites broad uncommitted changes.

**Decision:** Invalidate AUD-028; git tree clean at `d49626b`.

**Rationale:** Current evidence contradicts prior audit state.

---

## DEC-007 — Phase25 experiment tables partial (2026-07-17)

**Context:** Prior audits mark experiment model missing; phase25 adds `project_experiments` and `project_deliverables`.

**Decision:** AUD-008 status = PARTIAL, not MISSING.

**Rationale:** Schema landed; full immutability UX and run/metric model still deferred.

---

## DEC-008 — Pass 2 entry criteria (2026-07-17)

**Decision:** Pass 2 begins with live Supabase + secrets (Q1–Q6); no code feature work until staging gate passes.

**Rationale:** 8 BLOCKED audit items are owner-credential dependent; code changes without live verify would be speculative.

**Status:** **Superseded by DEC-009** — deployment runs in parallel; does not block Pass 2 feature slices.

---

## DEC-009 — Pass 2 scope redefinition (2026-07-17)

**Context:** Prompt 2/4 defines Pass 2 as "Heavy Additions and Core Creation" (vertical slices), not deployment-only.

**Decision:** Pass 2 code work = phase26 + slices (labs, publications, profile, projects, learning, analytics). Owner deployment (Q1–Q8) runs **in parallel** and is documented as unconfigured when creds absent.

**Rationale:** Prompt 2/4 explicitly requires building real vertical slices; demo mode + adapters satisfy "mark live integration unconfigured" rule.

**Invalidates:** DEC-008 blocking gate for feature work.

---
