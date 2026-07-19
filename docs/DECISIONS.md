# Decisions

Updated: 2026-07-19

1. **Evidence levels are canonical.** Projects use E0-E8 labels in `research/PROJECT_REGISTRY.yaml`; claims must not exceed their evidence level.
2. **Project Genesis is the research flagship.** It has the strongest code/artifact/test base and should receive the first Pass 2 research hardening effort.
3. **BU1LD and FinanceMeta remain separate products.** They may share engineering patterns, but must preserve distinct public claims, terminology, and user journeys.
4. **GenesisE is a synthetic economics core.** It must not imply real-market validity without real datasets and external validation.
5. **MonteCarlo is archived for now.** It has no files beyond Git metadata, so it should not consume active engineering time until a real objective is provided.
6. **Named but undiscovered projects stay E0/E1.** Olympus, VertexED, PI-JEPA, APEN/PEN, RIPII/IPII, Eigen-JEPA, Eigen-Finance, LGWM, ESNF, NFGM, NPMS, ATG, NeuroCAD, and the Obscured Records Agent were not found as runnable repositories in the accessible roots.
7. **Portfolio readiness must be executable, not only documented.** `bun run portfolio:preflight` is now the canonical local command for checking registry alignment, dirty state, release commands, migrations, placeholder/source risks, secret-like literals, broken local Markdown links, evidence levels, and release blockers across accessible roots.
