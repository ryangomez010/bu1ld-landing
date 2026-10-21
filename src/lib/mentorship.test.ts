import { describe, expect, test } from "bun:test";
import { parseMentorshipRequest } from "./validation";

describe("mentorship request validation", () => {
  test("requires a bounded topic, goal and availability", () => {
    expect(
      parseMentorshipRequest({ topic: "ML", goal: "too short", availabilityNote: "weekends" }).data,
    ).toBeNull();
    expect(
      parseMentorshipRequest({
        topic: "Evaluation design",
        goal: "I want feedback on a reproducible evaluation plan before I start experiments.",
        availabilityNote: "Weekends, UTC+5:30",
      }).data?.topic,
    ).toBe("Evaluation design");
  });
});
