import { describe, expect, test } from "bun:test";

import {
  parseCreateProjectInput,
  parseLeadRequestInput,
  parseUpdateProjectInput,
} from "./validation";

describe("validation", () => {
  test("parseCreateProjectInput rejects short title", () => {
    const result = parseCreateProjectInput({
      title: "ab",
      description: "A long enough description for validation to pass the minimum length check.",
      type: "research",
      skills_needed: ["ml"],
      tags: ["ai"],
      capacity: 3,
    });
    expect(result.data).toBeNull();
    expect(result.error).toContain("Title");
  });

  test("parseCreateProjectInput accepts valid input", () => {
    const result = parseCreateProjectInput({
      title: "Counterfactual Worlds",
      description: "A research project exploring counterfactual defect analysis in world models.",
      type: "research",
      skills_needed: ["pytorch"],
      tags: ["world-models"],
      capacity: 4,
      discord_url: "https://discord.gg/example",
    });
    expect(result.error).toBeNull();
    expect(result.data?.title).toBe("Counterfactual Worlds");
  });

  test("parseUpdateProjectInput accepts safe internal and external workspace links", () => {
    const result = parseUpdateProjectInput({
      status: "closed",
      workspace_links: [
        { label: "Research library", url: "/research" },
        { label: "Source repository", url: "https://github.com/example/project" },
      ],
    });
    expect(result.error).toBeNull();
    expect(result.data?.workspace_links).toHaveLength(2);
  });

  test("parseUpdateProjectInput rejects unsafe resource URLs and publication overrides", () => {
    expect(
      parseUpdateProjectInput({
        workspace_links: [{ label: "Unsafe", url: "javascript:alert(1)" }],
      }).error,
    ).toMatch(/safe internal path/i);
    expect(
      parseUpdateProjectInput({ published: false } as Parameters<typeof parseUpdateProjectInput>[0])
        .error,
    ).toBeTruthy();
  });

  test("parseLeadRequestInput enforces minimum length", () => {
    const result = parseLeadRequestInput("Too short");
    expect(result.data).toBeNull();
    expect(result.error).toBeTruthy();
  });

  test("parseLeadRequestInput accepts substantive message", () => {
    const result = parseLeadRequestInput(
      "I have led two research sprints and published one workshop paper on efficient transformers.",
    );
    expect(result.error).toBeNull();
    expect(result.data?.message.length).toBeGreaterThan(40);
  });
});
