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
    expect(hero).toContain("recruiting, active, or completed");
    expect(hero).not.toContain("experimental");
    expect(header).toContain('to="/projects"');
    expect(header).toContain("Find a project");
    expect(contact).toContain('to="/projects"');
    expect(contact).toContain("Find a project");
  });

  test("keeps private member routes out of crawling and auth pages out of the sitemap", () => {
    const robots = read("public/robots.txt");
    const sitemap = read("public/sitemap.xml");
    const login = read("src/routes/login.tsx");
    const signup = read("src/routes/signup.tsx");
    expect(robots).toContain("Disallow: /account");
    expect(robots).toContain("Disallow: /profile");
    expect(sitemap).not.toContain("https://thebu1ld.com/login");
    expect(sitemap).not.toContain("https://thebu1ld.com/signup");
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

  test("status labels distinguish recruiting from completed work", () => {
    const labels = read("src/data/seed/projects.ts");
    expect(labels).toContain('open: "Recruiting"');
    expect(labels).toContain('closed: "Completed"');
  });
});
