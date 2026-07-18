import { describe, expect, test } from "bun:test";

import { paginateItems } from "./admin-pagination";

describe("admin pagination", () => {
  test("slices the current page", () => {
    const items = Array.from({ length: 30 }, (_, i) => i + 1);
    const page1 = paginateItems(items, 1, 10);
    expect(page1.items).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(page1.totalPages).toBe(3);
    expect(page1.hasPrev).toBe(false);
    expect(page1.hasNext).toBe(true);
  });

  test("clamps out-of-range pages", () => {
    const page = paginateItems(["a", "b", "c"], 99, 2);
    expect(page.page).toBe(2);
    expect(page.items).toEqual(["c"]);
  });

  test("handles empty lists", () => {
    const page = paginateItems([], 1, 25);
    expect(page.items).toEqual([]);
    expect(page.totalPages).toBe(1);
    expect(page.hasNext).toBe(false);
  });
});
