import { describe, expect, test } from "bun:test";

import {
  loginPathWithRedirect,
  postAuthDestination,
  postAuthNavigateTarget,
  programApplyPath,
  signupPathWithRedirect,
} from "./post-auth-redirect";

describe("post-auth redirect", () => {
  test("accepts safe in-app paths", () => {
    expect(postAuthDestination("/programs/research-fellowship")).toBe(
      "/programs/research-fellowship",
    );
    expect(postAuthDestination("//evil.com")).toBe("/dashboard");
    expect(postAuthDestination("https://evil.com")).toBe("/dashboard");
  });

  test("maps institution program slugs to member apply destinations", () => {
    expect(programApplyPath("research-fellowship")).toBe("/programs/research-fellowship");
    expect(programApplyPath("open-competitions")).toBe("/competitions");
  });

  test("builds signup and login URLs with encoded redirect", () => {
    expect(signupPathWithRedirect("/programs/ai-builder-cohort")).toContain(
      "redirect=%2Fprograms%2Fai-builder-cohort",
    );
    expect(loginPathWithRedirect("/projects")).toContain("redirect=%2Fprojects");
  });

  test("maps redirect paths to typed navigate targets", () => {
    expect(postAuthNavigateTarget("/programs/research-fellowship")).toEqual({
      to: "/programs/$slug",
      params: { slug: "research-fellowship" },
    });
    expect(postAuthNavigateTarget("/projects/defect-worlds")).toEqual({
      to: "/projects/$slug",
      params: { slug: "defect-worlds" },
    });
    expect(postAuthNavigateTarget("/papers/attention")).toEqual({
      to: "/papers/$slug",
      params: { slug: "attention" },
    });
    expect(postAuthNavigateTarget("/research")).toEqual({ to: "/research" });
    expect(postAuthNavigateTarget("/competitions")).toEqual({ to: "/competitions" });
    expect(postAuthNavigateTarget("//evil")).toEqual({ to: "/dashboard" });
  });
});
