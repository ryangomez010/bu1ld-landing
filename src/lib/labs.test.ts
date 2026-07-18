import { describe, expect, test } from "bun:test";

import { seedLabsAsDb } from "@/lib/labs";

describe("labs", () => {
  test("seedLabsAsDb maps institution labs", () => {
    const labs = seedLabsAsDb();
    expect(labs.length).toBeGreaterThanOrEqual(6);
    expect(labs.every((l) => l.slug && l.name && l.short_name)).toBe(true);
    expect(labs.every((l) => l.id.startsWith("seed-"))).toBe(true);
    expect(labs.every((l) => l.published)).toBe(true);
  });

  test("seed labs include scientific-discovery", () => {
    const lab = seedLabsAsDb().find((l) => l.slug === "scientific-discovery");
    expect(lab?.short_name).toBe("Scientific Discovery");
    expect(lab?.open_roles.length).toBeGreaterThan(0);
  });
});
