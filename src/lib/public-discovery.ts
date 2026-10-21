import { notFound } from "@tanstack/react-router";

import type { ResearchKind, ResearchStage } from "@/data/research-portfolio";

export type PortfolioFilter = "all" | "products" | "research" | "archive" | "unresolved";
export type NetworkSearch = { q?: string; filter?: Exclude<PortfolioFilter, "all"> };
export type AtlasFilter = "all" | ResearchKind | ResearchStage;
export type AtlasSearch = { q?: string; filter?: Exclude<AtlasFilter, "all"> };

export const PUBLIC_SEARCH_MAX_LENGTH = 120;
export const PORTFOLIO_FILTERS = ["all", "products", "research", "archive", "unresolved"] as const;
const ATLAS_FILTERS: readonly AtlasFilter[] = [
  "all",
  "idea",
  "study",
  "report",
  "paper",
  "scoping",
  "experiment",
  "review",
  "published",
  "archived",
];

function searchQuery(value: unknown): string | undefined {
  return typeof value === "string" && value ? value.slice(0, PUBLIC_SEARCH_MAX_LENGTH) : undefined;
}

export function parseNetworkSearch(search: Record<string, unknown>): NetworkSearch {
  const filter = PORTFOLIO_FILTERS.find((value) => value === search.filter);
  return { q: searchQuery(search.q), filter: filter === "all" ? undefined : filter };
}

export function parseAtlasSearch(search: Record<string, unknown>): AtlasSearch {
  const filter = ATLAS_FILTERS.find((value) => value === search.filter);
  return { q: searchQuery(search.q), filter: filter === "all" ? undefined : filter };
}

/** Do not turn browser shortcuts, composition, or typing into page navigation. */
export function shouldFocusPublicSearch(
  event: Pick<
    KeyboardEvent,
    "key" | "defaultPrevented" | "isComposing" | "repeat" | "altKey" | "ctrlKey" | "metaKey"
  >,
  activeElement: (Pick<Element, "tagName" | "closest"> & { isContentEditable?: boolean }) | null,
): boolean {
  if (
    event.key !== "/" ||
    event.defaultPrevented ||
    event.isComposing ||
    event.repeat ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey
  )
    return false;
  return (
    !activeElement ||
    (!["INPUT", "TEXTAREA", "SELECT"].includes(activeElement.tagName) &&
      !activeElement.isContentEditable &&
      !activeElement.closest('[contenteditable="true"], [contenteditable=""], [role="textbox"]'))
  );
}

/** Static registries can establish missing records before rendering a public page. */
export function requirePublicRecord<T>(record: T | null | undefined): T {
  if (record == null) throw notFound();
  return record;
}
