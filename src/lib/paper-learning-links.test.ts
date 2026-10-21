import { expect, test } from "bun:test";
import { paperLearningLinks } from "./paper-learning-links";

test("review prerequisites resolve real lessons in author order without invented or duplicate links", () => {
  const actual = paperLearningLinks([
    "ml-latent-dynamics-rollouts",
    "unknown-lesson",
    "ml-calibration",
    "ml-latent-dynamics-rollouts",
  ]);
  expect(actual.map((guide) => guide.slug)).toEqual([
    "ml-latent-dynamics-rollouts",
    "ml-calibration",
  ]);
  expect(actual.every((guide) => guide.title.length > 10)).toBe(true);
  expect(paperLearningLinks()).toEqual([]);
});
