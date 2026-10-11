# Portfolio Map

Updated: 2026-10-10.

## Canonical lanes found

| Lane | Canonical repository | Status | Disposition |
| --- | --- | --- | --- |
| The BU1LD | `/Volumes/PRO-BLADE/GitHubRepos/BU1LD-Web` | Governed workspace for this pass | PRODUCT |
| FinanceMeta | `/Volumes/PRO-BLADE/GitHubRepos/Finance4all-Web/finance4all-global-reach` | Relocated standalone repository | PRODUCT |
| Research Collections / developmental ML | `/Volumes/PRO-BLADE/GitHubRepos/Old-Stuff/Genesis` | Relocated archived repository; activation decision pending | FLAGSHIP |
| Research Collections / economic simulation | `/Volumes/PRO-BLADE/GitHubRepos/Old-Stuff/GenesisE` | Relocated archived synthetic research repository | CORE |
| MonteCarlo | `/Volumes/PRO-BLADE/GitHubRepos/Old-Stuff/Everything Else/MonteCarlo` | Empty git repository | ARCHIVE |
| Recovered named projects | See `research/SOURCE_BINDINGS.json` | Twelve identities bound; IPII partially resolved | MIXED |
| ESNF / NFGM | Canonical state folders only | No authoritative source found | HOLD |

## Source-discovery result

Explicit bindings now exist for Olympus, VertexED, Obscured Records Agent, PI-JEPA, APEN/PEN, RIPII, Eigen-JEPA, Eigen-Finance, LGWM, NPMS, ATG, and NeuroCAD. PI-JEPA is a recovered subtree rather than an independently established repository, and IPII was not independently resolved. ESNF and NFGM remain unresolved after local-drive and connected GitHub-organization discovery. See `research/SOURCE_BINDINGS.json` for the exact evidence boundary.

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
