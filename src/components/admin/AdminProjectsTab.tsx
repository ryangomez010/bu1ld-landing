import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { reviewProjectPublication } from "@/lib/projects";
import type { Project } from "@/lib/types";

const labels: Record<NonNullable<Project["publication_status"]>, string> = {
  draft: "draft",
  submitted: "awaiting review",
  changes_requested: "changes requested",
  published: "published",
  archived: "archived",
};

export function AdminProjectsTab({
  projects,
  onSaved,
}: {
  projects: Project[];
  onSaved: () => void;
}) {
  const [status, setStatus] = useState<NonNullable<Project["publication_status"]> | "all">(
    "submitted",
  );
  const [notes, setNotes] = useState<Record<string, string>>({});
  const visible = useMemo(
    () =>
      projects.filter(
        (project) => status === "all" || (project.publication_status ?? "published") === status,
      ),
    [projects, status],
  );

  const decide = async (
    project: Project,
    decision: "published" | "changes_requested" | "archived",
  ) => {
    const { error } = await reviewProjectPublication(project.id, decision, notes[project.id]);
    if (error) return toast.error(error);
    toast.success(
      decision === "published"
        ? "Project published to the directory."
        : decision === "changes_requested"
          ? "Revision request recorded."
          : "Project archived.",
    );
    onSaved();
  };

  return (
    <section>
      <div className="mb-5 flex flex-wrap gap-2">
        {(["submitted", "draft", "changes_requested", "published", "archived", "all"] as const).map(
          (item) => (
            <button
              key={item}
              type="button"
              onClick={() => setStatus(item)}
              className={`rounded-sm border px-3 py-2 font-mono text-[9px] uppercase tracking-[0.14em] ${
                status === item
                  ? "border-accent-green/60 bg-accent-green/10 text-accent-green"
                  : "border-border/60 text-muted-foreground hover:text-bone"
              }`}
            >
              {item === "all" ? "all projects" : labels[item]}
            </button>
          ),
        )}
      </div>
      <p className="mb-6 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        Publishing confirms that a project has a specific brief, clear capacity, and a legitimate
        way for contributors to work. A revision note is delivered only to the project lead; it is
        never displayed as a public moderation record.
      </p>
      <div className="space-y-4">
        {visible.map((project) => {
          const publicationStatus =
            project.publication_status ?? (project.published ? "published" : "draft");
          return (
            <article
              key={project.id}
              className="rounded-sm border border-border/60 bg-background/60 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-accent-green">
                    {project.type} · {labels[publicationStatus]}
                  </p>
                  <h2 className="mt-2 font-display text-xl text-bone">{project.title}</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                    {project.description}
                  </p>
                  <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                    Lead: {project.lead_name ?? "Unassigned"} · {project.team_count}/
                    {project.capacity} contributors · {project.skills_needed.length} skill tags
                  </p>
                </div>
              </div>
              <div className="mt-4 max-w-2xl space-y-2">
                <Label htmlFor={`review-note-${project.id}`}>
                  Private note to the project lead
                </Label>
                <Textarea
                  id={`review-note-${project.id}`}
                  value={notes[project.id] ?? ""}
                  onChange={(event) =>
                    setNotes((current) => ({ ...current, [project.id]: event.target.value }))
                  }
                  placeholder="Required for changes; optional when publishing. Be precise about the brief, scope, or working conditions that need attention."
                  rows={3}
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {publicationStatus !== "published" ? (
                  <Button type="button" size="sm" onClick={() => void decide(project, "published")}>
                    Publish
                  </Button>
                ) : null}
                {publicationStatus !== "changes_requested" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void decide(project, "changes_requested")}
                  >
                    Request changes
                  </Button>
                ) : null}
                {publicationStatus !== "archived" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-accent-red"
                    onClick={() => void decide(project, "archived")}
                  >
                    Archive
                  </Button>
                ) : null}
              </div>
            </article>
          );
        })}
        {visible.length === 0 ? (
          <p className="text-sm text-muted-foreground">No projects in this review state.</p>
        ) : null}
      </div>
    </section>
  );
}
