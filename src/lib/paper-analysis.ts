import { getSupabase } from "@/lib/supabase";
import type { PaperAnalysis, PaperAnalysisResult } from "@/lib/types";

export const PAPER_ANALYSIS_MIN_CHARS = 700;
export const PAPER_ANALYSIS_MAX_CHARS = 60_000;

export type AnalyzePaperInput = {
  title: string;
  sourceUrl?: string;
  text: string;
};

export type AnalyzePaperOutput = {
  title: string;
  sourceUrl: string | null;
  excerpt: string;
  inputHash: string;
  result: PaperAnalysisResult;
};

const SECTION_HEADINGS = [
  "abstract",
  "introduction",
  "background",
  "related work",
  "method",
  "methods",
  "approach",
  "model",
  "experiments",
  "evaluation",
  "results",
  "discussion",
  "limitations",
  "conclusion",
] as const;

const BUCKETS: Record<keyof Omit<PaperAnalysisResult, "abstract" | "safety_note">, string[]> = {
  problem: [
    "problem",
    "challenge",
    "gap",
    "objective",
    "goal",
    "we address",
    "we study",
    "we investigate",
  ],
  contribution: [
    "contribution",
    "we propose",
    "we introduce",
    "we present",
    "novel",
    "this paper",
    "our work",
  ],
  method: [
    "method",
    "architecture",
    "algorithm",
    "training",
    "optimization",
    "loss",
    "objective",
    "regularization",
  ],
  datasets: [
    "dataset",
    "corpus",
    "benchmark",
    "imagenet",
    "cifar",
    "mnist",
    "wikitext",
    "common crawl",
    "the pile",
  ],
  experiments: [
    "experiment",
    "evaluation",
    "ablation",
    "baseline",
    "metric",
    "accuracy",
    "f1",
    "perplexity",
  ],
  findings: [
    "result",
    "improves",
    "outperforms",
    "reduces",
    "increases",
    "achieves",
    "we find",
    "suggests",
  ],
  limitations: [
    "limitation",
    "limited",
    "failure",
    "future work",
    "does not",
    "cannot",
    "assumption",
    "threat",
  ],
  reproducibility: [
    "code",
    "source",
    "implementation",
    "hyperparameter",
    "seed",
    "reproduce",
    "reproducibility",
    "appendix",
  ],
  weaknesses: [
    "weakness",
    "unclear",
    "missing",
    "unreported",
    "insufficient",
    "bias",
    "confound",
    "leakage",
  ],
  questions: ["why", "how", "whether", "what if", "open question", "future work", "?"],
};

function cleanWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function validateSourceUrl(value?: string): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (!["https:", "http:"].includes(url.protocol)) {
      throw new Error("Only HTTP(S) paper links are accepted.");
    }
    return url.toString();
  } catch {
    throw new Error("Use a valid HTTP(S) source URL or leave the source blank.");
  }
}

function normalizeInput(input: AnalyzePaperInput): {
  title: string;
  sourceUrl: string | null;
  text: string;
} {
  const title = cleanWhitespace(input.title);
  if (title.length < 4) throw new Error("Add the paper title before running analysis.");
  if (title.length > 180) throw new Error("Keep the paper title under 180 characters.");

  const text = cleanWhitespace(input.text);
  if (text.length < PAPER_ANALYSIS_MIN_CHARS) {
    throw new Error(`Paste at least ${PAPER_ANALYSIS_MIN_CHARS} characters from the paper.`);
  }
  if (text.length > PAPER_ANALYSIS_MAX_CHARS) {
    throw new Error(
      `Limit the pasted paper text to ${PAPER_ANALYSIS_MAX_CHARS.toLocaleString()} characters.`,
    );
  }

  return { title, sourceUrl: validateSourceUrl(input.sourceUrl), text };
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z0-9[(])/)
    .map(cleanWhitespace)
    .filter((sentence) => sentence.length >= 35 && sentence.length <= 420);
}

