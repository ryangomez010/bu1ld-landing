import { describe, expect, test } from "bun:test";

import { absoluteSiteUrl, pageHead, privatePageHead, titleFromSlug } from "./seo";

describe("SEO metadata", () => {
  test("builds a canonical first-party URL", () => {
    expect(absoluteSiteUrl("projects")).toBe("https://thebu1ld.com/projects");
    expect(absoluteSiteUrl("/evidence")).toBe("https://thebu1ld.com/evidence");
  });

  test("keeps canonical and social URLs aligned", () => {
    const head = pageHead({
      title: "Projects — The Bu1ld",
      description: "Browse scoped technical work.",
      path: "/projects",
    });

    expect(head.links).toContainEqual({
      rel: "canonical",
      href: "https://thebu1ld.com/projects",
    });
    expect(head.meta).toContainEqual({
      property: "og:url",
      content: "https://thebu1ld.com/projects",
    });
  });

  test("turns stable route slugs into readable fallback titles", () => {
    expect(titleFromSlug("counterfactual-defect-worlds")).toBe("Counterfactual Defect Worlds");
  });

  test("marks authenticated surfaces as non-indexable", () => {
    expect(privatePageHead("Dashboard — The Bu1ld").meta).toContainEqual({
      name: "robots",
      content: "noindex, nofollow",
    });
  });
});
