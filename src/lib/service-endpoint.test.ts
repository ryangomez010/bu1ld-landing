import { describe, expect, test } from "bun:test";
import { resolveBearerServiceEndpoint, resolveServiceEndpoint } from "./service-endpoint";

describe("service endpoint resolution", () => {
  test("supports same-origin deployment endpoints and explicit trusted HTTPS endpoints", () => {
    expect(resolveServiceEndpoint(" /api/email ", true)).toBe("/api/email");
    expect(resolveServiceEndpoint("https://handler.example/email", true)).toBe(
      "https://handler.example/email",
    );
    expect(resolveServiceEndpoint("http://localhost:3000/api/email", false)).toBe(
      "http://localhost:3000/api/email",
    );
  });

  test("keeps bearer-token endpoints on the production site origin", () => {
    expect(resolveBearerServiceEndpoint("/api/email", true, "https://thebu1ld.com")).toBe(
      "/api/email",
    );
    expect(
      resolveBearerServiceEndpoint("https://thebu1ld.com/api/email", true, "https://thebu1ld.com"),
    ).toBe("https://thebu1ld.com/api/email");
    expect(
      resolveBearerServiceEndpoint(
        "https://collector.example/api/email",
        true,
        "https://thebu1ld.com",
      ),
    ).toBeUndefined();
  });
  test("rejects insecure, credentialed, ambiguous, and non-HTTP destinations", () => {
    for (const value of [
      undefined,
      "",
      "//external.example/api/email",
      "/\\external.example",
      "http://handler.example",
      "javascript:alert(1)",
      "https://user:secret@example.com",
      "https://example.com/ bad",
    ]) {
      expect(resolveServiceEndpoint(value, true)).toBeUndefined();
    }
  });
});
