import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { InstitutionLayout } from "@/components/institution/InstitutionLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getLab } from "@/data/institution";
import { useAuth } from "@/lib/auth";
import {
  fetchCompetitionBySlug,
  fetchMyCompetitionSubmission,
  submitCompetitionEntry,
  type CompetitionSubmission,
} from "@/lib/competitions";
import type { Competition } from "@/lib/types";

export const Route = createFileRoute("/competitions/$slug")({
  component: CompetitionDetailPage,
  head: ({ params }) => ({
    meta: [{ title: `Competition — ${params.slug} — The Bu1ld` }],
  }),
});

function CompetitionDetailPage() {
  const { slug } = Route.useParams();
  const { user, configured } = useAuth();
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [mine, setMine] = useState<CompetitionSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    void fetchCompetitionBySlug(slug).then(async (c) => {
      if (!active) return;
      setCompetition(c);
      setLoading(false);
      if (c && user && !c.id.startsWith("seed-")) {
        setMine(await fetchMyCompetitionSubmission(c.id, user.id));
      }
    });
    return () => {
      active = false;
    };
  }, [slug, user]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !competition) return;
    setSubmitting(true);
    const { error, submission } = await submitCompetitionEntry({
      competitionId: competition.id,
      submitterId: user.id,
      title,
      summary,
      evidenceUrl: evidenceUrl || undefined,
    });
    setSubmitting(false);
    if (error) return toast.error(error);
    setMine(submission);
    toast.success("Submission recorded.");
  };

  if (loading) {
    return (
      <InstitutionLayout eyebrow="Competitions" title="Loading…">
        <p className="font-mono text-xs text-muted-foreground">Loading challenge…</p>
      </InstitutionLayout>
    );
  }

  if (!competition) {
    return (
      <InstitutionLayout eyebrow="Competitions" title="Challenge not found">
        <Link to="/competitions" className="text-accent-blue">
          All competitions →
        </Link>
      </InstitutionLayout>
    );
  }

  const relatedLab = getLab(COMPETITIONS_LAB[competition.slug] ?? "");

  return (
    <InstitutionLayout
      eyebrow="Competition"
      title={competition.title}
      description={competition.summary}
    >
      <div className="flex flex-wrap gap-3">
        <span className="rounded-sm border border-bone/20 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-bone">
          {competition.status}
        </span>
        {competition.deadline ? (
          <span className="font-mono text-[10px] text-muted-foreground">
            Deadline {competition.deadline}
          </span>
        ) : (
          <span className="font-mono text-[10px] text-muted-foreground">Deadline TBA</span>
        )}
        {relatedLab ? (
          <Link
            to="/labs/$slug"
            params={{ slug: relatedLab.slug }}
            className="font-mono text-[10px] text-accent-blue hover:text-bone"
          >
            Lab · {relatedLab.shortName}
          </Link>
        ) : null}
      </div>

      <section className="mt-10 rounded-sm border border-border/50 bg-bone/[0.02] p-6">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
          Evaluation protocol
        </h2>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
          {competition.evaluation_protocol ||
            "Protocol publishes before submissions open. Scoring freezes for the challenge window."}
        </p>
        <p className="mt-4 text-sm text-bone">
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
            Recognition ·{" "}
          </span>
          {competition.prize || "Recognition published with the challenge."}
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
          Submit entry
        </h2>
        {!configured ? (
          <p className="mt-4 text-sm text-accent-red">
            Competition submissions are temporarily unavailable.
          </p>
        ) : !user ? (
          <p className="mt-4 text-sm text-muted-foreground">
            <Link to="/signup" className="text-accent-blue">
              Create an account
            </Link>{" "}
            or{" "}
            <Link to="/login" className="text-accent-blue">
              log in
            </Link>{" "}
            to submit when the challenge is open.
          </p>
        ) : competition.status !== "open" ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Submissions open when status moves to <strong className="text-bone">open</strong>. Watch
            announcements on your dashboard.
          </p>
        ) : mine ? (
          <div className="mt-4 rounded-sm border border-accent-green/30 bg-accent-green/5 p-5 text-sm">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent-green">
              Your submission · {mine.status}
            </p>
            <p className="mt-3 font-display text-xl text-bone">{mine.title}</p>
            <p className="mt-2 text-muted-foreground">{mine.summary}</p>
            {mine.review_note ? (
              <p className="mt-3 text-sm text-bone">Reviewer note: {mine.review_note}</p>
            ) : null}
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-4 max-w-xl space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Entry title</Label>
              <Input
                id="title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="summary">Method + results summary</Label>
              <Textarea
                id="summary"
                required
                rows={5}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="bg-background/50"
                placeholder="What you built, how you evaluated it against the protocol, and known limits."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="evidence">Evidence URL (repo, paper, or demo)</Label>
              <Input
                id="evidence"
                type="url"
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                className="bg-background/50"
                placeholder="https://"
              />
            </div>
            <Button
              type="submit"
              disabled={submitting}
              className="font-mono text-[10px] uppercase tracking-[0.2em]"
            >
              {submitting ? "Submitting…" : "Submit entry"}
            </Button>
          </form>
        )}
      </section>

      <div className="mt-12">
        <Link
          to="/competitions"
          className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-bone"
        >
          ← All competitions
        </Link>
      </div>
    </InstitutionLayout>
  );
}

const COMPETITIONS_LAB: Record<string, string> = {
  "defect-worlds-challenge": "scientific-discovery",
  "residual-stream-hack": "robotics",
};
