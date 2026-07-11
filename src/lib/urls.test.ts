import { describe, expect, test } from "bun:test";

import { isSafeUrl, safeHref } from "./urls";

describe("url safety", () => {
  test("isSafeUrl allows http and https", () => {
    expect(isSafeUrl("https://example.com/path")).toBe(true);
    expect(isSafeUrl("http://localhost:3000")).toBe(true);
  });

  test("isSafeUrl rejects dangerous schemes", () => {
    expect(isSafeUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
    expect(isSafeUrl("file:///etc/passwd")).toBe(false);
    expect(isSafeUrl("")).toBe(false);
    expect(isSafeUrl(null)).toBe(false);
  });

  test("safeHref returns trimmed https URLs only", () => {
    expect(safeHref("  https://thebu1ld.com  ")).toBe("https://thebu1ld.com");
    expect(safeHref("javascript:void(0)")).toBeUndefined();
  });
});
