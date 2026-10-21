import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(path, "utf8");

describe("public landing release", () => {
  test("does not block first-time visitors behind a cinematic intro", () => {
    const route = read("src/routes/index.tsx");
    expect(route).not.toContain("GenesisIntro");
    expect(route).not.toContain("intro-seen");
  });

  test("uses project discovery as the dominant hero conversion", () => {
    const hero = read("src/components/landing/HeroSection.tsx");
    const header = read("src/components/landing/SiteHeader.tsx");
    const contact = read("src/components/landing/ContactSection.tsx");
    expect(hero).toContain('to="/projects"');
    expect(hero).toContain("Find a project");
    expect(hero).toContain('to="/evidence"');
    expect(hero).toContain("recruiting, active, or closed");
    expect(hero).not.toContain("experimental");
    expect(header).toContain('to="/apply"');
    expect(header).toContain("Apply");
    expect(contact).toContain('to="/projects"');
    expect(contact).toContain("Find a project");
  });

  test("keeps public reading and account-only actions unambiguous", () => {
    const hero = read("src/components/landing/HeroSection.tsx");
    const membership = read("src/components/landing/MembershipSection.tsx");
    const landingData = read("src/data/landing.ts");
    expect(hero).toContain("Public library · read without an account");
    expect(membership).toContain("Reading paths are public");
    expect(membership).toContain("An account is required to save progress");
    expect(landingData).toContain("Open the public library");
    expect(membership).not.toContain("Guides and contribution tools require an account");
  });

  test("exposes a concise in-page journey with real section targets", () => {
    const route = read("src/routes/index.tsx");
    const nav = read("src/components/landing/LandingSectionNav.tsx");
    const data = read("src/data/landing.ts");
    const projects = read("src/components/landing/FeaturedProjectsSection.tsx");
    expect(route.indexOf("<LandingSectionNav />")).toBeGreaterThan(
      route.indexOf("<HeroSection />"),
    );
    expect(nav).toContain('aria-label="Explore this page"');
    expect(data).toContain('["Open work", "active-work"]');
    expect(projects).toContain('id="active-work"');
  });

  test("keeps private member routes out of crawling and auth pages out of the sitemap", () => {
    const robots = read("public/robots.txt");
    const sitemap = read("public/sitemap.xml");
    const login = read("src/routes/login.tsx");
    const signup = read("src/routes/signup.tsx");
    expect(robots).toContain("Disallow: /account");
    expect(robots).toContain("Disallow: /profile");
    expect(robots).toContain("Disallow: /workspace");
    expect(sitemap).not.toContain("https://thebu1ld.com/login");
    expect(sitemap).not.toContain("https://thebu1ld.com/signup");
    expect(sitemap).not.toContain("https://thebu1ld.com/workspace");
    expect(login).toContain("privatePageHead");
    expect(signup).toContain("privatePageHead");
  });

  test("does not rerender global navigation every second for a decorative clock", () => {
    expect(read("src/components/landing/SiteHeader.tsx")).not.toContain("setInterval");
    expect(read("src/components/landing/SiteFooter.tsx")).not.toContain("setInterval");
  });

  test("project discovery exposes network recovery without losing application state", () => {
    const projectRoute = read("src/routes/projects/$slug.tsx");
    expect(projectRoute).toContain("Retry project");
    expect(projectRoute).toContain("your account and");
    expect(projectRoute).toContain("finally");
  });

  test("anonymous project detail fetch avoids private workspace columns", () => {
    const projects = read("src/lib/projects.ts");
    expect(projects).toContain("PUBLIC_PROJECT_COLUMNS");
    expect(projects).toContain("if (!session)");
    expect(projects).toContain('.eq("published", true)');
  });

  test("status labels distinguish recruiting from closed applications", () => {
    const labels = read("src/data/seed/projects.ts");
    expect(labels).toContain('open: "Recruiting"');
    expect(labels).toContain('closed: "Closed"');
  });
});
