export const queryKeys = {
  dashboard: {
    catalog: ["dashboard", "catalog"] as const,
    member: (userId: string) => ["dashboard", "member", userId] as const,
  },
  notifications: (userId: string) => ["notifications", userId] as const,
  projects: (status?: string) => ["projects", status ?? "all"] as const,
};
