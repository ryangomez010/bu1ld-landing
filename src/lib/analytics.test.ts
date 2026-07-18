import { describe, expect, test } from "bun:test";

import { isAnalyticsConfigured, trackEvent, trackPageView } from "@/lib/analytics";

describe("analytics", () => {
  test("isAnalyticsConfigured is false without VITE_ANALYTICS_DOMAIN", () => {
    expect(isAnalyticsConfigured()).toBe(false);
  });

  test("trackPageView and trackEvent no-op when unconfigured", () => {
    expect(() => trackPageView("/labs")).not.toThrow();
    expect(() => trackEvent("signup_click", { source: "test" })).not.toThrow();
  });
});
