import { getAllGuides } from "@/content/guides";
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
      "LeCun's representation-space prediction thesis, our internal tokenization thread, and the guide that ties them to BUILD prototypes.",
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
      "How we actually read and ship inside BUILD — read this before joining a research thread.",
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
): ContinueResearch | null {
  let best: ContinueResearch | null = null;

  for (const path of RESEARCH_PATHS) {
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
