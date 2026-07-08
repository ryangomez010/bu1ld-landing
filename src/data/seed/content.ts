import type {
  EventDeadline,
  EventResource,
  Guide,
  MlEvent,
  NewsletterIssue,
  Paper,
} from "@/lib/types";

export const SEED_EVENTS: MlEvent[] = [
  {
    id: "seed-neurips-2026",
    slug: "neurips-2026",
    title: "NeurIPS 2026",
    summary:
      "The flagship machine learning conference. Strong venue for world models, scaling laws, and systems papers.",
    location: "Sydney, Australia",
    start_date: "2026-12-06",
    end_date: "2026-12-12",
    topics: ["Deep learning", "World models", "Theory", "Systems"],
    prep_notes:
      "Start with a crisp problem statement and a single strong baseline. NeurIPS reviewers reward honest limitations sections. If you are targeting the main track, line up internal reads 6–8 weeks before the abstract deadline.",
    resources: [
      {
        label: "NeurIPS paper template (LaTeX)",
        url: "https://media.neurips.cc/Conferences/NeurIPS2024/Styles/neurips_2024.sty",
        kind: "latex",
      },
      {
        label: "Overleaf NeurIPS template",
        url: "https://www.overleaf.com/latex/templates/neurips-2024/tpsbbrdqcmsh",
        kind: "template",
      },
      {
        label: "Official conference site",
        url: "https://neurips.cc",
        kind: "other",
      },
    ],
    deadlines: [
      { label: "Abstract deadline", date: "2026-05-15" },
      { label: "Full paper deadline", date: "2026-05-22" },
      { label: "Author notification", date: "2026-09-18" },
      { label: "Camera-ready", date: "2026-10-23" },
    ],
    url: "https://neurips.cc",
    published: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "seed-icml-2026",
    slug: "icml-2026",
    title: "ICML 2026",
    summary:
      "International Conference on Machine Learning — broad ML with strong optimization and theory presence.",
    location: "Seoul, South Korea",
    start_date: "2026-07-06",
    end_date: "2026-07-12",
    topics: ["Optimization", "RL", "Generative models", "Probabilistic ML"],
    prep_notes:
      "ICML favors clear empirical protocols. Reproducibility checklist matters. Workshop submissions are a good way to test ideas before the main conference cycle.",
    resources: [
      {
        label: "ICML LaTeX style files",
        url: "https://icml.cc/Conferences/2025/StyleAuthorInstructions",
        kind: "latex",
      },
      {
        label: "OpenReview ICML",
        url: "https://openreview.net/group?id=ICML.cc",
        kind: "cfp",
      },
    ],
    deadlines: [
      { label: "Abstract deadline", date: "2026-01-28" },
      { label: "Full paper deadline", date: "2026-02-04" },
      { label: "Author notification", date: "2026-04-30" },
    ],
    url: "https://icml.cc",
    published: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "seed-build-summit",
    slug: "build-summit-2026-q3",
    title: "The Bu1ld Summit — Q3 2026",
    summary:
      "Internal showcase: research threads, startup demos, and builder networking across the membership pool.",
    location: "Distributed / Stanford hub",
    start_date: "2026-09-20",
    end_date: "2026-09-21",
    topics: ["BUILD community", "Startups", "Research threads"],
    prep_notes:
      "Members presenting prototypes should prepare a 5-minute demo and one slide on what broke. This is a shipping checkpoint, not a poster session.",
    resources: [
      {
        label: "BUILD Discord",
        url: "https://discord.gg/NG4QYat4P",
        kind: "other",
      },
    ],
    deadlines: [{ label: "Demo submission", date: "2026-09-01" }],
    url: null,
    published: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
];

export const SEED_PAPERS: Paper[] = [
  {
    id: "seed-attention",
    slug: "attention-is-all-you-need",
    title: "Attention Is All You Need",
    authors: "Vaswani et al.",
    year: 2017,
    arxiv_url: "https://arxiv.org/abs/1706.03762",
    tags: ["Transformers", "Attention", "Foundations"],
    is_classic: true,
    summary: "The paper that made self-attention the default interface for sequence modeling.",
    review_body: `## Why it still matters

Before transformers, sequence modeling meant recurrence or convolutions over time. This paper showed that a stack of self-attention layers — with no recurrence — could match and surpass state-of-the-art on translation while training faster in parallel.

## Core idea

**Self-attention** lets every token look at every other token in one step. Each position builds a query, key, and value vector. Attention weights are softmax(QKᵀ/√d)V — a weighted mix of values based on query–key similarity.

## What to notice when reading

- Multi-head attention is not just redundancy; different heads specialize in different relational patterns.
- Positional information is injected because attention itself is permutation-invariant.
- The encoder–decoder cross-attention pattern is what later decoder-only LLMs simplified away.

## BUILD take

Every modern LLM is a descendant of this architecture choice. When you read newer papers about MoE, RoPE, or sliding windows, you are looking at patches on this foundation — not replacements.`,
    published: true,
    published_at: "2026-01-15T00:00:00Z",
    created_at: "2026-01-15T00:00:00Z",
    updated_at: "2026-01-15T00:00:00Z",
  },
  {
    id: "seed-jepa",
    slug: "lecun-jepa-world-models",
    title: "A Path Towards Autonomous Machine Intelligence (JEPA)",
    authors: "Yann LeCun",
    year: 2022,
    arxiv_url: "https://arxiv.org/abs/2206.08808",
    tags: ["World models", "JEPA", "Self-supervised learning"],
    is_classic: true,
    summary: "LeCun's blueprint for learning abstract world models without reconstructing pixels.",
    review_body: `## The problem LeCun is solving

Generative models that reconstruct raw sensory data (pixels, waveforms) waste capacity on details that do not matter for planning. JEPA (Joint Embedding Predictive Architecture) predicts in **representation space** instead.

## Key distinction

| Approach | Predicts | Risk |
|----------|----------|------|
| Generative (VAE, diffusion) | Raw observations | Spends capacity on texture |
| JEPA | Abstract embeddings | Must design good abstraction |

## Why BUILD cares

Several of our research threads — world models, latent safety, PDE surrogates — hinge on whether your latent space encodes **causal** structure or just compresses appearance. JEPA is the clearest public articulation of "predict in the right space."

## Reading tip

Do not treat this as a single architecture paper. Read it as a research agenda: hierarchical planning, self-supervised pretraining, and energy-based models as components of one stack.`,
    published: true,
    published_at: "2026-02-01T00:00:00Z",
    created_at: "2026-02-01T00:00:00Z",
    updated_at: "2026-02-01T00:00:00Z",
  },
  {
    id: "seed-residual-tokenization",
    slug: "residual-event-tokenization",
    title: "Residual Event Tokenization (BUILD thread)",
    authors: "The Bu1ld research collective",
    year: 2026,
    arxiv_url: null,
    tags: ["Tokenization", "World models", "BUILD original"],
    is_classic: false,
    summary: "Internal research direction: encode surprise, not every frame.",
    review_body: `## The intuition

Continuous streams — video, sensor logs, agent trajectories — contain massive redundancy. Standard tokenizers treat every timestep equally. **Residual event tokenization** asks: what if we only encode what changed in a way that matters for prediction and control?

## Working definition

1. Maintain a latent state summarizing "what the world is like now."
2. When incoming data produces a large **prediction residual**, emit an event token.
3. Quiet periods cost almost nothing in sequence length.

## Why this is interesting now

As world models scale, sequence length becomes the bottleneck — not parameter count. Event-based tokenization is one path to longer horizons without quadratic attention costs over dense frames.

## Status

This is active BUILD research, not a published paper. Members on the Residual Event Tokenization thread are prototyping on synthetic physical environments first.`,
    published: true,
    published_at: "2026-03-01T00:00:00Z",
    created_at: "2026-03-01T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
  },
];

export const SEED_NEWSLETTERS: NewsletterIssue[] = [
  {
    id: "seed-nl-12",
    slug: "issue-12-march-2026",
    title: "BUILD Digest #12 — March 2026",
    issue_number: 12,
    summary:
      "NeurIPS deadlines on the horizon, new startup spinout, and three papers worth your weekend.",
    body: `## This month at BUILD

**Eigen Δ** closed a research milestone: delta-trained specialization in under 4 hours on a single A100 for a 7B base. Demo at the Q3 summit.

**Counterfactual Defect Worlds** thread added two new builders from MIT. They are building a synthetic defect injection suite for video world models.

## Paper picks

1. *Attention Is All You Need* — if you have not read it in five years, read it again. Notice what did not make it into GPT.
2. LeCun's JEPA position paper — essential context for our world-model threads.
3. A fresh surrogate-model failure analysis from the PINN community — we will publish a full review soon.

## Events radar

- ICML 2026 full paper deadline: **Feb 4** (passed — workshop track still open)
- NeurIPS 2026 abstract: **May 15** — start internal reads now
- BUILD Summit Q3: demo submissions due **Sep 1**

## Startup spotlight

**Colorworld** shipped brand-token export to Figma. First paying design teams onboarding this month.

---

*Reply in Discord #digest with what you want covered next issue.*`,
    published: true,
    published_at: "2026-03-01T00:00:00Z",
    created_at: "2026-03-01T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
  },
  {
    id: "seed-nl-11",
    slug: "issue-11-february-2026",
    title: "BUILD Digest #11 — February 2026",
    issue_number: 11,
    summary: "Fellowship applications open, physics ML reading group, and ICML deadline week.",
    body: `## Fellowship

Research Fellowship (6-month track) is accepting applications through March 15. Co-advised placements with UC and Stanford collaborators.

## Reading group

Physics-informed neural networks — Thursdays 18:00 UTC on Discord. First session covers when PINNs beat classical solvers (and when they silently fail).

## Deadlines

ICML full paper deadline this week. Good luck to everyone submitting.

## New members

Welcome to 14 new builders who joined the membership pool in January.`,
    published: true,
    published_at: "2026-02-01T00:00:00Z",
    created_at: "2026-02-01T00:00:00Z",
    updated_at: "2026-02-01T00:00:00Z",
  },
];

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export type { Guide };
