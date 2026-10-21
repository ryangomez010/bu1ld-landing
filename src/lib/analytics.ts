/**
 * Privacy-respecting analytics adapter (Plausible-style).
 * No-ops when VITE_ANALYTICS_DOMAIN is unset — live integration unconfigured.
 */

function analyticsDomain(): string | null {
  const domain =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_ANALYTICS_DOMAIN?.trim()) || null;
  return domain || null;
}

export function isAnalyticsConfigured(): boolean {
  return Boolean(analyticsDomain());
}

/** Strip identifiers as well as queries: public and private record slugs can share routes. */
export function analyticsPath(path: string): string {
  const raw = path.split(/[?#]/, 1)[0];
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/";
  let pathname: string;
  try {
    const decoded = decodeURIComponent(raw);
    if (
      decoded.startsWith("//") ||
      decoded.includes("\\") ||
      Array.from(decoded).some((character) => character.charCodeAt(0) < 32)
    )
      return "/member";
    pathname = new URL(decoded, "https://analytics.invalid").pathname;
  } catch {
    return "/member";
  }
  const parts = pathname.split("/").filter(Boolean);
  const root = parts[0] ?? "";
  if (root === "projects" && ["manage", "edit", "new"].includes(parts[1])) return "/member";
  if (root === "research" && ["analyze", "submit", "highlights"].includes(parts[1]))
    return "/member";
  const publicRoots = [
    "",
    "research-atlas",
    "research",
    "portfolio",
    "network",
    "projects",
    "guides",
    "papers",
    "events",
    "forms",
    "apply",
    "labs",
    "programs-public",
    "publications",
    "evidence",
    "search",
    "people",
    "partnerships",
    "competitions",
  ];
  if (!publicRoots.includes(root)) return "/member";
  if (!root) return "/";
  if (parts.length > 1) {
    // Nested management paths are never treated as public records.
    if (parts.length > 2) return "/member";
    return `/${root}/detail`;
  }
  return `/${root}`;
}

const PROP_VALUES = {
  project_status: ["open", "active", "closed"],
  item_type: ["project", "guide", "paper", "event", "research_intake"],
  content_type: ["project", "guide", "paper", "event"],
  source: [
    "homepage",
    "participation_directory",
    "local",
    "synced",
    "account_bookmark",
    "browser_bookmark",
    "account_collection",
  ],
  opportunity_kind: ["project", "program", "research"],
  application_path: ["internal", "external"],
  action: ["expand", "follow_source"],
  destination_host: ["tally.so"],
} as const;

export function analyticsProps(props?: Record<string, string | number | boolean>) {
  if (!props) return undefined;
  const safe: Record<string, string | number | boolean> = {};
  for (const [key, allowed] of Object.entries(PROP_VALUES)) {
    const value = props[key];
    if (typeof value === "string" && (allowed as readonly string[]).includes(value))
      safe[key] = value;
  }
  if (typeof props.completed === "boolean") safe.completed = props.completed;
  if (
    typeof props.result_count === "number" &&
    Number.isInteger(props.result_count) &&
    props.result_count >= 0 &&
    props.result_count <= 100000
  )
    safe.result_count = props.result_count;
  if (typeof props.destination === "string") safe.destination = analyticsPath(props.destination);
  return safe;
}

const EVENT_NAMES = new Set([
  "public_search",
  "landing_primary_cta_clicked",
  "landing_evidence_cta_clicked",
  "featured_project_viewed",
  "lesson_completed",
  "paper_saved",
  "opportunity_detail_viewed",
  "opportunity_intake_outbound",
  "application_started",
  "application_submitted",
]);

export function analyticsEvent(name: string, props?: Record<string, string | number | boolean>) {
  return EVENT_NAMES.has(name) ? { name, props: analyticsProps(props) } : null;
}

export function trackPageView(path?: string): void {
  const domain = analyticsDomain();
  if (!domain || typeof window === "undefined") return;
  const url = analyticsPath(path ?? window.location.pathname);
  try {
    void fetch("https://plausible.io/api/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "pageview", url: window.location.origin + url, domain }),
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    /* Analytics must never block a user action. */
  }
}

export function trackEvent(name: string, props?: Record<string, string | number | boolean>): void {
  const domain = analyticsDomain();
  const event = analyticsEvent(name, props);
  if (!domain || typeof window === "undefined" || !event) return;
  try {
    void fetch("https://plausible.io/api/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...event,
        url: window.location.origin + analyticsPath(window.location.pathname),
        domain,
      }),
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    /* Analytics must never block a user action. */
  }
}
