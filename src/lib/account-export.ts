import { fetchMyApplications } from "@/lib/projects";
import { fetchSavedItems } from "@/lib/saved";
import { fetchNotifications } from "@/lib/notifications";
import { fetchProfile } from "@/lib/profile";
import { getReadPaperSlugs } from "@/lib/paper-read";
import { getAllGuideProgress } from "@/lib/reading-progress";
import { getRecentViews } from "@/lib/recent-views";

export type AccountExport = {
  exported_at: string;
  profile: Awaited<ReturnType<typeof fetchProfile>>;
  applications: Awaited<ReturnType<typeof fetchMyApplications>>;
  saved_items: Awaited<ReturnType<typeof fetchSavedItems>>;
  notifications: Awaited<ReturnType<typeof fetchNotifications>>;
  papers_read: string[];
  guide_progress: Awaited<ReturnType<typeof getAllGuideProgress>>;
  recent_views: ReturnType<typeof getRecentViews>;
};

export async function buildAccountExport(userId: string): Promise<AccountExport> {
  const [profile, applications, saved_items, notifications, papersRead, guide_progress] =
    await Promise.all([
      fetchProfile(userId),
      fetchMyApplications(userId),
      fetchSavedItems(userId),
      fetchNotifications(userId),
      getReadPaperSlugs(userId),
      getAllGuideProgress(userId),
    ]);

  return {
    exported_at: new Date().toISOString(),
    profile,
    applications,
    saved_items,
    notifications,
    papers_read: [...papersRead],
    guide_progress,
    recent_views: getRecentViews(userId),
  };
}

export function downloadAccountExport(data: AccountExport, filename?: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename ?? `build-account-export-${data.exported_at.slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
