import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import {
  getResearchAtlasCounts,
  getResearchBrief,
  getResearchPortfolioItem,
  getResearchRecordClassification,
  PUBLIC_RESEARCH_PORTFOLIO,
} from "../../src/data/research-portfolio";
import { PORTFOLIO_RECORDS } from "../../src/data/portfolio";
import { RESEARCH } from "../../src/data/landing";
import { getGuideSummary } from "../../src/content/guides";

describe("evidence-bounded research coverage", () => {
  test("homepage selections preserve canonical claims, statuses and detail destinations", () => {
    for (const card of RESEARCH) {
      const project = getResearchPortfolioItem(card.slug)!;
      expect(project).toBeDefined();
      expect(card.name).toBe(project.title);
      expect(card.desc).toBe(project.summary);
      expect(card.status).toBe(project.publicStatus);
      expect(card.href).toBe(`/research-atlas/${project.slug}`);
    }
  });

  test("each research page links specific existing public preparation lessons", () => {
    for (const project of PUBLIC_RESEARCH_PORTFOLIO) {
      const lessons = getResearchBrief(project.slug)!.prerequisiteLessons;
      expect(lessons.length).toBeGreaterThanOrEqual(3);
      expect(new Set(lessons).size).toBe(lessons.length);
      for (const slug of lessons) expect(getGuideSummary(slug)).toBeDefined();
    }
    expect(getResearchBrief("space-jepa")!.prerequisiteLessons).toContain(
      "ml-astronomy-candidate-validation",
    );
    expect(getResearchBrief("mahjong")!.prerequisiteLessons).toContain("ml-mdp-return-contracts");
  });

  test("FIM repository availability agrees with its verified public source", () => {
    const project = getResearchPortfolioItem("fabric-induced-memory")!;
    expect(project.repositoryUrl).toBe("https://github.com/THE-BU1LD/Fabric-Induced-Memory");
    expect(getResearchBrief(project.slug)!.sources.map((source) => source.url)).toContain(
      project.repositoryUrl,
    );
  });

  test("every canonical public record has authored question, method, evidence and next step", () => {
    for (const project of PUBLIC_RESEARCH_PORTFOLIO) {
      const brief = getResearchBrief(project.slug);
      expect(brief).toBeDefined();
      for (const field of ["question", "method", "evaluation", "nextStep"] as const) {
        expect(brief![field].length).toBeGreaterThan(50);
      }
      expect(brief!.reviewedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(brief!.recruitment).not.toContain("Apply now");
      expect(brief!.publication).not.toBe("Accepted");
    }
  });

  test("page records cannot inflate the independent project count", () => {
    const counts = getResearchAtlasCounts();
    expect(counts.records).toBe(
      counts.projects + counts.subprojects + counts.collections + counts.unresolvedDirections,
    );
    expect(counts.subprojects).toBe(1);
    const space = PUBLIC_RESEARCH_PORTFOLIO.find((project) => project.slug === "space-jepa")!;
    expect(space.parentSlug).toBe("siderea-transient-jepa");
    expect(getResearchRecordClassification(space)).toBe("subproject");
    expect(
      getResearchRecordClassification(
        PUBLIC_RESEARCH_PORTFOLIO.find((project) => project.slug === "spectral-jepa")!,
      ),
    ).toBe("unresolved direction");
  });

  test("IRIS astronomy context does not alias the robust-memory research identity", () => {
    expect(getResearchBrief("siderea-transient-jepa")!.interpretation).toContain(
      "different research identity",
    );
    expect(getResearchBrief("iris-robust-memory")!.owner).toBe("build-the-future-11 / IRIS");
    expect(getResearchBrief("space-jepa")!.owner).toContain("subproject");
  });

  test("all atlas and existing source identities are covered once in the ledger", () => {
    const ledger = JSON.parse(
      readFileSync("research/coverage/PROJECT_COVERAGE_2026-10-16.json", "utf8"),
    );
    const ids = ledger.records.map((record: { canonicalId: string }) => record.canonicalId);
    expect(new Set(ids).size).toBe(ids.length);
    for (const project of PUBLIC_RESEARCH_PORTFOLIO)
      expect(ids).toContain(project.portfolioRecordId ?? project.slug);
    for (const project of PORTFOLIO_RECORDS) expect(ids).toContain(project.id);
    expect(ledger.canonicalRegistry).toBe("research/PROJECT_REGISTRY.yaml");
  });

  test("public brief payload excludes local paths and private operational state", () => {
    const payload = JSON.stringify(
      PUBLIC_RESEARCH_PORTFOLIO.map((project) => ({
        project,
        brief: getResearchBrief(project.slug),
      })),
    );
    expect(payload).not.toMatch(
      /\/Users\/|\/Volumes\/|\/private\/|source_path|api[_-]?key|service_role/i,
    );
    expect(payload).not.toContain("dcae112cb9b04ae8961190c6148f2fec77ef46e8");
    for (const project of PUBLIC_RESEARCH_PORTFOLIO) {
      for (const source of getResearchBrief(project.slug)!.sources) {
        if (source.url) expect(new URL(source.url).protocol).toBe("https:");
      }
    }
  });

  test("unresolved aliases and private records have explicit dispositions", () => {
    const rows = JSON.parse(readFileSync("research/coverage/dispositions.json", "utf8"));
    for (const name of ["NeuroCAT", "VeriCodeGen", "FREM", "PublishProjects", "Worldcastr"]) {
      const row = rows.find((item: { name: string }) => item.name === name);
      expect(row).toBeDefined();
      expect(row.canonicalId).toBeNull();
      expect(row.gap.length).toBeGreaterThan(20);
    }
  });
});
