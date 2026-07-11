import { describe, expect, test } from "bun:test";

import { sharedInterests } from "./members";

describe("members", () => {
  test("sharedInterests uses exact tag match only", () => {
    expect(sharedInterests(["ml", "systems"], ["ML", "design"])).toEqual(["ml"]);
    expect(sharedInterests(["html"], ["ml"])).toEqual([]);
    expect(sharedInterests(["react"], ["reactive"])).toEqual([]);
  });
});
