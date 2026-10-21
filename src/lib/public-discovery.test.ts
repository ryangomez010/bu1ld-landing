import { describe, expect, test } from "bun:test";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

import { getPortfolioRecord, PORTFOLIO_RECORDS } from "@/data/portfolio";
import { getResearchPortfolioItem, PUBLIC_RESEARCH_PORTFOLIO } from "@/data/research-portfolio";
import {
  parseAtlasSearch,
  parseNetworkSearch,
  PUBLIC_SEARCH_MAX_LENGTH,
  requirePublicRecord,
  shouldFocusPublicSearch,
} from "./public-discovery";

describe("public discovery state", () => {
  test("directory filters survive an encoded detail and return journey", () => {
    for (const [parse, filter] of [
      [parseNetworkSearch, "unresolved"],
      [parseAtlasSearch, "experiment"],
    ] as const) {
      const original = { q: "memory & sequence", filter };
      const detailSearch = parse(Object.fromEntries(new URLSearchParams(original)));
      expect(detailSearch).toEqual(original);
      expect(parse(detailSearch)).toEqual(original);
    }
  });

  test("malformed shared links recover while valid long searches are bounded", () => {
    for (const parse of [parseNetworkSearch, parseAtlasSearch]) {
      expect(parse({ q: ["unexpected"], filter: "unknown" })).toEqual({
        q: undefined,
        filter: undefined,
      });
      expect(parse({ q: "x".repeat(500), filter: "all" })).toEqual({
        q: "x".repeat(PUBLIC_SEARCH_MAX_LENGTH),
        filter: undefined,
      });
      expect(parse({})).toEqual({ q: undefined, filter: undefined });
    }
    expect(parseAtlasSearch({ filter: "published" }).filter).toBe("published");
    expect(parseNetworkSearch({ filter: "products" }).filter).toBe("products");
  });
});

describe("public search keyboard access", () => {
  const slash = {
    key: "/",
    defaultPrevented: false,
    isComposing: false,
    repeat: false,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
  };
  const element = (tagName: string, isContentEditable = false, editingAncestor = false) => ({
    tagName,
    isContentEditable,
    closest: () => (editingAncestor ? ({} as Element) : null),
  });

  test("slash focuses search from ordinary page content", () => {
    expect(shouldFocusPublicSearch(slash, null)).toBe(true);
    expect(shouldFocusPublicSearch(slash, element("BODY"))).toBe(true);
    expect(shouldFocusPublicSearch(slash, element("BUTTON"))).toBe(true);
    expect(shouldFocusPublicSearch({ ...slash, key: "?" }, null)).toBe(false);
  });

  test("typing, composition, browser shortcuts, and consumed events keep their behavior", () => {
    for (const tag of ["INPUT", "TEXTAREA", "SELECT"]) {
      expect(shouldFocusPublicSearch(slash, element(tag))).toBe(false);
    }
    expect(shouldFocusPublicSearch(slash, element("DIV", true))).toBe(false);
    expect(shouldFocusPublicSearch(slash, element("SPAN", false, true))).toBe(false);
    for (const flag of [
      "defaultPrevented",
      "isComposing",
      "repeat",
      "altKey",
      "ctrlKey",
      "metaKey",
    ] as const) {
      expect(shouldFocusPublicSearch({ ...slash, [flag]: true }, null)).toBe(false);
    }
  });
});

describe("public registry missing-page responses", () => {
  test("every real public record is accepted unchanged", () => {
    for (const project of PORTFOLIO_RECORDS)
      expect(requirePublicRecord(getPortfolioRecord(project.id))).toBe(project);
    for (const project of PUBLIC_RESEARCH_PORTFOLIO)
      expect(requirePublicRecord(getResearchPortfolioItem(project.slug))).toBe(project);
  });

  test("unknown identities trigger a router 404 rather than a successful empty page", async () => {
    for (const lookup of [getPortfolioRecord, getResearchPortfolioItem]) {
      const root = createRootRoute();
      const detail = createRoute({
        getParentRoute: () => root,
        path: "/record/$id",
        loader: ({ params }) => requirePublicRecord(lookup(params.id)),
        notFoundComponent: () => null,
      });
      const router = createRouter({
        routeTree: root.addChildren([detail]),
        history: createMemoryHistory({ initialEntries: ["/record/unknown-record"] }),
        isServer: true,
      });
      await router.load();
      expect(router.state.matches.some((match) => match.status === "notFound")).toBe(true);
    }
  });
});
