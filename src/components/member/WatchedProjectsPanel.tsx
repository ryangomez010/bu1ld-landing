import { Link } from "@tanstack/react-router";
import { Bell, BellOff } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { CtaLink, InlineEmpty } from "@/components/member/ContentCard";
import { ListSkeleton } from "@/components/member/LoadingState";
import { SectionHeader } from "@/components/member/SectionHeader";
import { Button } from "@/components/ui/button";
import { projectLink } from "@/lib/app-paths";
import { fetchMyProjectFollows, setProjectFollowNotify } from "@/lib/project-follows";
import { fetchProjects } from "@/lib/projects";
import type { Project } from "@/lib/types";

export function WatchedProjectsPanel({ userId }: { userId: string }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [notifyMap, setNotifyMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void Promise.all([fetchMyProjectFollows(userId), fetchProjects()]).then(([follows, all]) => {
      const ids = new Set(follows.map((f) => f.project_id));
      setProjects(all.filter((p) => ids.has(p.id)));
      setNotifyMap(Object.fromEntries(follows.map((f) => [f.project_id, f.notify_updates])));
      setLoading(false);
    });
  }, [userId]);

  const toggleNotify = async (projectId: string) => {
    const next = !notifyMap[projectId];
    const { error } = await setProjectFollowNotify(userId, projectId, next);
    if (error) {
      toast.error(error);
      return;
    }
    setNotifyMap((m) => ({ ...m, [projectId]: next }));
    toast.success(next ? "Update notifications on" : "Muted project updates");
  };

  return (
    <section className="section-gap">
      <SectionHeader
        title="Watched projects"
        accent="blue"
        description="Projects you follow for milestone updates — mute notifications per project without unfollowing the thread."
        action={<CtaLink to="/projects">Browse →</CtaLink>}
      />
      {loading ? (
        <ListSkeleton rows={2} />
      ) : projects.length === 0 ? (
        <InlineEmpty
          title="No watched projects"
          body="Open a project page and click Follow to receive in-app updates when the lead posts milestones or opens new application slots."
          action={<CtaLink to="/projects">Browse open projects →</CtaLink>}
        />
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {projects.map((p) => (
            <li
              key={p.id}
              className="panel glass-subtle surface-card p-4 flex items-start justify-between gap-3"
            >
              <Link {...projectLink(p.slug)} className="min-w-0 flex-1 hover:opacity-90">
                <p className="font-display text-base text-bone line-clamp-2">{p.title}</p>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{p.description}</p>
              </Link>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => void toggleNotify(p.id)}
                className="shrink-0 label-xs gap-1"
                aria-label={notifyMap[p.id] ? "Mute project updates" : "Enable project updates"}
                aria-pressed={notifyMap[p.id]}
              >
                {notifyMap[p.id] ? (
                  <Bell className="h-3.5 w-3.5 text-accent-green" aria-hidden />
                ) : (
                  <BellOff className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                )}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
