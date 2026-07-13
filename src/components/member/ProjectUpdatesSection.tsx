import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { relativeTime } from "@/lib/date";
import {
  createProjectUpdate,
  fetchProjectUpdates,
  parseMentionUserIds,
  subscribeProjectUpdates,
  type ProjectUpdate,
} from "@/lib/project-updates";

export function ProjectUpdatesSection({
  projectId,
  projectSlug,
  projectTitle,
  canPost,
  authorId,
  authorName,
}: {
  projectId: string;
  projectSlug?: string;
  projectTitle?: string;
  canPost: boolean;
  authorId?: string;
  authorName?: string;
}) {
  const [updates, setUpdates] = useState<ProjectUpdate[]>([]);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reload = useCallback(() => {
    void fetchProjectUpdates(projectId).then(setUpdates);
  }, [projectId]);

  useEffect(() => {
    reload();
    return subscribeProjectUpdates(projectId, setUpdates);
  }, [projectId, reload]);

  const onPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorId || !authorName) return;
    setSubmitting(true);
    const mentionUserIds = parseMentionUserIds(body);
    const { error } = await createProjectUpdate(projectId, authorId, authorName, body, {
      projectSlug,
      projectTitle,
      mentionUserIds,
    });
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
            placeholder="Progress update for accepted members — mention @[Name](user-id) to notify. Links to repos welcome."
            required
          />
          <p className="text-xs text-muted-foreground">
            Followers and accepted members get notified. Use @[Name](uuid) to @mention someone.
          </p>
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
