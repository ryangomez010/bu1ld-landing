import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, CheckCircle2, FileText, RefreshCw, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { RequireMember } from "@/components/auth/RequireAuth";
import { LoadingState } from "@/components/member/LoadingState";
import { MemberLayout } from "@/components/member/MemberLayout";
import { SectionHeader } from "@/components/member/SectionHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import {
  PAPER_ANALYSIS_MAX_CHARS,
  PAPER_ANALYSIS_MIN_CHARS,
  analyzePaperText,
  deletePaperAnalysis,
  fetchPaperAnalyses,
  savePaperAnalysis,
} from "@/lib/paper-analysis";
import { checkSupabaseConfigured } from "@/lib/supabase";
import type { PaperAnalysis, PaperAnalysisResult } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/research/analyze")({
  component: PaperAnalyzerPage,
  head: () => ({
    meta: [{ title: "Paper analyzer — The Bu1LD" }],
  }),
});

function PaperAnalyzerPage() {
  return (
    <RequireMember>
      <PaperAnalyzer />
    </RequireMember>
  );
}

function PaperAnalyzer() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [text, setText] = useState("");
  const [analysis, setAnalysis] = useState<PaperAnalysisResult | null>(null);
  const [analyses, setAnalyses] = useState<PaperAnalysis[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const databaseReady = checkSupabaseConfigured();
  const characterCount = text.trim().replace(/\s+/g, " ").length;
  const remaining = PAPER_ANALYSIS_MAX_CHARS - characterCount;
  const canAnalyze =
    title.trim().length >= 4 &&
    characterCount >= PAPER_ANALYSIS_MIN_CHARS &&
    characterCount <= PAPER_ANALYSIS_MAX_CHARS &&
    !running;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user || !databaseReady) {
        setAnalyses([]);
        setLoadingHistory(false);
        return;
      }
      setLoadingHistory(true);
      try {
        const rows = await fetchPaperAnalyses(user.id);
        if (!cancelled) setAnalyses(rows);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load paper analyses.");
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [databaseReady, user]);

  const guidance = useMemo(() => {
    if (characterCount === 0) return "Paste abstract, methods, experiments, results, and limits.";
    if (characterCount < PAPER_ANALYSIS_MIN_CHARS) {
      return `${PAPER_ANALYSIS_MIN_CHARS - characterCount} more characters needed for a useful analysis.`;
    }
    if (remaining < 0) return `${Math.abs(remaining).toLocaleString()} characters over the limit.`;
    return `${characterCount.toLocaleString()} characters ready for structural analysis.`;
  }, [characterCount, remaining]);

  async function onAnalyze(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !canAnalyze) return;

    setRunning(true);
    setError(null);
    try {
      const output = await analyzePaperText({ title, sourceUrl, text });
      setAnalysis(output.result);
      if (databaseReady) {
        const saved = await savePaperAnalysis(user.id, output);
        setAnalyses((rows) => [saved, ...rows.filter((row) => row.id !== saved.id)].slice(0, 12));
        toast.success("Analysis saved to your research workspace.");
      } else {
        toast.success("Analysis generated for this session.");
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not analyze this paper text.";
      setError(message);
      toast.error(message);
    } finally {
      setRunning(false);
    }
  }

  async function onDelete(id: string) {
    if (!user) return;
    try {
      await deletePaperAnalysis(user.id, id);
      setAnalyses((rows) => rows.filter((row) => row.id !== id));
      toast.success("Analysis removed.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not remove this analysis.");
    }
  }

  return (
    <MemberLayout title="Paper analyzer" eyebrow="research workspace">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)]">
        <section className="panel glass rounded-3xl p-5 md:p-7">
          <div className="relative z-[1]">
            <SectionHeader
              title="Turn a paper into a review brief"
              description="Paste paper text and The Bu1LD will produce a structured reviewer brief: problem, contribution, method, datasets, experiments, findings, limitations, reproducibility notes, weaknesses, and follow-up questions."
            />
            <div className="mb-6 rounded-2xl border border-accent-blue/20 bg-accent-blue/5 p-4 text-sm leading-relaxed text-muted-foreground">
              This pass is deterministic and local to the app. It treats paper text as untrusted
              evidence, does not verify citations, and saves only the pasted excerpt plus structured
              notes under your account when the production database is connected.
            </div>

            <form className="space-y-5" onSubmit={(event) => void onAnalyze(event)}>
              <div className="grid gap-2">
                <Label htmlFor="paper-title">Paper title</Label>
                <Input
                  id="paper-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={180}
                  required
                  placeholder="Attention Is All You Need"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="paper-source">Source URL</Label>
                <Input
                  id="paper-source"
                  value={sourceUrl}
                  onChange={(event) => setSourceUrl(event.target.value)}
                  inputMode="url"
                  placeholder="https://arxiv.org/abs/..."
                />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="paper-text">Paper text</Label>
                  <span
                    className={cn(
                      "font-mono text-[10px] uppercase tracking-[0.18em]",
                      remaining < 0 ? "text-destructive" : "text-muted-foreground",
                    )}
                  >
                    {guidance}
                  </span>
                </div>
                <Textarea
                  id="paper-text"
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  rows={18}
                  required
                  aria-describedby="paper-text-help"
                  placeholder="Paste the abstract, introduction, method, experiment, result, limitation, and reproducibility sections. Omit private reviewer notes or unreleased data."
                  className="min-h-[460px] font-mono text-xs leading-relaxed"
                />
                <p id="paper-text-help" className="text-xs leading-relaxed text-muted-foreground">
                  For production privacy, this form accepts text only. Run OCR or PDF extraction
                  locally, inspect the result, then paste only the sections you are allowed to
                  store.
                </p>
              </div>

              {error ? (
                <div
                  role="alert"
                  className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  <span>{error}</span>
                </div>
              ) : null}

              {!databaseReady ? (
                <div className="flex items-start gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  <span>
                    Analysis will run in this browser session. Saving requires the production
                    Supabase environment to be configured in deployment.
                  </span>
                </div>
              ) : null}

              <Button type="submit" size="lg" disabled={!canAnalyze} className="w-full sm:w-auto">
                {running ? (
                  <>
                    <RefreshCw className="h-4 w-4 motion-safe:animate-spin" aria-hidden />
                    Analyzing
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4" aria-hidden />
                    Analyze paper
                  </>
                )}
              </Button>
            </form>
          </div>
        </section>

        <aside className="space-y-6">
          <AnalysisPanel result={analysis} />

          <section className="panel glass rounded-3xl p-5 md:p-6">
            <div className="relative z-[1]">
              <SectionHeader
                title="Saved analyses"
                description="Private to your account by RLS. Use these as starting points for reviews, project literature notes, or mentor discussion."
              />
              {loadingHistory ? (
                <LoadingState label="Loading analyses…" className="py-8" />
              ) : analyses.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/60 p-5 text-sm leading-relaxed text-muted-foreground">
                  No saved analyses yet. Run the analyzer on a paper you are actively reading, then
                  compare its structure with the original PDF before sharing conclusions.
                </div>
              ) : (
                <div className="space-y-3">
                  {analyses.map((row) => (
                    <article key={row.id} className="rounded-2xl border border-border/40 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-display text-base text-bone">{row.title}</h3>
                          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                            {new Date(row.created_at).toLocaleDateString()} ·{" "}
                            {row.input_sha256.slice(0, 10)}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Delete analysis for ${row.title}`}
                          onClick={() => void onDelete(row.id)}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </Button>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        {row.structured_result.problem[0]}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        </aside>
      </div>
    </MemberLayout>
  );
}

function AnalysisPanel({ result }: { result: PaperAnalysisResult | null }) {
  return (
    <section className="panel glass rounded-3xl p-5 md:p-6">
      <div className="relative z-[1]">
        <SectionHeader
          title="Current brief"
          description="Reviewer-facing structure generated from the pasted text."
        />
        {!result ? (
          <div className="rounded-2xl border border-dashed border-border/60 p-5 text-sm leading-relaxed text-muted-foreground">
            The first analysis appears here with evidence buckets and questions for deeper review.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-3 text-sm text-emerald-100">
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              Brief generated. Verify every claim against the paper before publication.
            </div>
            {result.abstract ? (
              <AnalysisBucket title="Abstract signal" items={[result.abstract]} />
            ) : null}
            <AnalysisBucket title="Problem" items={result.problem} />
            <AnalysisBucket title="Contribution" items={result.contribution} />
            <AnalysisBucket title="Method" items={result.method} />
            <AnalysisBucket title="Datasets" items={result.datasets} />
            <AnalysisBucket title="Experiments" items={result.experiments} />
            <AnalysisBucket title="Findings" items={result.findings} />
            <AnalysisBucket title="Limitations" items={result.limitations} />
            <AnalysisBucket title="Reproducibility" items={result.reproducibility} />
            <AnalysisBucket title="Weaknesses" items={result.weaknesses} />
            <AnalysisBucket title="Reviewer questions" items={result.questions} />
            <div className="rounded-2xl border border-border/40 p-4 text-sm leading-relaxed text-muted-foreground">
              {result.safety_note}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function AnalysisBucket({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-border/40 p-4">
      <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        {title}
      </h3>
      <ul className="mt-3 space-y-2 text-sm leading-relaxed text-bone/85">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-blue/70" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
