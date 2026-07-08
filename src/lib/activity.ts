import { fetchAnnouncements } from "@/lib/announcements";
import { nearestDeadline } from "@/lib/date";
import { fetchEvents } from "@/lib/content";
import { fetchMyApplications, fetchProjects } from "@/lib/projects";
import { fetchNotifications } from "@/lib/notifications";

export type ActivityItem = {
  id: string;
  kind: "application" | "deadline" | "announcement" | "notification" | "project";
  title: string;
  body: string;
  href: string;
  at: string;
};

export async function buildActivityFeed(userId: string): Promise<ActivityItem[]> {
  const [apps, events, announcements, notifications, openProjects] = await Promise.all([
    fetchMyApplications(userId),
    fetchEvents(),
    fetchAnnouncements(),
    fetchNotifications(userId),
    fetchProjects("open"),
  ]);

  const items: ActivityItem[] = [];

  for (const app of apps.slice(0, 5)) {
    items.push({
      id: `app-${app.id}`,
      kind: "application",
      title: `${app.project_title ?? "Project"} · ${app.status}`,
      body: app.pitch.slice(0, 120),
      href: app.project_slug ? `/projects/${app.project_slug}` : "/applications",
      at: app.updated_at || app.created_at,
    });
  }

  for (const event of events) {
    const next = nearestDeadline(event.deadlines);
    if (!next || next.days == null || next.days > 21) continue;
    items.push({
      id: `dl-${event.id}-${next.label}`,
      kind: "deadline",
      title: `${event.title} · ${next.label}`,
      body: `Due in ${next.days} day${next.days === 1 ? "" : "s"}`,
      href: `/events/${event.slug}`,
      at: next.date,
    });
  }

  for (const a of announcements.slice(0, 3)) {
    items.push({
      id: `ann-${a.id}`,
      kind: "announcement",
      title: a.title,
      body: a.body.slice(0, 140),
      href: a.href ?? "/dashboard",
      at: a.created_at,
    });
  }

  for (const n of notifications.slice(0, 5)) {
    items.push({
      id: `n-${n.id}`,
      kind: "notification",
      title: n.title,
      body: n.body.slice(0, 140),
      href: n.href ?? "/notifications",
      at: n.created_at,
    });
  }

  for (const p of openProjects.slice(0, 3)) {
    items.push({
      id: `proj-${p.id}`,
      kind: "project",
      title: `Open · ${p.title}`,
      body: p.description.slice(0, 120),
      href: `/projects/${p.slug}`,
      at: p.updated_at || p.created_at,
    });
  }

  return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 10);
}
