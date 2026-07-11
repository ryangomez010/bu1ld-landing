import { useQuery } from "@tanstack/react-query";

import { fetchNotifications } from "@/lib/notifications";

import { queryKeys } from "./keys";

export function useNotificationsQuery(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.notifications(userId ?? ""),
    enabled: Boolean(userId),
    queryFn: () => fetchNotifications(userId!),
    staleTime: 15_000,
  });
}
