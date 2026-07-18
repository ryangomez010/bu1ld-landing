import { useState } from "react";
import { toast } from "sonner";

import { AdminContentRow } from "@/components/admin/AdminContentRow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { slugify } from "@/data/seed/content";
import { deleteContentRow, setContentPublished, updateNewsletterAdmin } from "@/lib/content";
import { getSupabase } from "@/lib/supabase";
import type { NewsletterIssue } from "@/lib/types";

export function AdminNewslettersTab({
  issues,
  onSaved,
}: {
  issues: NewsletterIssue[];
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [issueNumber, setIssueNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getSupabase();
    if (!supabase) {
      toast.error("Newsletter publishing is temporarily unavailable.");
      return;
    }
    setSaving(true);
    const slug = slugify(title);
    const { error } = await supabase.from("newsletter_issues").insert({
      slug,
      title,
      body,
      issue_number: issueNumber ? Number(issueNumber) : null,
      published: false,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Newsletter saved as draft.");
    setTitle("");
    setBody("");
    setIssueNumber("");
    onSaved();
  };

  return (
    <div className="grid lg:grid-cols-2 gap-10">
      <form onSubmit={onSubmit} className="space-y-4 rounded-sm border border-border/60 p-6">
        <h2 className="font-display text-lg text-bone">New newsletter issue</h2>
        <div className="space-y-2">
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Issue number</Label>
          <Input
            type="number"
            value={issueNumber}
            onChange={(e) => setIssueNumber(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Body (markdown)</Label>
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10} required />
        </div>
        <Button
          type="submit"
          disabled={saving}
          className="font-mono text-[10px] tracking-[0.2em] uppercase"
        >
          {saving ? "Saving…" : "Publish issue"}
        </Button>
      </form>
      <div>
        <h2 className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-4">
          Existing ({issues.length})
        </h2>
        <ul className="space-y-3 text-sm">
          {issues.map((n) => (
            <AdminContentRow
              key={n.id}
              title={n.title}
              published={n.published}
              viewHref={`/newsletter/${n.slug}`}
              editing={editingId === n.id}
              editFields={
                <>
                  <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                  <Textarea
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    rows={6}
                  />
                </>
              }
              onStartEdit={() => {
                setEditingId(n.id);
                setEditTitle(n.title);
                setEditBody(n.body);
              }}
              onCancelEdit={() => setEditingId(null)}
              onSaveEdit={() => {
                void updateNewsletterAdmin(n.id, {
                  title: editTitle,
                  body: editBody,
                }).then(({ error }) => {
                  if (error) toast.error(error);
                  else {
                    toast.success("Newsletter updated.");
                    setEditingId(null);
                    onSaved();
                  }
                });
              }}
              onTogglePublish={() =>
                void setContentPublished("newsletter_issues", n.id, !n.published).then(
                  ({ error }) => {
                    if (error) toast.error(error);
                    else {
                      toast.success(n.published ? "Unpublished." : "Published.");
                      onSaved();
                    }
                  },
                )
              }
              onDelete={() => {
                void deleteContentRow("newsletter_issues", n.id).then(({ error }) => {
                  if (error) toast.error(error);
                  else {
                    toast.success("Deleted.");
                    onSaved();
                  }
                });
              }}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}
