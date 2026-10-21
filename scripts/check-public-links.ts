import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { resolve, relative } from "node:path";
import { getAllGuides, getGuide } from "../src/content/guides";
import { CURRICULUM_PATHS } from "../src/content/guides/curriculum";
import { getPublicPortfolioManifest } from "../src/lib/public-portfolio-manifest";
import { getPublicSitemapEntries } from "../src/lib/sitemap";
import { LABS } from "../src/data/institution";
import { getResearchBrief, PUBLIC_RESEARCH_PORTFOLIO } from "../src/data/research-portfolio";
import { OPPORTUNITIES } from "../src/lib/opportunity-directory";

// Source/record validation only. This does not claim HTTP, rendered, or private-route access.
const root = resolve(import.meta.dir, "..");
const reportPath = resolve(root, "docs/WEBSITE_LINKS_2026-10-16.json");
const previous = existsSync(reportPath) ? JSON.parse(readFileSync(reportPath, "utf8")) : {};
const previousProbes = new Map<string, unknown>(
  (previous.results ?? [])
    .filter((item: { probe?: unknown }) => item.probe)
    .map((item: { url: string; probe: unknown }) => [item.url, item.probe]),
);
const previousProbeHistory = new Map<string, unknown>(
  (previous.results ?? [])
    .filter((item: { probeHistory?: unknown }) => item.probeHistory)
    .map((item: { url: string; probeHistory: unknown }) => [item.url, item.probeHistory]),
);
const links = new Map<string, Set<string>>();
function add(value: string, source: string) {
  if (!value.startsWith("/") && !/^https?:\/\//.test(value)) return;
  const sources = links.get(value) ?? new Set<string>();
  sources.add(source);
  links.set(value, sources);
}
function walk(value: unknown, source: string) {
  if (typeof value === "string") add(value, source);
  else if (Array.isArray(value)) value.forEach((item) => walk(item, source));
  else if (value && typeof value === "object")
    Object.values(value).forEach((item) => walk(item, source));
}
function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = resolve(dir, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

const guides = getAllGuides();
for (const guide of guides) {
  add(`/guides/${guide.slug}`, "guide catalog");
  const full = await getGuide(guide.slug);
  if (!full) throw new Error(`Missing guide body: ${guide.slug}`);
  walk(full.references, `guide:${guide.slug}`);
}
for (const path of CURRICULUM_PATHS) add(`/learning/${path.exercise}`, `track:${path.slug}`);
add("/learning/README.txt", "curriculum instructions");
walk(getPublicPortfolioManifest(), "public portfolio manifest");
for (const project of PUBLIC_RESEARCH_PORTFOLIO) {
  const brief = getResearchBrief(project.slug);
  walk(brief?.sources, `research:${project.slug}`);
  for (const slug of brief?.prerequisiteLessons ?? [])
    add(`/guides/${slug}`, `research:${project.slug}`);
}
walk(OPPORTUNITIES, "participation directory");
const sitemap = getPublicSitemapEntries();
sitemap.forEach((entry) => add(entry.path, "sitemap"));
const routes = new Set<string>();
for (const path of files(resolve(root, "src/routes"))) {
  if (!path.endsWith(".tsx")) continue;
  const text = readFileSync(path, "utf8");
  for (const match of text.matchAll(/createFileRoute\(["']([^"']+)["']\)/g))
    routes.add(match[1].replace(/\/$/, "") || "/");
}
for (const dir of ["src/routes", "src/components"]) {
  for (const path of files(resolve(root, dir))) {
    if (!path.endsWith(".tsx")) continue;
    const text = readFileSync(path, "utf8");
    for (const match of text.matchAll(/(?:href|to)=["']([^"']+)["']/g))
      add(match[1], relative(root, path));
  }
}
const knownRecords = new Set([
  ...sitemap.map((entry) => entry.path),
  ...LABS.map((lab) => `/labs/${lab.slug}`),
]);
const reviewRelations: { file: string; issues: string[] }[] = [];
const guideSlugs = new Set(guides.map((guide) => guide.slug));
const manifest = getPublicPortfolioManifest();
const projectSlugs = new Set(manifest.researchAtlas.map((record) => record.slug));
for (const file of readdirSync(resolve(root, "research/paper-reviews/reviews"))) {
  if (!file.endsWith(".json")) continue;
  const review = JSON.parse(
    readFileSync(resolve(root, "research/paper-reviews/reviews", file), "utf8"),
  );
  const issues = [
    ...(review.relatedLessons ?? [])
      .filter((slug: string) => !guideSlugs.has(slug))
      .map((slug: string) => `Unknown lesson ${slug}`),
    ...(review.relatedProjects ?? [])
      .filter((slug: string) => !projectSlugs.has(slug))
      .map((slug: string) => `Unknown research project ${slug}`),
  ];
  reviewRelations.push({ file, issues });
}
const routePatterns = [...routes].map(
  (route) =>
    new RegExp(
      `^${route
        .split("/")
        .map((part) =>
          part.startsWith("$") ? "[^/]+" : part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        )
        .join("/")}$`,
    ),
);
const results = [...links]
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([url, sources]) => {
    const external = /^https?:\/\//.test(url) && !/^https:\/\/thebu1ld\.com(?:\/|$)/.test(url);
    let status: string;
    if (external) status = previousProbes.has(url) ? "EXTERNAL_CHECKED" : "EXTERNAL_NOT_PROBED";
    else {
      const pathname = new URL(url, "https://thebu1ld.com").pathname.replace(/\/$/, "") || "/";
      if (pathname.includes("$")) status = "ROUTE_TEMPLATE_REQUIRES_RUNTIME_PARAMETERS";
      else if (existsSync(resolve(root, "public", pathname.slice(1))) && pathname !== "/")
        status = "LOCAL_ARTIFACT_EXISTS";
      else if (knownRecords.has(pathname)) status = "STATIC_PUBLIC_RECORD_EXISTS";
      else if (/^\/(guides|research-atlas|portfolio|labs)\/[^/]+$/.test(pathname))
        status = "MISSING_STATIC_RECORD";
      else if (routes.has(pathname)) status = "ROUTE_EXISTS";
      else if (routePatterns.some((pattern) => pattern.test(pathname)))
        status = "DYNAMIC_RECORD_REQUIRES_PROVIDER";
      else status = "MISSING_ROUTE_OR_ARTIFACT";
    }
    return {
      url,
      status,
      sources: [...sources],
      ...(previousProbes.has(url) ? { probe: previousProbes.get(url) } : {}),
      ...(previousProbeHistory.has(url) ? { probeHistory: previousProbeHistory.get(url) } : {}),
    };
  });
const failures = results.filter((item) => item.status.startsWith("MISSING"));
const relationFailures = reviewRelations.filter((item) => item.issues.length);
const report = {
  checkedAt: new Date().toISOString(),
  scope:
    "Static public catalog bodies, sitemap, portfolio projection, research brief sources and prerequisites, participation directory, curriculum downloads, literal route/component links, and private-review related record IDs. Dynamic database records, URL fragments, other JSX expression URLs, redirects and HTTP behavior require separate runtime checks.",
  status: failures.length || relationFailures.length ? "FAIL" : "STATIC_PASS_RUNTIME_UNVERIFIED",
  guideBodiesLoaded: guides.length,
  curriculumDownloads: CURRICULUM_PATHS.length,
  routePatterns: [...routes].sort(),
  reviewRelationsChecked: reviewRelations.length,
  relationFailures,
  counts: results.reduce<Record<string, number>>(
    (counts, item) => ({ ...counts, [item.status]: (counts[item.status] ?? 0) + 1 }),
    {},
  ),
  results,
  ...(previous.externalProbe ? { externalProbe: previous.externalProbe } : {}),
};
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(
  JSON.stringify(
    { status: report.status, counts: report.counts, failures, relationFailures, reportPath },
    null,
    2,
  ),
);
if (failures.length || relationFailures.length) process.exitCode = 1;
