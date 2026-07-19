# Portfolio Map

Generated: 2026-07-19.

## Canonical lanes found

| Lane | Canonical repository | Status | Disposition |
| --- | --- | --- | --- |
| The BU1LD | `/Users/ryan/Downloads/the-bu1ld-nexus-main` | Mature product repo with dirty working tree and many Supabase phases | PRODUCT |
| FinanceMeta | `/Users/ryan/Downloads/finance4all-global-reach-main` | Mature product repo with dirty branch and e2e/Supabase infrastructure | PRODUCT |
| Research Collections / developmental ML | `/Users/ryan/Documents/Genesis` | Strongest research-release candidate with code, configs, runs, and paper audit | FLAGSHIP |
| Research Collections / economic simulation | `/Users/ryan/Documents/GenesisE` | Runnable synthetic economics portfolio with artifacts | CORE |
| MonteCarlo | `/Users/ryan/Documents/MonteCarlo` | Empty git repository | ARCHIVE |
| Visualization scratch | `.codex/visualizations/...` | Empty or no auditable files in shallow scan | ARCHIVE |

## Named projects not found as runnable repositories

Olympus, VertexED, Obscured Records Agent, PI-JEPA, APEN/PEN, RIPII/IPII, Eigen-JEPA, Eigen-Finance, LGWM, ESNF, NFGM, NPMS, ATG, and NeuroCAD were not discovered as standalone runnable repositories under the accessible workspace roots. If they exist inside private folders, compressed archives, or branches not mounted here, they need explicit paths in Pass 2.

## Duplicate and merge relationships

- BU1LD and FinanceMeta share product infrastructure patterns: public landing, member portal, Supabase auth/RLS, bookmarks/notifications/admin, release docs. They should not be merged because their product identities differ, but shared release/security checklists can be reused.
- Genesis and GenesisE share “Genesis” branding but target different research programs. Keep separate unless a shared research-foundry package is introduced.
- GenesisE may be surfaced inside FinanceMeta only as a clearly synthetic research lab, not as investment evidence.
- MonteCarlo should be archived or initialized with a precise objective before any engineering time is spent.

## Five research program grouping

1. Scientific ML / PDE / physics: no complete standalone repo found.
2. Predictive representations / JEPA / memory / engrams: Project Genesis is the flagship; JEPA-named repos were not found.
3. Finance / markets / economics / graph systems: GenesisE is the core; FinanceMeta is the product surface.
4. Computational biology / scientific discovery: no complete standalone repo found.
5. World models / agents / robotics / mathematical intelligence: only partial conceptual coverage inside GenesisE autonomous/economic world-model modules.
