import { describe, expect, test } from "bun:test";

import { validateDatasetInput } from "@/lib/project-datasets";

describe("project-datasets", () => {
  test("rejects empty name", () => {
    expect(validateDatasetInput({ name: "" })).toMatch(/name/i);
    expect(validateDatasetInput({ name: "a" })).toMatch(/name/i);
  });

  test("rejects unsafe source URL", () => {
    expect(validateDatasetInput({ name: "CIFAR-10", sourceUrl: "javascript:alert(1)" })).toMatch(
      /http/i,
    );
  });

  test("accepts valid input", () => {
    expect(
      validateDatasetInput({ name: "CIFAR-10", sourceUrl: "https://example.com/data" }),
    ).toBeNull();
  });
});
