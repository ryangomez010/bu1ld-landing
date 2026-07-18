import { getAllGuides } from "@/content/guides";
import { getSupabase } from "@/lib/supabase";
import { withSeedFallback, isDemoMode } from "@/lib/supabase-fallback";
import type { Guide } from "@/lib/types";
import type { Paper } from "@/lib/types";

export type PathStep = { kind: "guide"; slug: string } | { kind: "paper"; slug: string };

export type ResearchPath = {
  id: string;
  title: string;
  description: string;
  steps: PathStep[];
};

export const RESEARCH_PATHS: ResearchPath[] = [
  {
    id: "foundations",
    title: "Transformer foundations",
    description:
      "Start with attention mechanics, then read the paper that made it the default — with the math guide as backup when notation gets dense.",
    steps: [
      { kind: "guide", slug: "what-is-attention" },
      { kind: "paper", slug: "attention-is-all-you-need" },
      { kind: "guide", slug: "math-behind-ai" },
    ],
  },
  {
    id: "world-models",
    title: "World models & JEPA",
    description:
      "LeCun's representation-space prediction thesis, our internal tokenization thread, and the guide that ties them to member prototypes.",
    steps: [
      { kind: "guide", slug: "what-is-jepa" },
      { kind: "paper", slug: "lecun-jepa-world-models" },
      { kind: "paper", slug: "residual-event-tokenization" },
    ],
  },
  {
    id: "scaling-alignment",
    title: "Scaling & alignment",
    description:
      "How compute budgeting changed LM training, then how preference optimization replaced heavier RLHF pipelines in practice.",
    steps: [
      { kind: "paper", slug: "chinchilla-scaling-laws" },
      { kind: "paper", slug: "direct-preference-optimization" },
      { kind: "guide", slug: "how-llms-work" },
    ],
  },
  {
    id: "build-method",
    title: "Paper → prototype",
    description:
      "How The Bu1ld reads papers and scopes prototypes — read before applying to any research thread.",
    steps: [
      { kind: "guide", slug: "paper-to-prototype" },
      { kind: "guide", slug: "physics-informed-nns" },
      { kind: "paper", slug: "residual-event-tokenization" },
    ],
  },
  {
    id: "efficient-finetune",
    title: "Efficient adaptation",
    description:
      "LoRA for practical fine-tunes, then DPO for preference alignment — the stack most member projects actually run.",
    steps: [
      { kind: "paper", slug: "lora-low-rank-adaptation" },
      { kind: "paper", slug: "direct-preference-optimization" },
      { kind: "guide", slug: "how-llms-work" },
    ],
  },
  {
    id: "long-context",
    title: "Beyond attention",
    description:
      "Scaling laws for compute budgeting, then selective state-space models for long-context throughput experiments.",
    steps: [
      { kind: "paper", slug: "chinchilla-scaling-laws" },
      { kind: "paper", slug: "mamba-selective-state-spaces" },
      { kind: "guide", slug: "what-is-attention" },
    ],
  },
];

