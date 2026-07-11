import { Link } from "@tanstack/react-router";
import { ExternalLink, Users } from "lucide-react";

import { memberLink } from "@/lib/app-paths";
import type { Project } from "@/lib/types";
import type { ProjectApplication } from "@/lib/types";

export function ProjectMemberWorkspace({
  project,
  application,
  teamMembers,
}: {
  project: Project;
  application: ProjectApplication;
  teamMembers: Array<{ name: string; userId: string }>;
}) {
  if (application.status !== "accepted") return null;

  return (
    <section className="mt-10 panel glass rounded-2xl overflow-hidden border-accent-green/20">
      <div className="border-b border-accent-green/15 px-5 py-4 bg-accent-green/[0.06] relative z-[1]">
        <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-accent-green">
          Member workspace
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Accepted members see team roster, pinned repo links, project updates, and Discord here.
          Coordinate via updates below — leads can @mention you in posts.
        </p>
      </div>
      <div className="p-5 space-y-6 relative z-[1]">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="font-mono text-[9px] uppercase text-muted-foreground mb-2">Your status</p>
            <p className="text-sm text-bone">
              Accepted · joined {new Date(application.updated_at).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="font-mono text-[9px] uppercase text-muted-foreground mb-2">Capacity</p>
            <p className="text-sm text-bone">
              {project.team_count}/{project.capacity} builders
            </p>
          </div>
        </div>

        {teamMembers.length > 0 ? (
          <div>
            <p className="font-mono text-[9px] uppercase text-muted-foreground mb-3 flex items-center gap-2">
              <Users className="h-3.5 w-3.5" />
              Team
            </p>
            <div className="flex flex-wrap gap-2">
              {teamMembers.map((m) => (
                <Link
                  key={m.userId}
                  {...memberLink(m.userId)}
                  className="rounded-sm border border-border/60 px-3 py-2 text-sm text-bone hover:border-bone/30 transition"
                >
                  {m.name}
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        {project.workspace_links && project.workspace_links.length > 0 ? (
          <div>
            <p className="font-mono text-[9px] uppercase text-muted-foreground mb-3">
              Pinned resources
            </p>
            <ul className="space-y-2">
              {project.workspace_links.map((link) => (
                <li key={link.url}>
                  {link.url.startsWith("/") ? (
                    <Link
                      to={link.url}
                      className="text-sm text-accent-blue hover:text-bone transition"
                    >
                      {link.label} →
                    </Link>
                  ) : (
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-accent-blue hover:text-bone"
                    >
                      {link.label} <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {project.discord_url ? (
          <a
            href={project.discord_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] uppercase text-accent-blue hover:text-bone"
          >
            Open project Discord <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <p className="text-sm text-muted-foreground">
            No Discord link yet — ask the lead to add one in project settings.
          </p>
        )}

        <div className="flex flex-wrap gap-4 pt-2 border-t border-border/40">
          <Link
            to="/applications"
            className="font-mono text-[9px] uppercase text-muted-foreground hover:text-bone"
          >
            All applications →
          </Link>
          <Link
            to="/research"
            className="font-mono text-[9px] uppercase text-muted-foreground hover:text-bone"
          >
            Research library →
          </Link>
        </div>
      </div>
    </section>
  );
}
