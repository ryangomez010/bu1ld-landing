import { describe, expect, test } from "bun:test";
import { emptyWorkspaceDraft, loadWorkspaceDraft, saveWorkspaceDraft } from "./workspace-draft";

describe("workspace draft persistence", () => {
  test("restores evidence, visibility and milestone for only the matching account and project", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      },
      removeItem: (key: string) => {
        values.delete(key);
      },
    };
    const draft = {
      ...emptyWorkspaceDraft(),
      title: "Reproduction",
      summary: "Negative result retained",
      evidenceUrl: "https://example.org/artifact",
      contributionType: "experiment" as const,
      visibility: "private" as const,
      milestoneId: "m1",
    };
    expect(saveWorkspaceDraft("a", "p1", draft, storage)).toBe(true);
    expect(loadWorkspaceDraft("a", "p1", storage)).toEqual(draft);
    expect(loadWorkspaceDraft("b", "p1", storage)).toEqual(emptyWorkspaceDraft());
    expect(loadWorkspaceDraft("a", "p2", storage)).toEqual(emptyWorkspaceDraft());
    expect(saveWorkspaceDraft("a", "p1", emptyWorkspaceDraft(), storage)).toBe(true);
    expect(loadWorkspaceDraft("a", "p1", storage)).toEqual(emptyWorkspaceDraft());
  });

  test("rejects malformed fields and reports unavailable storage without losing in-page work", () => {
    const readOnly = {
      getItem: () =>
        '{"title":123,"summary":"Valid text","visibility":"everyone","contributionType":"admin"}',
      setItem: () => {
        throw new Error("Full");
      },
      removeItem: () => {
        throw new Error("Full");
      },
    };
    expect(loadWorkspaceDraft("a", "p1", readOnly)).toEqual({
      ...emptyWorkspaceDraft(),
      summary: "Valid text",
    });
    expect(
      saveWorkspaceDraft("a", "p1", { ...emptyWorkspaceDraft(), title: "Keep this" }, readOnly),
    ).toBe(false);
    const blocked = {
      ...readOnly,
      getItem: () => {
        throw new Error("Blocked");
      },
    };
    expect(loadWorkspaceDraft("a", "p1", blocked)).toEqual(emptyWorkspaceDraft());
  });
});
