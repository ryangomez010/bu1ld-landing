import { useQuery } from "@tanstack/react-query";

import { fetchMyApplicationStatusMap, fetchProjects } from "@/lib/projects";
import type { ApplicationStatus, Project, ProjectStatus } from "@/lib/types";

import { queryKeys } from "./keys";

export function useProjectsQuery(
  status?: ProjectStatus,
  userId?: string,
  initialProjects?: Project[],
) {
  return useQuery({
    queryKey: [...queryKeys.projects(status), userId ?? "anon"],
    queryFn: async () => {
      const projects = await fetchProjects(status, { throwOnUnavailable: true });
      const statusMap: Map<string, ApplicationStatus> = userId
        ? await fetchMyApplicationStatusMap(userId)
        : new Map();
      return { projects, statusMap };
    },
    initialData:
      !userId && initialProjects
        ? { projects: initialProjects, statusMap: new Map<string, ApplicationStatus>() }
        : undefined,
    staleTime: 60_000,
    retry: false,
  });
}
