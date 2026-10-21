import { getAllGuides } from "@/content/guides";
import { getPublishedRecentPaperReviews } from "@/lib/recent-paper-reviews";
import { PORTFOLIO_RECORDS } from "@/data/portfolio";
import { PUBLIC_RESEARCH_PORTFOLIO } from "@/data/research-portfolio";
import { SITE_URL } from "@/lib/seo";

type SitemapFrequency = "daily" | "weekly" | "monthly" | "yearly";

export type SitemapEntry = {
  path: string;
  changefreq: SitemapFrequency;
  priority: number;
};

const PRIMARY_ROUTES: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: 1 },
  ...["/guides", "/papers", "/events", "/forms"].map((path) => ({
    path,
    changefreq: "weekly" as const,
    priority: 0.9,
  })),
  { path: "/labs", changefreq: "weekly", priority: 0.9 },
  { path: "/programs-public", changefreq: "weekly", priority: 0.9 },
  { path: "/apply", changefreq: "weekly", priority: 0.9 },
  { path: "/projects", changefreq: "daily", priority: 0.9 },
  { path: "/competitions", changefreq: "weekly", priority: 0.8 },
  { path: "/publications", changefreq: "weekly", priority: 0.8 },
  { path: "/evidence", changefreq: "weekly", priority: 0.7 },
  { path: "/network", changefreq: "weekly", priority: 0.8 },
];

const INSTITUTION_ROUTES: SitemapEntry[] = [
  { path: "/partnerships", changefreq: "monthly", priority: 0.7 },
  { path: "/people", changefreq: "monthly", priority: 0.6 },
  { path: "/privacy", changefreq: "yearly", priority: 0.3 },
  { path: "/terms", changefreq: "yearly", priority: 0.3 },
  { path: "/research-atlas", changefreq: "weekly", priority: 0.9 },
];

function portfolioSitemapEntry(id: string, classification: string): SitemapEntry {
  if (id === "visualization-scratch") {
    return { path: `/portfolio/${id}`, changefreq: "monthly", priority: 0.4 };
  }
  if (classification === "ARCHIVE" || id === "esnf" || id === "nfgm") {
    return { path: `/portfolio/${id}`, changefreq: "monthly", priority: 0.5 };
  }
  if (
    [
      "bu1ld-nexus",
      "financemeta",
      "project-genesis",
      "genesis-econ",
      "olympus",
      "vertexed",
      "obscured-records-agent",
      "neurocad",
    ].includes(id)
  ) {
    return { path: `/portfolio/${id}`, changefreq: "weekly", priority: 0.7 };
  }
  return { path: `/portfolio/${id}`, changefreq: "weekly", priority: 0.6 };
}

export function getPublicSitemapEntries(): SitemapEntry[] {
  return [
    ...PRIMARY_ROUTES,
    ...getAllGuides().map((guide) => ({
      path: `/guides/${guide.slug}`,
      changefreq: "monthly" as const,
      priority: 0.7,
    })),
    ...getPublishedRecentPaperReviews().map((review) => ({
      path: `/papers/${review.slug}`,
      changefreq: "weekly" as const,
      priority: 0.7,
    })),
    ...PORTFOLIO_RECORDS.map((record) => portfolioSitemapEntry(record.id, record.classification)),
    ...INSTITUTION_ROUTES,
    ...PUBLIC_RESEARCH_PORTFOLIO.map((item) => ({
      path: `/research-atlas/${item.slug}`,
      changefreq: "weekly" as const,
      priority: 0.7,
    })),
  ];
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function generateSitemapXml(entries = getPublicSitemapEntries()): string {
  const urls = entries
    .map(
      (entry) => `  <url>
    <loc>${escapeXml(new URL(entry.path, SITE_URL).toString())}</loc>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority.toFixed(1)}</priority>
  </url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}
