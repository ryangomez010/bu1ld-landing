import { describe, expect, test } from "bun:test";

import {
  analyticsEvent,
  analyticsPath,
  analyticsProps,
  isAnalyticsConfigured,
  trackEvent,
  trackPageView,
} from "@/lib/analytics";

describe("analytics", () => {
  test("isAnalyticsConfigured is false without VITE_ANALYTICS_DOMAIN", () => {
    expect(isAnalyticsConfigured()).toBe(false);
  });

  test("trackPageView and trackEvent no-op when unconfigured", () => {
    expect(() => trackPageView("/labs")).not.toThrow();
    expect(() => trackEvent("signup_click", { source: "test" })).not.toThrow();
  });
});

test("analytics excludes query strings, callbacks, private paths and free text", () => {
  expect(analyticsPath("/search?q=private+idea#email")).toBe("/search");
  expect(analyticsPath("/auth/callback?code=secret")).toBe("/member");
  expect(analyticsPath("/profile/private-user-id")).toBe("/member");
  expect(analyticsPath("https://external.test/?token=secret")).toBe("/");
  expect(
    analyticsProps({
      q: "private idea",
      email: "person@example.test",
      destination: "/papers?q=secret",
      project_slug: "neurocad",
      source: "private free text",
      result_count: 4,
    }),
  ).toEqual({ result_count: 4, destination: "/papers" });
});

test("analytics paths never expose private management or dynamic record identities", () => {
  for (const path of [
    "/projects/manage/private-uuid?answer=secret",
    "/projects/edit/private-uuid",
    "/projects/new",
    "/projects/%6danage/private-uuid",
    "/projects/../profile/private-user-id",
    "/research/analyze",
    "/research/submit?idea=secret",
    "/research/highlights/private-id",
    "/projects/%ZZ",
    "/projects/%5cprivate",
    "/projects/%00private",
  ])
    expect(analyticsPath(path)).toBe("/member");
  for (const root of ["projects", "papers", "guides", "events", "people", "research-atlas"]) {
    expect(analyticsPath(`/${root}/private-record?email=person@example.test#answer`)).toBe(
      `/${root}/detail`,
    );
  }
  expect(analyticsPath("/projects")).toBe("/projects");
  expect(analyticsPath("//attacker.test/private")).toBe("/");
});

test("analytics events accept coarse enumerations and discard arbitrary personal fields", () => {
  const privateProps = {
    user_id: "private-user-id",
    email: "person@example.test",
    answers: "private answer",
    query: "private search",
    opportunity_id: "private-opportunity",
    project_slug: "unpublished-idea",
    source: "person@example.test",
    action: "private answer",
    destination_host: "private.example.test",
    result_count: Infinity,
  };
  for (const name of ["application_started", "application_submitted"]) {
    expect(
      analyticsEvent(name, {
        ...privateProps,
        opportunity_kind: "program",
        application_path: "internal",
      }),
    ).toEqual({
      name,
      props: { opportunity_kind: "program", application_path: "internal" },
    });
  }
  expect(analyticsEvent("private-user-id", privateProps)).toBeNull();
  expect(
    analyticsProps({
      result_count: -1,
      completed: "private answer",
      destination: "/projects/edit/private-id?answers=secret",
    }),
  ).toEqual({ destination: "/member" });
  expect(analyticsProps({ result_count: 1.5 })).toEqual({});
  expect(
    analyticsEvent("opportunity_intake_outbound", {
      ...privateProps,
      opportunity_kind: "research",
      application_path: "external",
      destination_host: "tally.so",
      source: "participation_directory",
    }),
  ).toEqual({
    name: "opportunity_intake_outbound",
    props: {
      source: "participation_directory",
      opportunity_kind: "research",
      application_path: "external",
      destination_host: "tally.so",
    },
  });
});
