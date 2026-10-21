import {
  BOUND_SOURCE_COUNT,
  PORTFOLIO_RECORDS,
  UNRESOLVED_SOURCE_COUNT,
  WEBSITE_DESTINATIONS,
} from "@/data/portfolio";
import {
  PUBLIC_RESEARCH_PORTFOLIO,
  getResearchAtlasCounts,
  RESEARCH_ATLAS_SOURCE_REVISION,
} from "@/data/research-portfolio";
import { SITE_URL } from "@/lib/seo";

export const PUBLIC_PORTFOLIO_MANIFEST_PATH = "/portfolio-manifest.json";
export const PUBLIC_PORTFOLIO_MANIFEST_SCHEMA = "1.0.0";

export const EVIDENCE_LEVELS = {
  E0: "Identity or idea only",
  E1: "Written specification",
  E2: "Code exists",
  E3: "Smoke-tested",
  E4: "Controlled result or complete local user flow",
  E5: "Multi-seed benchmark or comprehensive product test",
  E6: "External dataset or real-user evidence",
  E7: "Independent reproduction or external reviewer confirmation",
  E8: "Release-ready or production-ready after live credentials and external checks",
} as const;

export function getPublicPortfolioManifest() {
  return {
    schemaVersion: PUBLIC_PORTFOLIO_MANIFEST_SCHEMA,
    publisher: {
      name: "The BU1LD",
      url: SITE_URL,
      manifestUrl: new URL(PUBLIC_PORTFOLIO_MANIFEST_PATH, SITE_URL).toString(),
    },
    evidenceNotice:
      "Source binding, code presence, and local execution are distinct from scientific validation, independent reproduction, publication, and production readiness.",
    evidenceLevels: EVIDENCE_LEVELS,
    sources: {
      portfolioRegistry: "research/PROJECT_REGISTRY.yaml",
      publicPortfolioProjection: "src/data/portfolio.ts",
      researchAtlasProjection: "src/data/research-portfolio.ts",
      researchAtlasSourceRevision: RESEARCH_ATLAS_SOURCE_REVISION,
    },
    counts: {
      destinations: WEBSITE_DESTINATIONS.length,
      portfolioIdentities: PORTFOLIO_RECORDS.length,
      boundSourceIdentities: BOUND_SOURCE_COUNT,
      unresolvedSourceIdentities: UNRESOLVED_SOURCE_COUNT,
      researchLines: PUBLIC_RESEARCH_PORTFOLIO.length,
      researchAtlasClassification: getResearchAtlasCounts(),
    },
    destinations: WEBSITE_DESTINATIONS.map((destination) => ({
      ...destination,
      portfolioProfileUrl: destination.projectId
        ? new URL(`/portfolio/${destination.projectId}`, SITE_URL).toString()
        : null,
    })),
    portfolioIdentities: PORTFOLIO_RECORDS.map((record) => ({
      ...record,
      profileUrl: new URL(`/portfolio/${record.id}`, SITE_URL).toString(),
    })),
    researchAtlas: PUBLIC_RESEARCH_PORTFOLIO.map((record) => ({
      ...record,
      profileUrl: new URL(`/research-atlas/${record.slug}`, SITE_URL).toString(),
      portfolioProfileUrl: record.portfolioRecordId
        ? new URL(`/portfolio/${record.portfolioRecordId}`, SITE_URL).toString()
        : null,
    })),
  };
}

export function generatePublicPortfolioManifestJson(): string {
  return `${JSON.stringify(getPublicPortfolioManifest(), null, 2)}\n`;
}
