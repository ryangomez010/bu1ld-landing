import { z } from "zod";
import type { Project } from "@/lib/types";

export const projectSearchSchema = z.object({
  q: z.string().max(200).optional().catch(undefined),
  status: z.enum(["all", "open", "active", "closed"]).optional().catch(undefined),
  type: z.enum(["all", "research", "startup", "program"]).optional().catch(undefined),
});

export type ProjectSearch = z.infer<typeof projectSearchSchema>;

export function filterProjects(projects: Project[], search: ProjectSearch): Project[] {
  const query = search.q?.trim().toLowerCase() ?? "";
  return projects.filter((project) => {
    if (search.status && search.status !== "all" && project.status !== search.status) return false;
    if (search.type && search.type !== "all" && project.type !== search.type) return false;
    return (
      !query ||
      [project.title, project.description, ...project.tags, ...project.skills_needed]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  });
}
