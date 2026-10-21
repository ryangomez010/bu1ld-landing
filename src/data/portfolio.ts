export type WebsiteAvailability = "live" | "preview" | "private";

export type WebsiteDestination = {
  id: string;
  projectId?: string;
  name: string;
  role: string;
  description: string;
  availability: WebsiteAvailability;
  publicUrl: string | null;
  repositoryUrl: string;
  note: string;
};

export type PortfolioRecord = {
  id: string;
  name: string;
  classification: string;
  evidenceLevel: `E${number}`;
  sourceStatus: string;
  category: string;
  objective: string;
  implemented: string;
  intendedOutput: string;
  limitations: string[];
  repositoryUrl?: string;
};

/**
 * Public destinations are deliberately separate products. A link here records a
 * verified destination; it does not imply shared accounts, production readiness,
 * or scientific validation.
 */
export const WEBSITE_DESTINATIONS: WebsiteDestination[] = [
  {
    id: "bu1ld-nexus",
    projectId: "bu1ld-nexus",
    name: "The BU1LD",
    role: "Research and builder institution",
    description:
      "The public home for BU1LD research, programs, projects, and the member evidence workflow.",
    availability: "live",
    publicUrl: "https://thebu1ld.com/",
    repositoryUrl: "https://github.com/ryangomez010/bu1ld-landing",
    note: "Public site responded successfully on 11 October 2026.",
  },
  {
    id: "financemeta-public",
    projectId: "financemeta",
    name: "FinanceMeta",
    role: "Public finance research and education",
    description:
      "The public FinanceMeta site for research protocols, programs, reading tools, and participation paths.",
    availability: "live",
    publicUrl: "https://finance-meta-landing.vercel.app/",
    repositoryUrl: "https://github.com/build-the-future-11/FinanceMeta-Landing",
    note: "Public deployment responded successfully on 11 October 2026.",
  },
  {
    id: "financemeta-member",
    projectId: "financemeta",
    name: "FinanceMeta member portal",
    role: "Member learning and evidence workspace",
    description:
      "The separate account surface for finance learning, evidence review, and member workflows.",
    availability: "live",
    publicUrl: "https://finance4all-global-reach.vercel.app/",
    repositoryUrl: "https://github.com/build-the-future-11/finance4all-global-reach",
    note: "Public deployment responded successfully on 11 October 2026.",
  },
  {
    id: "iyern",
    name: "IYERN",
    role: "Youth economics research network",
    description:
      "An evidence-bounded pre-launch archive, submission route, and public research standard for youth economics work.",
    availability: "live",
    publicUrl: "https://iy-ern.vercel.app/",
    repositoryUrl: "https://github.com/build-the-future-11/Iy-ERN",
    note: "Public deployment responded successfully on 11 October 2026; the archive truthfully remains empty until verified submissions exist.",
  },
  {
    id: "vertexed",
    projectId: "vertexed",
    name: "VertexED",
    role: "Adaptive learning product",
    description: "A separate education product for guided study and adaptive learning experiences.",
    availability: "preview",
    publicUrl: "https://vertex-ed-ai.vercel.app/",
    repositoryUrl: "https://github.com/vertex-studyAI/vertexED.ai",
    note: "Fallback deployment is reachable; the custom domain remains unlinked until TLS is repaired.",
  },
  {
    id: "obscured-records-agent",
    projectId: "obscured-records-agent",
    name: "Obscured Records",
    role: "Evidence-led editorial product",
    description:
      "A long-form publication and research archive with a deliberately separate editorial identity.",
    availability: "private",
    publicUrl: null,
    repositoryUrl: "https://github.com/build-the-future-11/Obscured-Records",
    note: "The hosted reader is owner-only, so this directory links source without bypassing access control.",
  },
];

/**
 * Browser-safe projection of research/SOURCE_BINDINGS.json. Local filesystem
 * paths and internal notes never ship to the public client.
 */
