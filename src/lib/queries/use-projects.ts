import { useQuery } from "@tanstack/react-query";

import { fetchMyApplicationStatusMap, fetchProjects } from "@/lib/projects";
import type { ProjectStatus } from "@/lib/types";

import { queryKeys } from "./keys";

export function useProjectsQuery(status?: ProjectStatus, userId?: string) {
  return useQuery({
    queryKey: [...queryKeys.projects(status), userId ?? "anon"],
    queryFn: async () => {
      const projects = await fetchProjects(status);
      const statusMap = userId ? await fetchMyApplicationStatusMap(userId) : {};
      return { projects, statusMap };
    },
    staleTime: 60_000,
  });
}
