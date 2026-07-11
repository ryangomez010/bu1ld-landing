import { Link } from "@tanstack/react-router";
import { Calendar, FileText, FolderKanban, GraduationCap } from "lucide-react";

import { CtaLink, InlineEmpty } from "@/components/member/ContentCard";
import { SectionHeader } from "@/components/member/SectionHeader";
import { StaggerItem, StaggerList } from "@/components/member/PageTransition";
import { formatDate } from "@/lib/date";
import type { MlEvent, Paper, Project } from "@/lib/types";
import { cn } from "@/lib/utils";

type WeekItem = {
  id: string;
  label: string;
  sublabel: string;
  href: string;
  icon: typeof Calendar;
  accent: string;
  daysUntil?: number;
};

export function YourWeekSection({
  events,
  papers,
  projects,
  guideUnread,
  weeklyPaperGoal = 2,
  papersReadThisWeek = 0,
}: {
  events: MlEvent[];
  papers: Paper[];
  projects: Project[];
  guideUnread: number;
  weeklyPaperGoal?: number;
  papersReadThisWeek?: number;
}) {
  const now = new Date();
  const weekEnd = new Date(now);
  weekEnd.setDate(weekEnd.getDate() + (7 - weekEnd.getDay()));

  const deadlineItems: WeekItem[] = events
    .flatMap((e) =>
      e.deadlines.map((d) => ({
        id: `${e.id}-${d.label}`,
        label: d.label,
        sublabel: e.title,
        href: `/events/${e.slug}`,
        icon: Calendar,
        accent: "text-accent-red",
        daysUntil: Math.ceil((new Date(d.date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      })),
    )
    .filter((d) => d.daysUntil >= 0 && d.daysUntil <= 7)
    .sort((a, b) => (a.daysUntil ?? 99) - (b.daysUntil ?? 99))
    .slice(0, 3);

  const paperItems: WeekItem[] = papers.slice(0, 2).map((p) => ({
    id: p.id,
    label: p.title,
    sublabel: `${p.is_classic ? "Classic" : "Review"} · ${p.tags[0] ?? "ML"}`,
    href: `/papers/${p.slug}`,
    icon: FileText,
    accent: "text-accent-blue",
  }));

  const projectItems: WeekItem[] = projects.slice(0, 2).map((p) => ({
    id: p.id,
    label: p.title,
    sublabel: `${p.skills_needed.slice(0, 2).join(", ") || "Open role"}`,
    href: `/projects/${p.slug}`,
    icon: FolderKanban,
    accent: "text-accent-green",
  }));

  const items = [...deadlineItems, ...paperItems, ...projectItems].slice(0, 6);
  const paperProgress = Math.min(100, Math.round((papersReadThisWeek / weeklyPaperGoal) * 100));

  return (
    <section className="section-gap">
      <SectionHeader
        title="Your week"
        accent="green"
        description="Conference submission deadlines, new paper reviews, and open project roles — ranked by your interest tags and sorted by due date."
        action={
          <span className="label-xs text-muted-foreground">
            through {formatDate(weekEnd.toISOString())}
          </span>
        }
      />

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_12rem]">
        <StaggerList className="grid gap-2 sm:grid-cols-2">
          {items.length ? (
            items.map((item) => (
              <StaggerItem key={item.id}>
                <Link
                  to={item.href}
                  className="panel glass-subtle panel-interactive surface-card-interactive p-4 block h-full"
                >
                  <div className="flex items-start gap-3 relative z-[1]">
                    <item.icon className={cn("h-4 w-4 shrink-0 mt-0.5", item.accent)} />
                    <div className="min-w-0">
                      <p className="text-sm text-bone line-clamp-2 leading-snug">{item.label}</p>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                        {item.sublabel}
                      </p>
                      {item.daysUntil != null ? (
                        <p className="mt-2 label-xs text-accent-red">
                          {item.daysUntil === 0
                            ? "Due today"
                            : item.daysUntil === 1
                              ? "Due tomorrow"
                              : `${item.daysUntil}d left`}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </Link>
              </StaggerItem>
            ))
          ) : (
            <InlineEmpty
              className="sm:col-span-2"
              title="A quiet week"
              body="No upcoming deadlines — browse paper reviews or check open project slots."
              action={
                <div className="flex flex-wrap justify-center gap-3">
                  <CtaLink to="/papers">Browse papers →</CtaLink>
                  <CtaLink to="/projects" accent="green">
                    Open projects →
                  </CtaLink>
                </div>
              }
            />
          )}
        </StaggerList>

        <div className="panel glass surface-card p-4 space-y-4">
          <div>
            <p className="label-xs text-muted-foreground">Reading goal</p>
            <p className="mt-2 font-display text-2xl text-bone">
              {papersReadThisWeek}/{weeklyPaperGoal}
            </p>
            <p className="text-xs text-muted-foreground mt-1">papers this week</p>
            <div className="mt-3 h-1.5 rounded-full bg-border/50 overflow-hidden">
              <div
                className="h-full bg-accent-green transition-all duration-500"
                style={{ width: `${paperProgress}%` }}
              />
            </div>
          </div>
          {guideUnread > 0 ? (
            <Link
              to="/guides"
              className="flex items-center gap-2 surface-card border border-border/40 px-3 py-2 hover:border-bone/20 transition-colors"
            >
              <GraduationCap className="h-4 w-4 text-accent-violet" />
              <span className="text-xs text-muted-foreground">
                <strong className="text-bone">{guideUnread}</strong> guides to start
              </span>
            </Link>
          ) : null}
          <CtaLink to="/account/preferences" className="block">
            Adjust preferences →
          </CtaLink>
        </div>
      </div>
    </section>
  );
}
