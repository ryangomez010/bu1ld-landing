import { useQuery } from "@tanstack/react-query";

import { fetchAnnouncements } from "@/lib/announcements";
import { buildActivityFeed } from "@/lib/activity";
import { buildAttentionItems } from "@/lib/attention";
import { fetchEvents, fetchNewsletters, fetchPapers } from "@/lib/content";
import { fetchEngagementSummary } from "@/lib/engagement";
import { fetchMemberDirectory, findSimilarMembers } from "@/lib/members";
import { unreadCount } from "@/lib/notifications";
import { getAllGuideProgress } from "@/lib/reading-progress";
import { getRecentViews } from "@/lib/recent-views";
import { fetchJobs, fetchMyApplications, fetchProjects } from "@/lib/projects";
import { fetchSavedItems } from "@/lib/saved";
import { fetchReadingStreakStats } from "@/lib/reading-streaks";
import { fetchMyUpcomingRsvps } from "@/lib/event-rsvp";
import type { Profile } from "@/lib/types";

import { queryKeys } from "./keys";

export function useDashboardCatalogQuery() {
  return useQuery({
    queryKey: queryKeys.dashboard.catalog,
    queryFn: async () => {
      const [events, papers, newsletters, openProjects, internalJobs, announcements] =
        await Promise.all([
          fetchEvents(),
          fetchPapers(),
          fetchNewsletters(),
          fetchProjects("open"),
          fetchJobs("internal"),
          fetchAnnouncements(),
        ]);
      return { events, papers, newsletters, openProjects, internalJobs, announcements };
    },
    staleTime: 60_000,
  });
}

export function useDashboardMemberQuery(
  userId: string | undefined,
  profile: Profile | null | undefined,
  events: Awaited<ReturnType<typeof fetchEvents>>,
) {
  return useQuery({
    queryKey: queryKeys.dashboard.member(userId ?? ""),
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId) throw new Error("user required");
      const [
        guideProgress,
        myApplications,
        activity,
        savedItems,
        unreadNotifications,
        engagement,
        attention,
        streakStats,
      ] = await Promise.all([
        getAllGuideProgress(userId),
        fetchMyApplications(userId),
        buildActivityFeed(userId),
        fetchSavedItems(userId),
        unreadCount(userId),
        fetchEngagementSummary(userId),
        buildAttentionItems(userId, profile ?? null),
        fetchReadingStreakStats(userId),
      ]);

      const recentViews = getRecentViews(userId);
      let similarMembers: ReturnType<typeof findSimilarMembers> = [];
      if (profile?.interests?.length) {
        const members = await fetchMemberDirectory();
        similarMembers = findSimilarMembers(members, profile.interests, {
          excludeId: userId,
          limit: 4,
        });
      }
      const myRsvps = events.length ? await fetchMyUpcomingRsvps(userId, events) : [];

      return {
        guideProgress,
        myApplications,
        activity,
        savedItems,
        unreadNotifications,
        engagement,
        attention,
        papersThisWeek: streakStats.papersThisWeek,
        recentViews,
        similarMembers,
        myRsvps,
      };
    },
    staleTime: 30_000,
  });
}
