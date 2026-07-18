import { fetchMyApplications } from "@/lib/projects";
import { fetchSavedItems } from "@/lib/saved";
import { fetchNotifications } from "@/lib/notifications";
import { fetchProfile } from "@/lib/profile";
import { getReadPaperSlugs } from "@/lib/paper-read";
import { getAllPaperNotesForExport } from "@/lib/paper-notes";
import { getAllPaperScrollProgressLocal } from "@/lib/paper-notes";
import { getAllGuideProgress } from "@/lib/reading-progress";
import { getRecentViews } from "@/lib/recent-views";
import { isNewsletterSubscribed } from "@/lib/newsletter-subscribe";
import { fetchMyContributionsForExport } from "@/lib/contribution-export";

export type AccountExport = {
  exported_at: string;
  profile: Awaited<ReturnType<typeof fetchProfile>>;
  applications: Awaited<ReturnType<typeof fetchMyApplications>>;
  saved_items: Awaited<ReturnType<typeof fetchSavedItems>>;
  notifications: Awaited<ReturnType<typeof fetchNotifications>>;
  contributions: Awaited<ReturnType<typeof fetchMyContributionsForExport>>["rows"];
  papers_read: string[];
  paper_scroll_progress: Record<string, number>;
  paper_notes: Record<string, string>;
  guide_progress: Awaited<ReturnType<typeof getAllGuideProgress>>;
  recent_views: ReturnType<typeof getRecentViews>;
  newsletter_subscribed: boolean;
};

export async function buildAccountExport(userId: string): Promise<AccountExport> {
  const [
    profile,
    applications,
    saved_items,
    notifications,
    papersRead,
    guide_progress,
    paper_notes,
    newsletter_subscribed,
    contributionExport,
  ] = await Promise.all([
    fetchProfile(userId),
    fetchMyApplications(userId),
    fetchSavedItems(userId),
    fetchNotifications(userId),
    getReadPaperSlugs(userId),
    getAllGuideProgress(userId),
    getAllPaperNotesForExport(userId),
    isNewsletterSubscribed(userId),
    fetchMyContributionsForExport(userId),
  ]);

  return {
    exported_at: new Date().toISOString(),
    profile,
    applications,
    saved_items,
    notifications,
    contributions: contributionExport.rows,
    papers_read: [...papersRead],
    paper_scroll_progress: getAllPaperScrollProgressLocal(userId),
    paper_notes,
    guide_progress,
    recent_views: getRecentViews(userId),
    newsletter_subscribed,
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
