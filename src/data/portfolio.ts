export type WebsiteAvailability = "live" | "preview" | "private";

export type WebsiteDestination = {
  id: string;
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
    repositoryUrl: "https://github.com/ryangomez010/bu1ld-landing",
  },
  {
    id: "financemeta",
    name: "FinanceMeta / Finance4All Global Reach",
    classification: "PRODUCT",
    evidenceLevel: "E4",
    sourceStatus: "BOUND_RELOCATED_REPOSITORY",
    repositoryUrl: "https://github.com/build-the-future-11/finance4all-global-reach",
  },
  {
    id: "project-genesis",
    name: "Project Genesis",
    classification: "FLAGSHIP",
    evidenceLevel: "E4",
    sourceStatus: "BOUND_ARCHIVED_REPOSITORY",
  },
  {
    id: "genesis-econ",
    name: "GenesisE / Genesis Economics Edition",
    classification: "CORE",
    evidenceLevel: "E4",
    sourceStatus: "BOUND_ARCHIVED_REPOSITORY",
  },
  {
    id: "montecarlo",
    name: "MonteCarlo",
    classification: "ARCHIVE",
    evidenceLevel: "E0",
    sourceStatus: "BOUND_EMPTY_REPOSITORY",
  },
  {
    id: "visualization-scratch",
    name: "Codex visualization scratch root",
    classification: "ARCHIVE",
    evidenceLevel: "E0",
    sourceStatus: "UNRESOLVED_NON_PROJECT",
  },
  {
    id: "olympus",
    name: "Olympus",
    classification: "RESEARCH_PLATFORM",
    evidenceLevel: "E2",
    sourceStatus: "BOUND_DISCOVERED_REPOSITORY",
    repositoryUrl: "https://github.com/build-the-future-11/olympus-cognitive-architecture",
  },
  {
    id: "vertexed",
    name: "VertexED",
    classification: "PRODUCT",
    evidenceLevel: "E2",
    sourceStatus: "BOUND_DISCOVERED_REPOSITORY",
    repositoryUrl: "https://github.com/vertex-studyAI/vertexED.ai",
  },
  {
    id: "obscured-records-agent",
    name: "Obscured Records Agent",
    classification: "PRODUCT",
    evidenceLevel: "E2",
    sourceStatus: "BOUND_DISCOVERED_REPOSITORY",
    repositoryUrl: "https://github.com/build-the-future-11/Obscured-Records",
  },
  {
    id: "pi-jepa",
    name: "PI-JEPA",
    classification: "RESEARCH",
    evidenceLevel: "E1",
    sourceStatus: "BOUND_RECOVERED_SOURCE",
  },
  {
    id: "apen-pen",
    name: "APEN / PEN",
    classification: "RESEARCH",
    evidenceLevel: "E2",
    sourceStatus: "BOUND_DISCOVERED_REPOSITORY",
  },
  {
    id: "ripii-ipii",
    name: "RIPII / IPII",
    classification: "RESEARCH",
    evidenceLevel: "E2",
    sourceStatus: "BOUND_PARTIAL_IDENTITY",
  },
  {
    id: "eigen-jepa",
    name: "Eigen-JEPA",
    classification: "RESEARCH",
    evidenceLevel: "E2",
    sourceStatus: "BOUND_DISCOVERED_REPOSITORY",
  },
  {
    id: "eigen-finance",
    name: "Eigen-Finance",
    classification: "RESEARCH",
    evidenceLevel: "E1",
    sourceStatus: "BOUND_DISCOVERED_REPOSITORY",
  },
  {
    id: "lgwm",
    name: "LGWM",
    classification: "RESEARCH",
    evidenceLevel: "E1",
    sourceStatus: "BOUND_DISCOVERED_REPOSITORY",
  },
  {
    id: "esnf",
    name: "ESNF",
    classification: "RESEARCH",
    evidenceLevel: "E0",
    sourceStatus: "UNRESOLVED_NO_LOCAL_OR_ORG_REPOSITORY",
  },
  {
    id: "nfgm",
    name: "NFGM",
    classification: "RESEARCH",
    evidenceLevel: "E0",
    sourceStatus: "UNRESOLVED_NO_LOCAL_OR_ORG_REPOSITORY",
  },
  {
    id: "npms",
    name: "NPMS",
    classification: "RESEARCH",
    evidenceLevel: "E2",
    sourceStatus: "BOUND_DISCOVERED_REPOSITORY",
  },
  {
    id: "atg",
    name: "Adaptive Theory Geometry",
    classification: "RESEARCH",
    evidenceLevel: "E2",
    sourceStatus: "BOUND_DISCOVERED_REPOSITORY",
  },
  {
    id: "neurocad",
    name: "NeuroCAD",
    classification: "PRODUCT_RESEARCH",
    evidenceLevel: "E2",
    sourceStatus: "BOUND_DISCOVERED_REPOSITORY",
  },
];

export const BOUND_SOURCE_COUNT = PORTFOLIO_RECORDS.filter(
  (record) => !record.sourceStatus.startsWith("UNRESOLVED"),
).length;

export const UNRESOLVED_SOURCE_COUNT = PORTFOLIO_RECORDS.length - BOUND_SOURCE_COUNT;
