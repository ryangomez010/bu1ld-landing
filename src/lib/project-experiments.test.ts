import { describe, expect, test } from "bun:test";

import { validateExperimentInput } from "@/lib/project-experiments";

describe("project-experiments", () => {
  test("rejects short title and hypothesis", () => {
    expect(validateExperimentInput({ title: "ab", hypothesis: "too short" })).toMatch(/title/i);
    expect(validateExperimentInput({ title: "Baseline run", hypothesis: "short" })).toMatch(
      /hypothesis/i,
    );
  });

  test("rejects unsafe evidence URL", () => {
    expect(
      validateExperimentInput({
        title: "Ablation A",
        hypothesis: "Removing hard negatives hurts evidence F1.",
        evidenceUrl: "ftp://files.example.com/x",
      }),
    ).toMatch(/http/i);
  });

  test("accepts valid experiment input", () => {
    expect(
      validateExperimentInput({
        title: "Ablation A",
        hypothesis: "Removing hard negatives hurts evidence F1.",
        evidenceUrl: "https://github.com/org/repo",
      }),
    ).toBeNull();
  });
});
