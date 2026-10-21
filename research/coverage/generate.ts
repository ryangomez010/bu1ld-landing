import { readFileSync, writeFileSync } from "node:fs";
import { PORTFOLIO_RECORDS } from "../../src/data/portfolio";
import {
  getResearchAtlasCounts,
  getResearchBrief,
  getResearchRecordClassification,
  PUBLIC_RESEARCH_PORTFOLIO,
} from "../../src/data/research-portfolio";

// This is a reconciliation view of existing registries, never a replacement registry.
const bindings = JSON.parse(readFileSync("research/SOURCE_BINDINGS.json", "utf8"));
const exclusions = JSON.parse(readFileSync("research/coverage/dispositions.json", "utf8"));
const evidence = JSON.parse(readFileSync("research/coverage/source-checks.json", "utf8"));
const researchIds = new Set(
  PUBLIC_RESEARCH_PORTFOLIO.map((item) => item.portfolioRecordId).filter(Boolean),
);
const atlas = PUBLIC_RESEARCH_PORTFOLIO.map((project) => {
  const brief = getResearchBrief(project.slug);
  if (!brief) throw new Error(`Missing research brief: ${project.slug}`);
  const canonicalId = project.portfolioRecordId ?? project.slug;
  return {
    canonicalId,
    name: project.title,
    aliases: brief.aliases,
    ownerOrganization: brief.owner,
    classification: getResearchRecordClassification(project),
    parentCanonicalId: project.parentSlug ?? null,
    includedInCanonicalAtlasProjectCount: getResearchRecordClassification(project) === "project",
    sourceReferences: [
      "src/data/research-portfolio.ts",
      ...(project.portfolioRecordId
        ? ["research/PROJECT_REGISTRY.yaml", "research/SOURCE_BINDINGS.json"]
        : []),
      ...brief.sources.map((source) => source.url ?? source.label),
    ],
    visibilityPermission:
      "Existing published description or verified public source; private source details excluded",
    scientificStatus: project.publicStatus,
    publicationStatus: brief.publication,
    recruitmentStatus: brief.recruitment,
    evidenceDate: brief.evidenceDate,
    sourceReviewedAt: brief.reviewedAt,
    canonicalUrl: `/research-atlas/${project.slug}`,
    connectedProfileUrl: project.portfolioRecordId
      ? `/portfolio/${project.portfolioRecordId}`
      : null,
    migrationAction: "Retain canonical slug and render expanded evidence-bounded brief",
    unresolvedGaps: [project.evidenceBoundary, brief.nextStep],
  };
});
const sourceOnly = PORTFOLIO_RECORDS.filter((record) => !researchIds.has(record.id)).map(
  (record) => ({
    canonicalId: record.id,
    name: record.name,
    aliases: [],
    ownerOrganization:
      record.id === "financemeta"
        ? "FinanceMeta"
        : record.id === "vertexed"
          ? "VertexED"
          : record.id === "obscured-records-agent"
            ? "Obscured Records"
            : "Existing canonical registry; owner not reverified",
    classification: record.classification,
    parentCanonicalId: null,
    includedInCanonicalAtlasProjectCount: false,
    sourceReferences: [
      "research/PROJECT_REGISTRY.yaml",
      "research/SOURCE_BINDINGS.json",
      "src/data/portfolio.ts",
    ],
    visibilityPermission:
      "Existing sanitized public profile only; private artifact permission not inferred",
    scientificStatus: `${record.evidenceLevel}; ${record.sourceStatus}`,
    publicationStatus: "No publication status inferred from source binding",
    recruitmentStatus: "Unverified",
    evidenceDate: "2026-10-10",
    sourceReviewedAt: "2026-10-16",
    canonicalUrl: `/portfolio/${record.id}`,
    connectedProfileUrl: null,
    migrationAction:
      "Preserve existing source-identity profile without manufacturing research evidence",
    unresolvedGaps: record.limitations,
  }),
);
const ledger = {
  schemaVersion: 1,
  asOf: "2026-10-16",
  visibility: "Internal reconciliation artifact; do not ship this ledger to the browser",
  canonicalRegistry: "research/PROJECT_REGISTRY.yaml",
  existingPublicProjection: "src/data/research-portfolio.ts",
  countDefinitions: {
    publicAtlas: getResearchAtlasCounts(),
    sourceIdentities: PORTFOLIO_RECORDS.length,
    overlappingAtlasSourceIdentities: researchIds.size,
    distinctCoverageRecords: atlas.length + sourceOnly.length,
    note: "Atlas page records include subprojects, foundries, proposals and a direction with unresolved identity. Canonical atlas projects exclude subprojects, collections and unresolved directions. No count implies evaluated, published, recruiting or independently reproduced work.",
  },
  sourceBindingIds: bindings.projects.map((item: { id: string }) => item.id),
  records: [...atlas, ...sourceOnly],
  dispositions: exclusions,
  sourceChecks: evidence,
};
const target = "research/coverage/PROJECT_COVERAGE_2026-10-16.json";
const output = `${JSON.stringify(ledger, null, 2)}\n`;
if (process.argv.includes("--check")) {
  if (readFileSync(target, "utf8") !== output)
    throw new Error("Project coverage drift; run bun research/coverage/generate.ts");
  console.log("Project coverage is synchronized with the existing canonical sources.");
} else {
  writeFileSync(target, output);
  console.log(
    `Reconciled ${ledger.records.length} coverage records; ${getResearchAtlasCounts().records} atlas pages.`,
  );
}
