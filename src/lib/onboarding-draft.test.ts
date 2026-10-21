import { describe, expect, test } from "bun:test";
import {
  clearOnboardingDraft,
  loadOnboardingDraft,
  parseOnboardingDraft,
  saveOnboardingDraft,
  validateOnboardingDetails,
  type OnboardingDraft,
} from "./onboarding-draft";

const draft: OnboardingDraft = {
  step: 3,
  fullName: "Ada",
  bio: "Build",
  background: "engineer",
  interests: ["AI"],
  githubUrl: "",
  linkedinUrl: "",
  timezone: "Asia/Kolkata",
  availabilityHours: "5",
  experienceLevel: "student",
  desiredRoles: "Research contributor",
};

describe("onboarding drafts", () => {
  test("preserves every step field and isolates accounts on a shared browser", () => {
    const values = new Map<string, string>([
      ["build:onboarding-draft", JSON.stringify({ fullName: "Another person" })],
    ]);
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      },
      removeItem: (key: string) => {
        values.delete(key);
      },
    };
    expect(loadOnboardingDraft("b", storage)).toEqual({});
    saveOnboardingDraft("a", draft, storage);
    expect(loadOnboardingDraft("a", storage)).toEqual(draft);
    expect(loadOnboardingDraft("b", storage)).toEqual({});
    clearOnboardingDraft("b", storage);
    expect(loadOnboardingDraft("a", storage)).toEqual(draft);
    clearOnboardingDraft("a", storage);
    expect(loadOnboardingDraft("a", storage)).toEqual({});
  });

  test("ignores malformed browser data and tolerates storage failures", () => {
    expect(parseOnboardingDraft(null)).toEqual({});
    expect(
      parseOnboardingDraft({
        step: 12,
        fullName: 45,
        interests: [null, "AI"],
        background: "owner",
      }),
    ).toEqual({ interests: ["AI"] });
    const fail = () => {
      throw new Error("Storage disabled");
    };
    const storage = { getItem: fail, setItem: fail, removeItem: fail };
    expect(loadOnboardingDraft("a", storage)).toEqual({});
    expect(() => saveOnboardingDraft("a", draft, storage)).not.toThrow();
    expect(() => clearOnboardingDraft("a", storage)).not.toThrow();
  });

  test("rejects incomplete earlier steps before profile completion", () => {
    expect(validateOnboardingDetails(" A ", ["AI"])).toEqual({
      step: 0,
      error: "Enter a name with at least 2 characters.",
    });
    expect(validateOnboardingDetails("Ada", [])?.step).toBe(1);
    expect(validateOnboardingDetails("Ada", ["AI"])).toBeNull();
  });
});
