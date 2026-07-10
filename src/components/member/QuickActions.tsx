import { Link } from "@tanstack/react-router";
import {
  Calendar,
  FolderKanban,
  GraduationCap,
  Search,
  Users,
} from "lucide-react";

const ACTIONS = [
  { to: "/projects", label: "Apply", icon: FolderKanban, accent: "text-accent-blue" },
  { to: "/events", label: "Events", icon: Calendar, accent: "text-accent-green" },
  { to: "/guides", label: "Guides", icon: GraduationCap, accent: "text-violet-400" },
  { to: "/members", label: "Members", icon: Users, accent: "text-bone" },
  { to: "/search", label: "Search", icon: Search, accent: "text-muted-foreground" },
] as const;

export function QuickActions() {
  return (
    <section className="section-gap">
      <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-3">
        Quick actions
      </p>
      <div className="flex flex-wrap gap-2">
        {ACTIONS.map(({ to, label, icon: Icon, accent }) => (
          <Link
            key={to}
            to={to}
            className="inline-flex items-center gap-2 rounded-sm border border-border/60 bg-background/70 px-4 py-2.5 font-mono text-[9px] tracking-[0.18em] uppercase text-bone hover:border-bone/30 hover:bg-bone/5 transition"
          >
            <Icon className={`h-3.5 w-3.5 ${accent}`} aria-hidden />
            {label}
          </Link>
        ))}
      </div>
    </section>
  );
}
