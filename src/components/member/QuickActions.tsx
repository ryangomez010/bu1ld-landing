import { Calendar, FolderKanban, GraduationCap, Library, Search, Users } from "lucide-react";

import { QuickActionChip } from "@/components/member/DashboardHero";

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
      <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-3">
        Shortcuts
      </p>
      <div className="flex flex-wrap gap-2">
        {ACTIONS.map((action) => (
          <QuickActionChip key={action.to} {...action} />
        ))}
      </div>
    </section>
  );
}
