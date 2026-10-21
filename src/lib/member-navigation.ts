import {
  Bell,
  BookOpen,
  Bookmark,
  Briefcase,
  Calendar,
  ClipboardList,
  FileText,
  FolderKanban,
  GraduationCap,
  Highlighter,
  Home,
  Layers,
  Library,
  ListChecks,
  Network,
  Search,
  Settings,
  Shield,
  SlidersHorizontal,
  UserPlus,
  Users,
} from "lucide-react";
import type { Profile } from "@/lib/types";

export const MEMBER_NAV_GROUPS = [
  {
    label: "Your work",
    items: [
      { to: "/dashboard", label: "Home", icon: Home },
      { to: "/workspace", label: "My work", icon: ListChecks },
      { to: "/applications", label: "Applications", icon: ClipboardList },
      { to: "/invitations", label: "Invitations", icon: UserPlus },
    ],
  },
  {
    label: "Explore & connect",
    items: [
      { to: "/projects", label: "Projects", icon: FolderKanban },
      { to: "/opportunities", label: "Opportunities", icon: Briefcase },
      { to: "/programs", label: "Programs", icon: GraduationCap },
      { to: "/members", label: "Members", icon: Users },
      { to: "/mentorship", label: "Mentorship", icon: Users },
      { to: "/events", label: "Events", icon: Calendar },
      { to: "/jobs", label: "Jobs", icon: Briefcase },
      { to: "/network", label: "Network", icon: Network },
    ],
  },
  {
    label: "Library",
    items: [
      { to: "/research", label: "Research", icon: Library },
      { to: "/papers", label: "Paper reviews", icon: FileText },
      { to: "/guides", label: "Guides", icon: BookOpen },
      { to: "/saved", label: "Saved", icon: Bookmark },
      { to: "/saved/collections", label: "Collections", icon: Layers },
      { to: "/research/highlights", label: "Highlights", icon: Highlighter },
      { to: "/research/analyze", label: "Analyzer", icon: Search },
      { to: "/newsletter", label: "Newsletter", icon: FileText },
    ],
  },
] as const;

export const MEMBER_SHORTCUT_NAV = [
  { to: "/announcements", label: "Announcements", icon: Bell },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/jobs/tracker", label: "Job tracker", icon: Briefcase },
] as const;

export const MEMBER_ACCOUNT_NAV = [
  { to: "/profile", label: "My profile", icon: Settings },
  { to: "/account/preferences", label: "Preferences", icon: SlidersHorizontal },
  { to: "/account/notifications", label: "Alert settings", icon: Bell },
  { to: "/account/activity", label: "Submissions", icon: ClipboardList },
  { to: "/account/security", label: "Security", icon: Shield },
] as const;

export function memberRoleNavigation(
  profile: Pick<Profile, "role" | "institutional_roles"> | null,
) {
  const admin = profile?.role === "admin";
  const lead =
    admin ||
    profile?.role === "project_lead" ||
    profile?.institutional_roles?.includes("project_lead");
  const reviewer = admin || profile?.institutional_roles?.includes("reviewer");
  return [
    ...(lead ? [{ to: "/projects/manage", label: "Manage projects", icon: FolderKanban }] : []),
    ...(reviewer ? [{ to: "/research/submit", label: "Submit analysis", icon: FileText }] : []),
    ...(admin ? [{ to: "/admin", label: "Admin", icon: Shield }] : []),
  ];
}

/** Select one destination, using path boundaries and the most specific match. */
export function activeMemberDestination(pathname: string, destinations: readonly string[]) {
  const path = pathname.replace(/\/+$/, "") || "/";
  return (
    destinations
      .filter((to) => path === to || path.startsWith(`${to}/`))
      .sort((a, b) => b.length - a.length)[0] ?? null
  );
}