export function relatedGuidesForPaper(paper: Paper, guides: Guide[] = getAllGuides()): Guide[] {
  const tags = new Set(paper.tags.map((t) => t.toLowerCase()));
  return guides
    .map((g) => ({
      guide: g,
      score: g.tags.filter((t) => tags.has(t.toLowerCase())).length,
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((x) => x.guide);
}

export function pathProgress(
  path: ResearchPath,
  readPaperSlugs: Set<string>,
  guideProgress: Record<string, number>,
): { done: number; total: number; percent: number } {
  const total = path.steps.length;
  let done = 0;
  for (const step of path.steps) {
    if (step.kind === "paper" && readPaperSlugs.has(step.slug)) done++;
    if (step.kind === "guide" && (guideProgress[step.slug] ?? 0) >= 95) done++;
  }
  return { done, total, percent: total ? Math.round((done / total) * 100) : 0 };
}

export function stepHref(step: PathStep): string {
  return step.kind === "guide" ? `/guides/${step.slug}` : `/papers/${step.slug}`;
}

export function stepLabel(step: PathStep, guides: Guide[], papers: Paper[]): string {
  if (step.kind === "guide") {
    return guides.find((g) => g.slug === step.slug)?.title ?? step.slug;
  }
  return papers.find((p) => p.slug === step.slug)?.title ?? step.slug;
}

export function isStepDone(
  step: PathStep,
  readPaperSlugs: Set<string>,
  guideProgress: Record<string, number>,
): boolean {
  if (step.kind === "paper") return readPaperSlugs.has(step.slug);
  return (guideProgress[step.slug] ?? 0) >= 95;
}

export function findNextStepInPath(
  path: ResearchPath,
  readPaperSlugs: Set<string>,
  guideProgress: Record<string, number>,
): PathStep | null {
  for (const step of path.steps) {
    if (!isStepDone(step, readPaperSlugs, guideProgress)) return step;
  }
  return null;
}

export type ContinueResearch = {
  path: ResearchPath;
  step: PathStep;
  stepTitle: string;
  href: string;
  pathPercent: number;
};

/** Best path to resume: highest partial progress, then first incomplete step. */
export function findContinueResearch(
  readPaperSlugs: Set<string>,
  guideProgress: Record<string, number>,
  guides: Guide[] = getAllGuides(),
  papers: Paper[] = [],
  paths: ResearchPath[] = RESEARCH_PATHS,
): ContinueResearch | null {
  let best: ContinueResearch | null = null;

  for (const path of paths) {
    const progress = pathProgress(path, readPaperSlugs, guideProgress);
    if (progress.percent >= 100) continue;
    const step = findNextStepInPath(path, readPaperSlugs, guideProgress);
    if (!step) continue;
    const candidate: ContinueResearch = {
      path,
      step,
      stepTitle: stepLabel(step, guides, papers),
      href: stepHref(step),
      pathPercent: progress.percent,
    };
    if (!best || progress.percent > best.pathPercent) best = candidate;
  }

  return best;
}

export async function fetchResearchPathsFromDb(): Promise<ResearchPath[]> {
  const supabase = getSupabase();
  if (!supabase) return isDemoMode() ? RESEARCH_PATHS : RESEARCH_PATHS;

  const { data: paths, error } = await supabase
    .from("research_paths")
    .select("id, title, description, sort_order")
    .eq("published", true)
    .order("sort_order", { ascending: true });

  if (error || !paths?.length) {
    return withSeedFallback([], RESEARCH_PATHS);
  }

  const ids = paths.map((p) => String(p.id));
  const { data: steps } = await supabase
    .from("research_path_steps")
    .select("path_id, step_kind, step_slug, sort_order")
    .in("path_id", ids)
    .order("sort_order", { ascending: true });

  const byPath = new Map<string, PathStep[]>();
  for (const row of steps ?? []) {
    const pathId = String(row.path_id);
    const kind = row.step_kind === "paper" ? "paper" : "guide";
    const list = byPath.get(pathId) ?? [];
    list.push({ kind, slug: String(row.step_slug) });
    byPath.set(pathId, list);
  }

  const mapped: ResearchPath[] = paths.map((p) => ({
    id: String(p.id),
    title: String(p.title),
    description: String(p.description ?? ""),
    steps: byPath.get(String(p.id)) ?? [],
  }));

  return withSeedFallback(
    mapped.filter((p) => p.steps.length > 0),
    RESEARCH_PATHS,
  );
}

export type PathProgressRow = {
  user_id: string;
  path_id: string;
  completed_steps: number;
  last_step_slug: string | null;
  updated_at: string;
};

export async function fetchPathProgress(
  userId: string,
  pathId?: string,
): Promise<PathProgressRow[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  let q = supabase.from("research_path_progress").select("*").eq("user_id", userId);
  if (pathId) q = q.eq("path_id", pathId);
  const { data, error } = await q;
  if (error || !data) return [];
  return data.map((row) => ({
    user_id: String(row.user_id),
    path_id: String(row.path_id),
    completed_steps: Number(row.completed_steps ?? 0),
    last_step_slug: row.last_step_slug != null ? String(row.last_step_slug) : null,
    updated_at: String(row.updated_at),
  }));
}

export async function upsertPathProgress(input: {
  userId: string;
  pathId: string;
  completedSteps: number;
  lastStepSlug?: string | null;
}): Promise<{ error: string | null }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "This action is temporarily unavailable." };
  const { error } = await supabase.from("research_path_progress").upsert(
    {
      user_id: input.userId,
      path_id: input.pathId,
      completed_steps: Math.max(0, Math.round(input.completedSteps)),
      last_step_slug: input.lastStepSlug ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,path_id" },
  );
  return { error: error?.message ?? null };
}
