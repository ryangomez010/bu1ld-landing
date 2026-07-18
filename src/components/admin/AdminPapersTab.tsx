import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AdminContentRow } from "@/components/admin/AdminContentRow";
import { AdminPaginationControls } from "@/components/admin/AdminPaginationControls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { slugify } from "@/data/seed/content";
import { useAuth } from "@/lib/auth";
import { paginateItems } from "@/lib/admin-pagination";
import { deleteContentRow, setContentPublished, updatePaperAdmin } from "@/lib/content";
import { getSupabase } from "@/lib/supabase";
import type { Paper } from "@/lib/types";

export function AdminPapersTab({ papers, onSaved }: { papers: Paper[]; onSaved: () => void }) {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [title, setTitle] = useState("");
  const [authors, setAuthors] = useState("");
  const [review, setReview] = useState("");
  const [summary, setSummary] = useState("");
  const [tags, setTags] = useState("");
  const [field, setField] = useState("");
  const [venue, setVenue] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [contentKind, setContentKind] = useState<NonNullable<Paper["content_kind"]>>("review");
  const [difficulty, setDifficulty] = useState<NonNullable<Paper["difficulty"]>>("intermediate");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAuthors, setEditAuthors] = useState("");
  const [editReview, setEditReview] = useState("");
  const [editSummary, setEditSummary] = useState("");
  const [editField, setEditField] = useState("");
  const [editVenue, setEditVenue] = useState("");
  const [editSourceUrl, setEditSourceUrl] = useState("");

  const slice = useMemo(() => paginateItems(papers, page, 25), [papers, page]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getSupabase();
    if (!supabase) {
      toast.error("Paper publishing is temporarily unavailable.");
      return;
    }
    setSaving(true);
    const slug = slugify(title);
    const { error } = await supabase.from("papers").insert({
      slug,
      title,
      authors,
      summary,
      editorial_summary: summary || null,
      venue: venue || null,
      review_body: review,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      published: false,
      content_kind: contentKind,
      field: field || null,
      difficulty,
      source_url: sourceUrl || null,
      reviewer_id: user?.id ?? null,
      review_status: "draft",
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
    setSummary("");
    setTags("");
    setField("");
    setVenue("");
    setSourceUrl("");
    onSaved();
  };

  const togglePublish = async (p: Paper) => {
    const { error } = await setContentPublished("papers", p.id, !p.published, user?.id);
    if (error) toast.error(error);
    else {
      toast.success(p.published ? "Unpublished." : "Published.");
      onSaved();
    }
  };

  const onDelete = async (p: Paper) => {
    const { error } = await deleteContentRow("papers", p.id, user?.id);
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
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Format</Label>
            <Select
              value={contentKind}
              onValueChange={(value) => setContentKind(value as NonNullable<Paper["content_kind"]>)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="review">Paper review</SelectItem>
                <SelectItem value="explainer">Explainer</SelectItem>
                <SelectItem value="research_note">Research note</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Difficulty</Label>
            <Select
              value={difficulty}
              onValueChange={(value) => setDifficulty(value as NonNullable<Paper["difficulty"]>)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="introductory">Introductory</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Field</Label>
            <Input value={field} onChange={(event) => setField(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Venue</Label>
            <Input
              value={venue}
              onChange={(event) => setVenue(event.target.value)}
              placeholder="NeurIPS, arXiv preprint…"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Primary source</Label>
          <Input
            type="url"
            value={sourceUrl}
            onChange={(event) => setSourceUrl(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Editorial summary</Label>
          <Textarea
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            rows={3}
            minLength={40}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Review (markdown)</Label>
          <Textarea value={review} onChange={(e) => setReview(e.target.value)} rows={8} required />
        </div>
        <Button
          type="submit"
          disabled={saving}
          className="font-mono text-[10px] tracking-[0.2em] uppercase"
        >
          {saving ? "Saving…" : "Save private draft"}
        </Button>
      </form>
      <div>
        <h2 className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-4">
          Existing ({papers.length})
        </h2>
        <ul className="space-y-3 text-sm">
          {slice.items.map((p) => (
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
                  <Textarea
                    value={editSummary}
                    onChange={(event) => setEditSummary(event.target.value)}
                    rows={3}
                  />
                  <Input
                    value={editField}
                    onChange={(event) => setEditField(event.target.value)}
                    placeholder="Field"
                  />
                  <Input
                    value={editVenue}
                    onChange={(event) => setEditVenue(event.target.value)}
                    placeholder="Venue"
                  />
                  <Input
                    type="url"
                    value={editSourceUrl}
                    onChange={(event) => setEditSourceUrl(event.target.value)}
                    placeholder="Primary source URL"
                  />
                </>
              }
              onStartEdit={() => {
                setEditingId(p.id);
                setEditTitle(p.title);
                setEditAuthors(p.authors ?? "");
                setEditReview(p.review_body);
                setEditSummary(p.editorial_summary ?? p.summary ?? "");
                setEditField(p.field ?? "");
                setEditVenue(p.venue ?? "");
                setEditSourceUrl(p.source_url ?? p.arxiv_url ?? "");
              }}
              onCancelEdit={() => setEditingId(null)}
              onSaveEdit={() => {
                void updatePaperAdmin(p.id, {
                  title: editTitle,
                  authors: editAuthors || null,
                  review_body: editReview,
                  summary: editSummary || null,
                  editorial_summary: editSummary || null,
                  field: editField || null,
                  venue: editVenue || null,
                  source_url: editSourceUrl || null,
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
        <AdminPaginationControls
          page={slice.page}
          totalPages={slice.totalPages}
          total={slice.total}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
