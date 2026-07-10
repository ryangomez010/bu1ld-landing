import { useState } from "react";
import { toast } from "sonner";

import { AdminContentRow } from "@/components/admin/AdminContentRow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { slugify } from "@/data/seed/content";
import { generatePaperDraft } from "@/lib/admin";
import { deleteContentRow, setContentPublished, updatePaperAdmin } from "@/lib/content";
import { getSupabase } from "@/lib/supabase";
import type { Paper } from "@/lib/types";

export function AdminPapersTab({ papers, onSaved }: { papers: Paper[]; onSaved: () => void }) {
  const [title, setTitle] = useState("");
  const [authors, setAuthors] = useState("");
  const [review, setReview] = useState("");
  const [draftNotes, setDraftNotes] = useState("");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAuthors, setEditAuthors] = useState("");
  const [editReview, setEditReview] = useState("");

  const onDraft = () => {
    setReview(generatePaperDraft(title, authors, draftNotes));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getSupabase();
    if (!supabase) {
      toast.error("Supabase required to publish.");
      return;
    }
    setSaving(true);
    const slug = slugify(title);
    const { error } = await supabase.from("papers").insert({
      slug,
      title,
      authors,
      review_body: review,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      published: false,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Paper saved as draft.");
    setTitle("");
    setAuthors("");
    setReview("");
    setTags("");
    onSaved();
  };

  const togglePublish = async (p: Paper) => {
    const { error } = await setContentPublished("papers", p.id, !p.published);
    if (error) toast.error(error);
    else {
      toast.success(p.published ? "Unpublished." : "Published.");
      onSaved();
    }
  };

  const onDelete = async (p: Paper) => {
    if (!confirm(`Delete “${p.title}”?`)) return;
    const { error } = await deleteContentRow("papers", p.id);
    if (error) toast.error(error);
    else {
      toast.success("Deleted.");
      onSaved();
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-10">
      <form onSubmit={onSubmit} className="space-y-4 rounded-sm border border-border/60 p-6">
        <h2 className="font-display text-lg text-bone">New paper review</h2>
        <div className="space-y-2">
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Authors</Label>
          <Input value={authors} onChange={(e) => setAuthors(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Tags (comma-separated)</Label>
          <Input value={tags} onChange={(e) => setTags(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Your notes (for draft assist)</Label>
          <Textarea value={draftNotes} onChange={(e) => setDraftNotes(e.target.value)} rows={3} />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Review (markdown)</Label>
            <button
              type="button"
              onClick={onDraft}
              className="font-mono text-[9px] tracking-[0.15em] uppercase text-accent-blue hover:text-bone"
            >
              Generate draft
            </button>
          </div>
          <Textarea value={review} onChange={(e) => setReview(e.target.value)} rows={8} required />
        </div>
        <Button
          type="submit"
          disabled={saving}
          className="font-mono text-[10px] tracking-[0.2em] uppercase"
        >
          {saving ? "Saving…" : "Publish review"}
        </Button>
      </form>
      <div>
        <h2 className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-4">
          Existing ({papers.length})
        </h2>
        <ul className="space-y-3 text-sm">
          {papers.map((p) => (
            <AdminContentRow
              key={p.id}
              title={p.title}
              published={p.published}
              viewHref={`/papers/${p.slug}`}
              editing={editingId === p.id}
              editFields={
                <>
                  <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                  <Input
                    value={editAuthors}
                    onChange={(e) => setEditAuthors(e.target.value)}
                    placeholder="Authors"
                  />
                  <Textarea
                    value={editReview}
                    onChange={(e) => setEditReview(e.target.value)}
                    rows={4}
                  />
                </>
              }
              onStartEdit={() => {
                setEditingId(p.id);
                setEditTitle(p.title);
                setEditAuthors(p.authors ?? "");
                setEditReview(p.review_body);
              }}
              onCancelEdit={() => setEditingId(null)}
              onSaveEdit={() => {
                void updatePaperAdmin(p.id, {
                  title: editTitle,
                  authors: editAuthors || null,
                  review_body: editReview,
                }).then(({ error }) => {
                  if (error) toast.error(error);
                  else {
                    toast.success("Paper updated.");
                    setEditingId(null);
                    onSaved();
                  }
                });
              }}
              onTogglePublish={() => void togglePublish(p)}
              onDelete={() => void onDelete(p)}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}
