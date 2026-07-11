import { describe, expect, test } from "bun:test";

import { parseCreateProjectInput, parseLeadRequestInput } from "./validation";

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
