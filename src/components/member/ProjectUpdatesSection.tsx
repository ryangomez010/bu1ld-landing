import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { relativeTime } from "@/lib/date";
import {
  createProjectUpdate,
  fetchProjectUpdates,
  type ProjectUpdate,
} from "@/lib/project-updates";

export function ProjectUpdatesSection({
  projectId,
  canPost,
  authorId,
  authorName,
}: {
  projectId: string;
  canPost: boolean;
  authorId?: string;
  authorName?: string;
}) {
  const [updates, setUpdates] = useState<ProjectUpdate[]>([]);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reload = () => {
    void fetchProjectUpdates(projectId).then(setUpdates);
  };

  useEffect(() => {
    reload();
  }, [projectId]);

  const onPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorId || !authorName) return;
    setSubmitting(true);
    const { error } = await createProjectUpdate(projectId, authorId, authorName, body);
    setSubmitting(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Update posted.");
    setBody("");
    reload();
  };

  if (updates.length === 0 && !canPost) return null;

  return (
    <section className="mt-10">
      <h2 className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-4">
        Project updates
      </h2>
      {canPost ? (
        <form onSubmit={onPost} className="mb-4 space-y-3 rounded-sm border border-border/60 p-4">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder="Share progress, blockers, or next milestones with applicants and team."
            required
          />
          <Button
            type="submit"
            size="sm"
            disabled={submitting}
            className="font-mono text-[9px] tracking-[0.15em] uppercase"
          >
            {submitting ? "Posting…" : "Post update"}
          </Button>
        </form>
      ) : null}
      {updates.length === 0 ? (
        <p className="text-sm text-muted-foreground">No updates yet.</p>
      ) : (
        <div className="space-y-2">
          {updates.map((u) => (
            <article key={u.id} className="rounded-sm border border-border/60 bg-background/70 p-4">
              <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground">
                {u.author_name ?? "Lead"} · {relativeTime(u.created_at)}
              </p>
              <p className="mt-2 text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                {u.body}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
