import { nearestDeadline } from "@/lib/date";
import { fetchEvents } from "@/lib/content";
import { profileCompleteness } from "@/lib/profile";
import { fetchMyApplications } from "@/lib/projects";
import { unreadCount } from "@/lib/notifications";
import { getAllGuideProgress } from "@/lib/reading-progress";
import type { Profile } from "@/lib/types";

export type AttentionItem = {
  id: string;
  priority: "high" | "medium" | "low";
  title: string;
  body: string;
  href: string;
  cta: string;
};

export async function buildAttentionItems(
  userId: string,
  profile: Profile | null,
): Promise<AttentionItem[]> {
  const [apps, events, unread, guideProgress] = await Promise.all([
    fetchMyApplications(userId),
    fetchEvents(),
    unreadCount(userId),
    getAllGuideProgress(userId),
  ]);

  const items: AttentionItem[] = [];

  if (!profile?.onboarding_completed) {
    items.push({
      id: "onboarding",
      priority: "high",
      title: "Complete your member profile",
      body: "Project leads see your background and links when you apply.",
      href: "/onboarding",
      cta: "Finish onboarding",
    });
  } else {
    const completeness = profileCompleteness(profile);
    if (completeness.percent < 80) {
      items.push({
        id: "profile",
        priority: "medium",
        title: `Profile ${completeness.percent}% complete`,
        body: `Add ${completeness.missing.slice(0, 2).join(", ")} to stand out in the directory.`,
        href: "/profile",
        cta: "Update profile",
      });
    }
  }

  const pending = apps.filter((a) => a.status === "pending");
  if (pending.length) {
    items.push({
      id: "pending-apps",
      priority: "medium",
      title: `${pending.length} application${pending.length === 1 ? "" : "s"} in review`,
      body: pending[0]?.project_title
        ? `Latest: ${pending[0].project_title}`
        : "Leads are reviewing your pitches.",
      href: "/applications",
      cta: "View applications",
    });
  }

  const accepted = apps.filter((a) => a.status === "accepted");
  if (accepted.length) {
    items.push({
      id: "accepted-apps",
      priority: "low",
      title: `You're on ${accepted.length} project team${accepted.length === 1 ? "" : "s"}`,
      body: "Check project updates and Discord links from your project pages.",
      href: accepted[0]?.project_slug
        ? `/projects/${accepted[0].project_slug}`
        : "/applications",
      cta: "Open project",
    });
  }

  if (unread > 0) {
    items.push({
      id: "notifications",
      priority: unread >= 5 ? "high" : "medium",
      title: `${unread} unread notification${unread === 1 ? "" : "s"}`,
      body: "Application updates, announcements, and lead messages.",
      href: "/notifications",
      cta: "Open inbox",
    });
  }

  for (const event of events) {
    const next = nearestDeadline(event.deadlines);
    if (!next || next.days == null || next.days > 3 || next.days < 0) continue;
    items.push({
      id: `deadline-${event.id}-${next.label}`,
      priority: next.days === 0 ? "high" : "medium",
      title: `${event.title} · ${next.label}`,
      body: next.days === 0 ? "Deadline is today." : `Due in ${next.days} day${next.days === 1 ? "" : "s"}.`,
      href: `/events/${event.slug}`,
      cta: "View event",
    });
    break;
  }

  const inProgress = Object.entries(guideProgress).filter(([, pct]) => pct > 5 && pct < 95);
  if (inProgress.length) {
    const [slug, pct] = inProgress.sort((a, b) => b[1] - a[1])[0]!;
    items.push({
      id: `guide-${slug}`,
      priority: "low",
      title: "Continue your reading",
      body: `${Math.round(pct)}% through ${slug.replace(/-/g, " ")}.`,
      href: `/guides/${slug}`,
      cta: "Resume guide",
    });
  }

  const order = { high: 0, medium: 1, low: 2 };
  return items.sort((a, b) => order[a.priority] - order[b.priority]).slice(0, 6);
}
