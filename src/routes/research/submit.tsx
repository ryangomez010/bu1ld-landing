import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { RequireMember } from "@/components/auth/RequireAuth";
import { MemberLayout } from "@/components/member/MemberLayout";
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
import { clampText } from "@/lib/security";
import { getSupabase } from "@/lib/supabase";
import { isSafeUrl } from "@/lib/urls";
import type { Paper } from "@/lib/types";

export const Route = createFileRoute("/research/submit")({
  component: ReviewSubmissionPage,
  head: () => ({ meta: [{ title: "Submit analysis — The Bu1ld" }] }),
});

function ReviewSubmissionPage() {
  return (
    <RequireMember>
      <ReviewSubmission />
    </RequireMember>
  );
}

function ReviewSubmission() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [authors, setAuthors] = useState("");
  const [field, setField] = useState("");
  const [difficulty, setDifficulty] = useState<NonNullable<Paper["difficulty"]>>("intermediate");
  const [kind, setKind] = useState<NonNullable<Paper["content_kind"]>>("review");
  const [sourceUrl, setSourceUrl] = useState("");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);
  const reviewer = profile?.role === "admin" || profile?.institutional_roles?.includes("reviewer");

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    const safeTitle = clampText(title, 180);
    const safeSummary = clampText(summary, 800);
    const safeBody = clampText(body, 16000);
    const safeSourceUrl = sourceUrl.trim();
    if (safeTitle.length < 8 || safeSummary.length < 40 || safeBody.length < 160) {
      return toast.error(
        "Add a specific title, a 40-character summary, and at least 160 characters of analysis.",
      );
    }
    if (safeSourceUrl && !isSafeUrl(safeSourceUrl))
      return toast.error("Source URL must use http:// or https://.");
    const supabase = getSupabase();
    if (!supabase) return toast.error("Submitting analysis is temporarily unavailable.");
    setSaving(true);
    const { data, error } = await supabase
      .from("papers")
      .insert({
        slug: `${slugify(safeTitle)}-${Date.now().toString(36)}`,
        title: safeTitle,
        authors: clampText(authors, 400) || null,
        summary: safeSummary,
        review_body: safeBody,
        tags: tags
          .split(",")
          .map((tag) => clampText(tag, 40))
          .filter(Boolean)
          .slice(0, 12),
        content_kind: kind,
        field: clampText(field, 100) || null,
        difficulty,
        source_url: safeSourceUrl || null,
        reviewer_id: user.id,
        review_status: "draft",
        published: false,
      })
      .select("slug")
      .single();
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Draft submitted to your editorial workspace.");
    void navigate({ to: "/papers/$slug", params: { slug: data.slug } });
  };

  if (!reviewer) {
    return (
      <MemberLayout title="Reviewer access required" eyebrow="research editorial">
        <p className="-mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          This workspace is for members with reviewer status. It creates private drafts for
          editorial review; it does not publish work directly.
        </p>
        <Link to="/research" className="mt-6 inline-block text-sm text-accent-blue hover:text-bone">
          Back to the research library →
        </Link>
      </MemberLayout>
    );
  }

  return (
    <MemberLayout title="Submit analysis" eyebrow="reviewer workspace">
      <p className="-mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        Submit a review, explainer, or research note as a private draft. Describe evidence rather
        than repeating an abstract: name the claim, the method, the limits, and the next test that
        would change your confidence. An administrator publishes only work that meets the editorial
        bar.
      </p>
      <form onSubmit={onSubmit} className="mt-8 max-w-3xl space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="analysis-title">Title</Label>
            <Input
              id="analysis-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="analysis-authors">Authors (if reviewing a paper)</Label>
            <Input
              id="analysis-authors"
              value={authors}
              onChange={(event) => setAuthors(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="analysis-source">Primary source URL</Label>
            <Input
              id="analysis-source"
              type="url"
              value={sourceUrl}
              onChange={(event) => setSourceUrl(event.target.value)}
              placeholder="https://arxiv.org/..."
            />
          </div>
          <div className="space-y-2">
            <Label>Format</Label>
            <Select
              value={kind}
              onValueChange={(value) => setKind(value as NonNullable<Paper["content_kind"]>)}
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
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="analysis-field">Field and tags</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                id="analysis-field"
                value={field}
                onChange={(event) => setField(event.target.value)}
                placeholder="e.g. representation learning"
              />
              <Input
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder="comma-separated tags"
              />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="analysis-summary">Editorial summary</Label>
          <Textarea
            id="analysis-summary"
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            rows={3}
            required
            placeholder="State the practical question and the conclusion a working researcher should carry away."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="analysis-body">Analysis (Markdown)</Label>
          <Textarea
            id="analysis-body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={16}
            required
            placeholder={"## Claim\n\n## Evidence\n\n## Limits\n\n## What to test next"}
          />
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving draft…" : "Submit private draft"}
        </Button>
      </form>
    </MemberLayout>
  );
}