function extractSection(text: string, heading: string): string | undefined {
  const headingPattern = heading.replace(/\s+/g, "\\s+");
  const start = new RegExp(
    `(?:^|\\s)(?:\\d+(?:\\.\\d+)*\\s*)?${headingPattern}\\s*[:\\n]`,
    "i",
  ).exec(text);
  if (!start) return undefined;
  const remaining = text.slice((start.index ?? 0) + start[0].length);
  const nextHeading = new RegExp(
    `\\s(?:\\d+(?:\\.\\d+)*\\s*)?(?:${SECTION_HEADINGS.filter((h) => h !== heading).join("|")})\\s*[:\\n]`,
    "i",
  ).exec(remaining);
  return cleanWhitespace(remaining.slice(0, nextHeading?.index ?? 1_500)).slice(0, 1_500);
}

function scoreSentence(sentence: string, keywords: string[]): number {
  const lower = sentence.toLowerCase();
  return keywords.reduce((score, keyword) => score + (lower.includes(keyword) ? 1 : 0), 0);
}

function pickSentences(sentences: string[], keywords: string[], limit: number): string[] {
  return sentences
    .map((sentence, index) => ({ sentence, index, score: scoreSentence(sentence, keywords) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .sort((a, b) => a.index - b.index)
    .map((entry) => entry.sentence);
}

function fallbackFor(bucket: keyof typeof BUCKETS): string[] {
  const labels: Record<keyof typeof BUCKETS, string> = {
    problem: "The pasted text does not state the research problem in a clean standalone sentence.",
    contribution:
      "The pasted text does not isolate the claimed contribution clearly enough for automatic extraction.",
    method:
      "The pasted text does not describe the method with enough detail for a reliable structural note.",
    datasets: "Datasets or benchmarks are not identifiable from the pasted text.",
    experiments: "Experimental setup and metrics are not identifiable from the pasted text.",
    findings:
      "Results are not stated clearly enough in the pasted text for a precise finding summary.",
    limitations:
      "Limitations are not explicit in the pasted text; reviewers should check the paper directly.",
    reproducibility:
      "Reproducibility details such as code, seeds, hyperparameters, or appendices are not explicit.",
    weaknesses:
      "No automatic weakness should be inferred beyond missing or unclear evidence in the pasted text.",
    questions: "Reviewers should ask what evidence would falsify the paper's central claim.",
  };
  return [labels[bucket]];
}

export async function sha256Text(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function analyzePaperText(input: AnalyzePaperInput): Promise<AnalyzePaperOutput> {
  const normalized = normalizeInput(input);
  const sentences = splitSentences(normalized.text);
  const abstract = extractSection(normalized.text, "abstract");
  const result = Object.fromEntries(
    Object.entries(BUCKETS).map(([bucket, keywords]) => {
      const picked = pickSentences(sentences, keywords, bucket === "questions" ? 4 : 3);
      return [bucket, picked.length ? picked : fallbackFor(bucket as keyof typeof BUCKETS)];
    }),
  ) as Omit<PaperAnalysisResult, "abstract" | "safety_note">;

  const output: PaperAnalysisResult = {
    abstract,
    ...result,
    safety_note:
      "This is a deterministic structural extraction from user-provided paper text. Treat it as triage: verify citations, equations, results, and claims against the original paper before publishing a review or making project decisions.",
  };

  return {
    title: normalized.title,
    sourceUrl: normalized.sourceUrl,
    excerpt: normalized.text.slice(0, 2_400),
    inputHash: await sha256Text(normalized.text),
    result: output,
  };
}

function normalizeAnalysis(row: PaperAnalysis): PaperAnalysis {
  return {
    ...row,
    structured_result: row.structured_result,
  };
}

export async function fetchPaperAnalyses(userId: string): Promise<PaperAnalysis[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("paper_analyses")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(12);

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => normalizeAnalysis(row as PaperAnalysis));
}

export async function savePaperAnalysis(
  userId: string,
  analysis: AnalyzePaperOutput,
): Promise<PaperAnalysis> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Saving analyses is temporarily unavailable.");

  const { data, error } = await supabase
    .from("paper_analyses")
    .insert({
      user_id: userId,
      title: analysis.title,
      source_url: analysis.sourceUrl,
      input_kind: "text",
      input_excerpt: analysis.excerpt,
      input_sha256: analysis.inputHash,
      status: "completed",
      provider: "local_structured_v1",
      prompt_version: "paper-analysis-v1",
      structured_result: analysis.result,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return normalizeAnalysis(data as PaperAnalysis);
}

export async function deletePaperAnalysis(userId: string, id: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Deleting analyses is temporarily unavailable.");

  const { error } = await supabase
    .from("paper_analyses")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}
