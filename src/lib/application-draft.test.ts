import { describe, expect, test } from "bun:test";
import { clearPitchDraft, loadApplicationDraft, saveApplicationDraft } from "./application-draft";

describe("project application drafts", () => {
  test("preserves legacy pitches, saves question answers, and isolates accounts/projects", () => {
    const values = new Map<string, string>([["build:pitch-draft:a:p1", "Existing pitch"]]);
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      },
      removeItem: (key: string) => {
        values.delete(key);
      },
    };
    expect(loadApplicationDraft("a", "p1", storage)).toEqual({
      pitch: "Existing pitch",
      answers: {},
    });
    const draft = {
      pitch: "Specific deliverable",
      answers: { q1: "Relevant work", q2: "5 hours" },
    };
    expect(saveApplicationDraft("a", "p1", draft, storage)).toBe(true);
    expect(loadApplicationDraft("a", "p1", storage)).toEqual(draft);
    expect(loadApplicationDraft("a", "p2", storage)).toEqual({ pitch: "", answers: {} });
    expect(loadApplicationDraft("b", "p1", storage)).toEqual({ pitch: "", answers: {} });
    clearPitchDraft("a", "p1", storage);
    expect(loadApplicationDraft("a", "p1", storage)).toEqual({ pitch: "", answers: {} });
  });

  test("storage failure cannot throw away the current editor or block a confirmed submission", () => {
    const fail = () => {
      throw new Error("Storage blocked");
    };
    const storage = { getItem: fail, setItem: fail, removeItem: fail };
    expect(loadApplicationDraft("a", "p1", storage)).toEqual({ pitch: "", answers: {} });
    expect(saveApplicationDraft("a", "p1", { pitch: "Text", answers: {} }, storage)).toBe(false);
    expect(() => clearPitchDraft("a", "p1", storage)).not.toThrow();
  });
});