export const PORTFOLIO_RECORDS: PortfolioRecord[] = [
  {
    id: "bu1ld-nexus",
    name: "The BU1LD Nexus",
    classification: "PRODUCT",
    evidenceLevel: "E4",
    sourceStatus: "BOUND_CURRENT_CHECKOUT",
    category: "Research-and-builder institution platform",
    objective:
      "Create a credible journey from public discovery and applications to contribution evidence and public proof.",
    implemented:
      "A TanStack and Vite product with public institutional routes, a member portal, project workflows, evidence controls, tests, release scripts, and a phased Supabase schema.",
    intendedOutput: "A deployable public site, member portal, and research evidence system.",
    limitations: [
      "Live Supabase checks and multi-role production journeys remain external release gates.",
      "The paper analyzer is deterministic triage, not citation verification or scientific review.",
    ],
    repositoryUrl: "https://github.com/ryangomez010/bu1ld-landing",
  },
  {
    id: "financemeta",
    name: "FinanceMeta / Finance4All Global Reach",
    classification: "PRODUCT",
    evidenceLevel: "E4",
    sourceStatus: "BOUND_RELOCATED_REPOSITORY",
    category: "Finance education and member platform",
    objective: "Support a distinct visitor-to-member finance learning and contribution journey.",
    implemented:
      "A Vite React product with Supabase migrations, edge functions, member workflows, tests, release scripts, and product documentation.",
    intendedOutput:
      "A deployable finance website, member portal, programs, and editorial workflow.",
    limitations: [
      "Finance claims must not imply investment performance without artifact-backed evidence.",
      "Live RLS verification and full browser journeys have not been re-established for this profile.",
    ],
    repositoryUrl: "https://github.com/build-the-future-11/finance4all-global-reach",
  },
  {
    id: "project-genesis",
    name: "Project Genesis",
    classification: "FLAGSHIP",
    evidenceLevel: "E4",
    sourceStatus: "BOUND_ARCHIVED_REPOSITORY",
    category: "Continual and modular learning research",
    objective:
      "Test bounded developmental modular learning with sparse routing and continual-learning controls.",
    implemented:
      "A Python package with configurations, command-line entry points, tests, synthetic and vision loaders, smoke artifacts, and paper and audit documentation.",
    intendedOutput:
      "A reproducible research release with code, configurations, raw runs, a paper packet, and multi-seed experiments.",
    limitations: [
      "Smoke artifacts do not support public benchmark or novelty claims.",
      "The declared multi-seed public benchmark campaign and independent reproduction remain incomplete.",
    ],
  },
  {
    id: "genesis-econ",
    name: "GenesisE / Genesis Economics Edition",
    classification: "CORE",
    evidenceLevel: "E4",
    sourceStatus: "BOUND_ARCHIVED_REPOSITORY",
    category: "Synthetic economic intelligence simulator",
    objective:
      "Provide an executable lab for adaptive markets, memory, regimes, agents, counterfactuals, and economic world models.",
    implemented:
      "A dependency-free Python package with simulation modules, a CLI, benchmark and validation artifacts, documentation, and tests.",
    intendedOutput:
      "A reproducible synthetic economic simulation package with explicit validation artifacts.",
    limitations: [
      "All retained evidence is synthetic and internal; it does not establish real-market validity.",
      "The broad program surface still needs stronger nearest-baseline comparisons.",
    ],
  },
  {
    id: "montecarlo",
    name: "MonteCarlo",
    classification: "ARCHIVE",
    evidenceLevel: "E0",
    sourceStatus: "BOUND_EMPTY_REPOSITORY",
    category: "Empty or uninitialized research repository",
    objective: "No research objective is evidenced by the current source.",
    implemented: "Only repository metadata was found; no implementation or artifacts were present.",
    intendedOutput: "Undetermined until a precise, falsifiable objective is supplied.",
    limitations: ["No question, code, dataset, test, license, or result has been established."],
  },
  {
    id: "visualization-scratch",
    name: "Codex visualization scratch root",
    classification: "ARCHIVE",
    evidenceLevel: "E0",
    sourceStatus: "UNRESOLVED_NON_PROJECT",
    category: "Scratch artifact directory",
    objective: "No standalone project objective was discovered.",
    implemented: "No project files were found in the registered scratch location.",
    intendedOutput: "Conversation visualizations, not a research release.",
    limitations: ["This is retained for identity completeness and is not presented as a project."],
  },
  {
    id: "olympus",
    name: "Olympus",
    classification: "RESEARCH_PLATFORM",
    evidenceLevel: "E2",
    sourceStatus: "BOUND_DISCOVERED_REPOSITORY",
    category: "Cognitive research platform and model foundry",
    objective:
      "Reconcile distinct model and study lines without collapsing their protocols or evidence.",
    implemented: "A source repository has been discovered and identity-bound.",
    intendedOutput: "An evidence-governed local research platform.",
    limitations: [
      "Source binding establishes identity and code presence only, not a reproduced scientific result.",
    ],
    repositoryUrl: "https://github.com/build-the-future-11/olympus-cognitive-architecture",
  },
  {
    id: "vertexed",
    name: "VertexED",
    classification: "PRODUCT",
    evidenceLevel: "E2",
    sourceStatus: "BOUND_DISCOVERED_REPOSITORY",
    category: "Adaptive education product",
    objective: "Establish product evidence and release integrity for guided learning workflows.",
    implemented: "A source repository and reachable fallback deployment have been identified.",
    intendedOutput: "A verified production education platform.",
    limitations: [
      "The custom domain is excluded until TLS is repaired.",
      "Repository discovery and a preview URL do not establish production readiness.",
    ],
    repositoryUrl: "https://github.com/vertex-studyAI/vertexED.ai",
  },
  {
    id: "obscured-records-agent",
    name: "Obscured Records Agent",
    classification: "PRODUCT",
    evidenceLevel: "E2",
    sourceStatus: "BOUND_DISCOVERED_REPOSITORY",
    category: "Editorial and publishing product",
    objective: "Establish product evidence and release integrity for an editorial workflow.",
    implemented: "A source repository has been discovered and identity-bound.",
    intendedOutput: "A verified editorial product and publication workflow.",
    limitations: [
      "The hosted reader remains owner-only and this directory does not bypass that access boundary.",
      "Source discovery alone is not evidence of a public production release.",
    ],
    repositoryUrl: "https://github.com/build-the-future-11/Obscured-Records",
  },
  {
    id: "pi-jepa",
    name: "PI-JEPA",
    classification: "RESEARCH",
    evidenceLevel: "E1",
    sourceStatus: "BOUND_RECOVERED_SOURCE",
    category: "Physics-informed joint-embedding predictive architecture",
    objective: "Reconcile the recovered source before defining an independently scoped study.",
    implemented:
      "A source subtree was recovered, but no standalone repository identity was proven.",
    intendedOutput: "An independently scoped, falsifiable study.",
    limitations: [
      "Recovered source is specification-level evidence and does not establish a runnable result.",
    ],
  },
  {
    id: "apen-pen",
    name: "APEN / PEN",
    classification: "RESEARCH",
    evidenceLevel: "E2",
    sourceStatus: "BOUND_DISCOVERED_REPOSITORY",
    category: "Adaptive predictive engram networks",
    objective: "Reconcile APEN and PEN identities against retained protocols and outcomes.",
    implemented: "A source repository has been discovered and identity-bound.",
    intendedOutput: "An evidence-bound research release.",
    limitations: [
      "Code presence does not qualify scientific claims; protocol and outcome reconciliation remain required.",
    ],
  },
  {
    id: "ripii-ipii",
    name: "RIPII / IPII",
    classification: "RESEARCH",
    evidenceLevel: "E2",
    sourceStatus: "BOUND_PARTIAL_IDENTITY",
    category: "Representation and projective reasoning research",
    objective: "Reconcile the RIPII source and the unresolved IPII identity.",
    implemented: "RIPII source was found; IPII was not independently resolved.",
    intendedOutput: "An evidence-bound research release after identity reconciliation.",
    limitations: [
      "The combined label remains partial and must not imply that both source identities are verified.",
    ],
  },
  {
    id: "eigen-jepa",
    name: "Eigen-JEPA",
    classification: "RESEARCH",
    evidenceLevel: "E2",
    sourceStatus: "BOUND_DISCOVERED_REPOSITORY",
    category: "Spectral financial predictive representation research",
    objective: "Test spectral market-state prediction under a frozen protocol.",
    implemented: "A source repository has been discovered and identity-bound.",
    intendedOutput: "An evidence-bound research release.",
    limitations: [
      "No controlled result or protected-evaluation outcome is claimed by this source binding.",
    ],
  },
  {
    id: "eigen-finance",
    name: "Eigen-Finance",
    classification: "RESEARCH",
    evidenceLevel: "E1",
    sourceStatus: "BOUND_DISCOVERED_REPOSITORY",
    category: "Financial latent-structure research",
    objective: "Define a precise falsifiable study beyond the currently reserved repository scope.",
    implemented: "A reserved-scope repository has been discovered.",
    intendedOutput: "A precise falsifiable study.",
    limitations: ["The current scope is too thin to support implementation or result claims."],
  },
  {
    id: "lgwm",
    name: "LGWM",
    classification: "RESEARCH",
    evidenceLevel: "E1",
    sourceStatus: "BOUND_DISCOVERED_REPOSITORY",
    category: "Liquidation graph world models",
    objective: "Define a precise falsifiable study beyond the currently reserved repository scope.",
    implemented: "A reserved-scope repository has been discovered.",
    intendedOutput: "A precise falsifiable study.",
    limitations: ["The current scope is too thin to support implementation or result claims."],
  },
  {
    id: "esnf",
    name: "ESNF",
    classification: "RESEARCH",
    evidenceLevel: "E0",
    sourceStatus: "UNRESOLVED_NO_LOCAL_OR_ORG_REPOSITORY",
    category: "Unresolved research identity",
    objective: "Unknown until an authoritative source and research question are recovered.",
    implemented: "No authoritative source was found in the registered local or organization scope.",
    intendedOutput: "Unknown.",
    limitations: ["No source, protocol, implementation, or result is currently attributable."],
  },
  {
    id: "nfgm",
    name: "NFGM",
    classification: "RESEARCH",
    evidenceLevel: "E0",
    sourceStatus: "UNRESOLVED_NO_LOCAL_OR_ORG_REPOSITORY",
    category: "Unresolved research identity",
    objective: "Unknown until an authoritative source and research question are recovered.",
    implemented: "No authoritative source was found in the registered local or organization scope.",
    intendedOutput: "Unknown.",
    limitations: ["No source, protocol, implementation, or result is currently attributable."],
  },
  {
    id: "npms",
    name: "NPMS",
    classification: "RESEARCH",
    evidenceLevel: "E2",
    sourceStatus: "BOUND_DISCOVERED_REPOSITORY",
    category: "Neural predictive memory systems",
    objective: "Reconcile controlled diagnostics with the precise claim under test.",
    implemented: "A source repository has been discovered and identity-bound.",
    intendedOutput: "An evidence-bound research release.",
    limitations: [
      "Controlled diagnostics and a frozen evaluation boundary remain necessary before result claims.",
    ],
  },
  {
    id: "atg",
    name: "Adaptive Theory Geometry",
    classification: "RESEARCH",
    evidenceLevel: "E2",
    sourceStatus: "BOUND_DISCOVERED_REPOSITORY",
    category: "Adaptive geometry and experimental design",
    objective: "Reconcile the manuscript, implementation, and retained experiment receipts.",
    implemented: "A source repository has been discovered and identity-bound.",
    intendedOutput: "An evidence-bound research release.",
    limitations: [
      "The manuscript and retained receipts still need claim-level reconciliation and reproduction.",
    ],
  },
  {
    id: "neurocad",
    name: "NeuroCAD",
    classification: "PRODUCT_RESEARCH",
    evidenceLevel: "E2",
    sourceStatus: "BOUND_DISCOVERED_REPOSITORY",
    category: "Bounded language-to-CAD system",
    objective: "Preserve compiler evidence separately from open-ended intelligence claims.",
    implemented: "A source repository has been discovered and identity-bound.",
    intendedOutput: "A verified product and bounded research artifact.",
    limitations: [
      "Compiler behavior can support bounded engineering claims, not general intelligence claims.",
    ],
  },
];

export const BOUND_SOURCE_COUNT = PORTFOLIO_RECORDS.filter(
  (record) => !record.sourceStatus.startsWith("UNRESOLVED"),
).length;

export const UNRESOLVED_SOURCE_COUNT = PORTFOLIO_RECORDS.length - BOUND_SOURCE_COUNT;

export function getPortfolioRecord(id: string): PortfolioRecord | undefined {
  return PORTFOLIO_RECORDS.find((record) => record.id === id);
}

export function getWebsiteDestinations(id: string): WebsiteDestination[] {
  return WEBSITE_DESTINATIONS.filter((destination) => destination.projectId === id);
}
