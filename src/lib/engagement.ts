import { fetchMyRsvpEventIds } from "@/lib/event-rsvp";
import { getReadPaperSlugs } from "@/lib/paper-read";
import { getAllGuideProgress } from "@/lib/reading-progress";
import { fetchMyApplications } from "@/lib/projects";
import { fetchSavedItems } from "@/lib/saved";

export type EngagementSummary = {
  papersRead: number;
  guidesCompleted: number;
  guidesInProgress: number;
  applicationsActive: number;
  applicationsAccepted: number;
  eventRsvps: number;
  savedItems: number;
};

export async function fetchEngagementSummary(userId: string): Promise<EngagementSummary> {
  const [reads, guideProgress, applications, rsvps, saved] = await Promise.all([
    getReadPaperSlugs(userId),
    getAllGuideProgress(userId),
    fetchMyApplications(userId),
    fetchMyRsvpEventIds(userId),
    fetchSavedItems(userId),
  ]);

  const progressValues = Object.values(guideProgress);
  const guidesCompleted = progressValues.filter((p) => p >= 95).length;
  const guidesInProgress = progressValues.filter((p) => p > 0 && p < 95).length;

  return {
    papersRead: reads.size,
    guidesCompleted,
    guidesInProgress,
    applicationsActive: applications.filter((a) =>
      ["pending", "waitlist"].includes(a.status),
    ).length,
    applicationsAccepted: applications.filter((a) => a.status === "accepted").length,
    eventRsvps: rsvps.size,
    savedItems: saved.length,
  };
}
