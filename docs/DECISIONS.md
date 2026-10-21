# Decisions

Updated: 2026-10-10

1. **Evidence levels are canonical.** Projects use E0-E8 labels in `research/PROJECT_REGISTRY.yaml`; claims must not exceed their evidence level.
2. **Project Genesis is the research flagship.** It has the strongest code/artifact/test base and should receive the first Pass 2 research hardening effort.
3. **BU1LD and FinanceMeta remain separate products.** They may share engineering patterns, but must preserve distinct public claims, terminology, and user journeys.
4. **GenesisE is a synthetic economics core.** It must not imply real-market validity without real datasets and external validation.
5. **MonteCarlo is archived for now.** It has no files beyond Git metadata, so it should not consume active engineering time until a real objective is provided.
6. **Recovered source identities are bound, not promoted.** Olympus, VertexED, Obscured Records Agent, PI-JEPA, APEN/PEN, RIPII, Eigen-JEPA, Eigen-Finance, LGWM, NPMS, ATG, and NeuroCAD now have explicit source bindings. A binding proves location/identity only; it does not prove novelty, correctness, reproducibility, publication readiness, or release readiness. IPII remains only partially resolved. ESNF and NFGM remain E0 because no matching local or connected-organization repository was found.
7. **Portfolio readiness must be executable, not only documented.** `bun run portfolio:preflight` is now the canonical local command for checking registry alignment, dirty state, release commands, migrations, placeholder/source risks, secret-like literals, broken local Markdown links, evidence levels, and release blockers across accessible roots.
8. **Every project has a fail-closed canonical state.** `research/project-states/<id>/STATE.json` plus append-only `HISTORY.jsonl` govern checkpoint advancement. Existing state is never overwritten by initialization.
9. **The member portal reuses the governed evidence model.** `/workspace` is the canonical member work surface and uses durable memberships, milestones, contributions, reviewer notes, and exports already protected by Supabase RLS/RPCs. Application acceptance is not itself evidence, and submitted work is not called verified.
