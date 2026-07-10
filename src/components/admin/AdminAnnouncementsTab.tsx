import { useState } from "react";
import { toast } from "sonner";

import type { Announcement } from "@/data/seed/announcements";
import { ConfirmButton } from "@/components/member/ConfirmButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createAnnouncement,
  deleteAnnouncement,
  setAnnouncementPublished,
} from "@/lib/announcements";

export function AdminAnnouncementsTab({
  items,
  onSaved,
}: {
  items: Announcement[];
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [href, setHref] = useState("");
  const [pinned, setPinned] = useState(false);
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await createAnnouncement({
      title,
      body,
      href: href || undefined,
      pinned,
    });
    setSaving(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Announcement published.");
    setTitle("");
    setBody("");
    setHref("");
    setPinned(false);
    onSaved();
  };

  return (
    <div className="grid lg:grid-cols-2 gap-10">
      <form onSubmit={onSubmit} className="space-y-4 rounded-sm border border-border/60 p-6">
        <h2 className="font-display text-lg text-bone">New announcement</h2>
        <p className="text-xs text-muted-foreground">
          Pinned announcements appear as &ldquo;This week in ML&rdquo; on the dashboard. Use
          unpublish to save as draft — schedule by publishing when ready.
        </p>
        <div className="space-y-2">
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Body</Label>
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} required />
        </div>
        <div className="space-y-2">
          <Label>Link (optional)</Label>
          <Input
            value={href}
            onChange={(e) => setHref(e.target.value)}
            placeholder="/guides/how-llms-work"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
          Pin to dashboard
        </label>
        <Button
          type="submit"
          disabled={saving}
          className="font-mono text-[10px] tracking-[0.2em] uppercase"
        >
          {saving ? "Saving…" : "Publish"}
        </Button>
        <p className="text-xs text-muted-foreground">Publishing also notifies members in-app.</p>
      </form>
      <div>
        <h2 className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-4">
          Existing ({items.length})
        </h2>
        <ul className="space-y-3 text-sm">
          {items.map((a) => (
            <li key={a.id} className="text-bone border-b border-border/40 pb-3">
              {a.pinned ? (
                <span className="font-mono text-[9px] uppercase text-accent-green mr-2">
                  pinned
                </span>
              ) : null}
              {!a.published ? (
                <span className="font-mono text-[9px] uppercase text-accent-red mr-2">draft</span>
              ) : null}
              {a.title}
              <div className="mt-2 flex flex-wrap gap-3 font-mono text-[9px] uppercase tracking-[0.15em]">
                <button
                  type="button"
                  onClick={() =>
                    void setAnnouncementPublished(a.id, !a.published).then(({ error }) => {
                      if (error) toast.error(error);
                      else onSaved();
                    })
                  }
                  className="text-muted-foreground hover:text-bone"
                >
                  {a.published ? "unpublish" : "publish"}
                </button>
                <ConfirmButton
                  title={`Delete “${a.title}”?`}
                  description="This permanently removes the announcement."
                  confirmLabel="Delete"
                  destructive
                  onConfirm={() =>
                    void deleteAnnouncement(a.id).then(({ error }) => {
                      if (error) toast.error(error);
                      else onSaved();
                    })
                  }
                  trigger={
                    <button type="button" className="text-accent-red hover:text-bone">
                      delete
                    </button>
                  }
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
