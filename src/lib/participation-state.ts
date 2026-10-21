import type { Project } from "@/lib/types";

/** Historical identity is preserved; an expired wave cannot be silently reopened. */
export function closeExpiredCohort<T extends Pick<Project, "slug" | "status" | "description">>(
  project: T,
  now = Date.now(),
): T {
  if (project.slug !== "ai-builder-cohort-q2" || now < Date.parse("2026-07-01T00:00:00Z"))
    return project;
  return {
    ...project,
    status: "closed",
    description:
      "Historical Q2 2026 builder cohort. The advertised period has ended. Successor dates, reviewer capacity and registration have not been confirmed; retain this record as an archive, not an open call.",
  };
}
