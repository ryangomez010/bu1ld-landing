import { Calendar, FolderKanban, GraduationCap, Library, Search, Users } from "lucide-react";

import { QuickActionChip } from "@/components/member/DashboardHero";
import { SectionHeader } from "@/components/member/SectionHeader";

const ACTIONS = [
  { to: "/research", label: "Research", icon: Library, accent: "text-bone" },
  { to: "/projects", label: "Apply", icon: FolderKanban, accent: "text-accent-blue" },
  { to: "/events", label: "Events", icon: Calendar, accent: "text-accent-green" },
  { to: "/guides", label: "Guides", icon: GraduationCap, accent: "text-accent-violet" },
  { to: "/members", label: "Members", icon: Users, accent: "text-bone" },
  { to: "/search", label: "Search", icon: Search, accent: "text-muted-foreground" },
] as const;

export function QuickActions() {
  return (
    <section className="section-gap">
      <SectionHeader
        title="Shortcuts"
        description="One-click routes to the surfaces members use daily — research library, open projects, event deadlines, guides, directory, and search."
      />
      <div className="flex flex-wrap gap-2">
        {ACTIONS.map((action) => (
          <QuickActionChip key={action.to} {...action} />
        ))}
      </div>
    </section>
  );
}
