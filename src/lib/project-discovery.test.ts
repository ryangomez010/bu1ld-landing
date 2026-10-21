import { describe, expect, test } from "bun:test";
import { filterProjects, projectSearchSchema } from "./project-discovery";
import { PUBLIC_NAV, PUBLIC_MORE_NAV, publicNavActive } from "./public-navigation";
import type { Project } from "./types";

const projects = [
  {
    id: "open",
    title: "Vision",
    description: "Train a classifier",
    status: "open",
    type: "research",
    tags: ["vision"],
    skills_needed: ["PyTorch"],
  },
  {
    id: "active",
    title: "Serving",
    description: "Deploy a model",
    status: "active",
    type: "startup",
    tags: ["systems"],
    skills_needed: ["CUDA"],
  },
  {
    id: "completed",
    title: "World models",
    description: "Completed reproduction",
    status: "closed",
    type: "research",
    tags: ["representation"],
    skills_needed: ["PyTorch"],
  },
] as Project[];

describe("project discovery", () => {
  test("all statuses includes completed work, including during search", () => {
    expect(filterProjects(projects, {})).toHaveLength(3);
    expect(filterProjects(projects, { q: "world models" }).map((p) => p.id)).toEqual(["completed"]);
    expect(filterProjects(projects, { status: "all", q: "pytorch" }).map((p) => p.id)).toEqual([
      "open",
      "completed",
    ]);
  });

  test("search, type, and status intersect without leaking completed results", () => {
    expect(
      filterProjects(projects, { q: "PYTORCH", type: "research", status: "open" }).map((p) => p.id),
    ).toEqual(["open"]);
    expect(filterProjects(projects, { q: "cuda", type: "research" })).toEqual([]);
    expect(filterProjects(projects, { type: "startup" }).map((p) => p.id)).toEqual(["active"]);
  });

  test("matches descriptions, tags, and skills with case and whitespace tolerance", () => {
    for (const q of ["  deploy  ", "SYSTEMS", "cuda"]) {
      expect(filterProjects(projects, { q }).map((p) => p.id)).toEqual(["active"]);
    }
    expect(filterProjects(projects, { q: "   " })).toHaveLength(3);
  });

  test("malformed shared links recover to usable defaults", () => {
    const search = projectSearchSchema.parse({ q: ["bad"], status: "deleted", type: "unknown" });
    expect(filterProjects(projects, search)).toHaveLength(3);
    expect(projectSearchSchema.parse({ q: "x".repeat(201) }).q).toBeUndefined();
  });

  test("shared filter values survive URL encoding and clearing restores all results", () => {
    const url = new URLSearchParams({ q: "PyTorch", status: "closed", type: "research" });
    const search = projectSearchSchema.parse(Object.fromEntries(url));
    expect(filterProjects(projects, search).map((p) => p.id)).toEqual(["completed"]);
    expect(filterProjects(projects, projectSearchSchema.parse({}))).toHaveLength(3);
  });
});

describe("shared public navigation", () => {
  test("recognizes nested routes and trailing slashes without prefix collisions", () => {
    expect(publicNavActive("/labs/robotics", "/labs")).toBe(true);
    expect(publicNavActive("/projects/", "/projects")).toBe(true);
    expect(publicNavActive("/projects-old", "/projects")).toBe(false);
    expect(publicNavActive("/programs-public", "/programs")).toBe(false);
  });

  test("every discovery destination remains reachable without duplicate entries", () => {
    const destinations = [...PUBLIC_NAV, ...PUBLIC_MORE_NAV].map((item) => item.to);
    expect(new Set(destinations).size).toBe(destinations.length);
    for (const destination of [
      "/projects",
      "/research-atlas",
      "/network",
      "/apply",
      "/evidence",
      "/people",
      "/competitions",
    ]) {
      expect(destinations).toContain(destination);
    }
  });
});
