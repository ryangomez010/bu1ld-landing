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

That sounds obvious in 2026. In 2017 it was a genuine bet: throw away inductive bias about locality and order, inject position explicitly, and let data + scale do the rest.

## Core idea

**Self-attention** lets every token look at every other token in one step. Each position builds a query, key, and value vector. Attention weights are softmax(QKᵀ/√d)V — a weighted mix of values based on query–key similarity.

The √d scaling is easy to skip over. Without it, dot products blow up in high dimensions and softmax saturates — gradients vanish. Small detail, huge training stability impact.

## What to notice when reading

- Multi-head attention is not redundancy for its own sake. Heads often specialize (syntax vs coreference vs position) even though nothing in the loss forces that.
- Positional information is injected because attention itself is permutation-invariant — order has to come from somewhere.
- Encoder–decoder cross-attention is the pattern seq2seq systems used; decoder-only LLMs dropped the encoder and kept the autoregressive stack.

## Reproduce this weekend

1. Implement single-head attention on a 4×4 toy sequence. Print the weight matrix. Change √d and watch saturation.
2. Compare parameter count vs a tiny LSTM on the same synthetic copy task.
3. Read Section 3.2 on multi-head — map each head's weights on a real sentence using a small pretrained model.

## BUILD take

Every modern LLM is a descendant of this architecture choice. When you read MoE, RoPE, or sliding-window papers, you are reading patches on this foundation — not replacements. Our threads on long-context world models usually fail or succeed based on whether the patch preserves the **relational** inductive bias attention gives you.`,
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

If your latent must reconstruct every blade of grass, it will memorize texture. If it only must predict an embedding that preserves what matters for control, you force abstraction.

## Key distinction

| Approach | Predicts | Risk |
|----------|----------|------|
| Generative (VAE, diffusion) | Raw observations | Spends capacity on texture |
| JEPA | Abstract embeddings | Must design good abstraction |

## Why BUILD cares

Several of our research threads — world models, latent safety, PDE surrogates — hinge on whether your latent space encodes **causal** structure or just compresses appearance. JEPA is the clearest public articulation of "predict in the right space."

When a surrogate model looks great on MSE but fails off-distribution, we usually find the latent was doing generative compression — not JEPA-style abstraction.

## Reading tip

Do not treat this as a single architecture paper. Read it as a research agenda: hierarchical planning, self-supervised pretraining, and energy-based models as components of one stack. Follow-ups (I-JEPA, V-JEPA) are worth skimming after the position paper lands.

## BUILD take

Ask on every world-model prototype: *what is the embedding trained to ignore?* If the answer is "nothing," you are back in pixel reconstruction land.`,
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

## What we are running internally

- **Synthetic first:** 2D physics environments where ground-truth events (collisions, contact) are known. Measure whether learned events align.
- **Failure mode we watch for:** tokenizer collapses to frame subsampling — events on a clock, not on surprise.
- **Success criterion:** downstream planning improves at fixed context budget vs uniform tokenization.

## Status

Active BUILD research — not a published paper. Members on the Residual Event Tokenization thread ship weekly demos or written postmortems. Reach out via the open project if you want in.

## BUILD take

If you cannot explain what your tokenizer throws away, you do not have a tokenizer — you have a compressor.`,
    published: true,
    published_at: "2026-03-01T00:00:00Z",
    created_at: "2026-03-01T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
  },
  {
    id: "seed-chinchilla",
    slug: "chinchilla-scaling-laws",
    title: "Training Compute-Optimal Large Language Models (Chinchilla)",
    authors: "Hoffmann et al.",
    year: 2022,
    arxiv_url: "https://arxiv.org/abs/2203.15556",
    tags: ["Scaling", "LLMs", "Foundations"],
    is_classic: true,
    summary:
      "Most big models were under-trained. Chinchilla showed how to spend compute between parameters and tokens — and changed the scaling conversation overnight.",
    review_body: `## The headline result

For a fixed compute budget, smaller models trained on **more tokens** beat larger models trained on fewer tokens. A 70B model on ~1.4T tokens outperformed much larger Gopher-style stacks that skimped on data.

The field had been biased toward "bigger weights." This paper rebalanced the budget toward **data**.

## The scaling law in plain language

Loss improves predictably with model size (N) and dataset size (D). The mistake was assuming you should max N first. Hoffmann et al. fit exponents and argued for **compute-optimal** pairing: if you double compute, scale N and D together — not N alone.

## What to check in the tables

- IsoFLOP curves: at fixed compute, there is an optimal model size — not monotonically bigger.
- Chinchilla vs Gopher at matched compute — the win is not magic architecture, it is budget allocation.
- Appendix discussions of inference cost: training-optimal ≠ deployment-optimal. That tension still drives product decisions.

## Reproduce at BUILD scale

You will not rerun Chinchilla. You *can*:

1. Pick a tiny transformer family (e.g. 50M–200M params).
2. Train three budgets: overweight params, overweight tokens, Chinchilla-balanced.
3. Plot val loss vs FLOPs. The middle configuration should dominate.

## BUILD take

When a startup says "we need a bigger model," ask for their token budget and data repeat count. Under-training is still the silent killer in fine-tunes — not just pretraining.`,
    published: true,
    published_at: "2026-02-15T00:00:00Z",
    created_at: "2026-02-15T00:00:00Z",
    updated_at: "2026-02-15T00:00:00Z",
  },
  {
    id: "seed-dpo",
    slug: "direct-preference-optimization",
    title: "Direct Preference Optimization (DPO)",
    authors: "Rafailov et al.",
    year: 2023,
    arxiv_url: "https://arxiv.org/abs/2305.18290",
    tags: ["Alignment", "LLMs", "RLHF"],
    is_classic: false,
    summary:
      "Skip the RL loop — optimize preferences with a simple classification-style loss on paired outputs.",
    review_body: `## What problem this solves

Classic RLHF: train a reward model, then optimize policy with PPO — unstable, fiddly, expensive. DPO reparameterizes the RL objective so you can fine-tune the language model **directly** on preference pairs (chosen vs rejected) with a supervised-looking loss.

## Core idea

Under a Bradley–Terry preference model and a specific reward parameterization, the optimal policy has a closed form relating log-prob ratios to reward. Substitute that into the preference loss and the reward model disappears from the training loop.

Practically: increase log-prob gap on chosen vs rejected completions, with a β knob controlling how far you drift from the reference model.

## What to watch when implementing

- **Reference model matters.** KL is implicit via the partition term — do not delete the reference checkpoint.
- **β too high:** model barely moves. **β too low:** collapse, repetition, reward hacking on the preference dataset.
- **Data quality dominates.** DPO makes bad preferences train faster, not better.

## Comparison table

| Method | Reward model | RL loop | Typical pain |
|--------|--------------|---------|--------------|
| RLHF (PPO) | Yes | Yes | Instability, GPU overhead |
| DPO | No | No | β tuning, distribution shift |
| ORPO / IPO variants | No | No | Different implicit constraints |

## BUILD take

Most member projects should start with SFT + light DPO on **small, curated** preference sets — not full RL stacks. If alignment fails, fix the pairs before touching the optimizer.`,
    published: true,
    published_at: "2026-03-10T00:00:00Z",
    created_at: "2026-03-10T00:00:00Z",
    updated_at: "2026-03-10T00:00:00Z",
  },
  {
    id: "seed-lora",
    slug: "lora-low-rank-adaptation",
    title: "LoRA: Low-Rank Adaptation of Large Language Models",
    authors: "Hu et al.",
    year: 2021,
    arxiv_url: "https://arxiv.org/abs/2106.09685",
    tags: ["Fine-tuning", "Efficiency", "LLMs"],
    is_classic: true,
    summary:
      "Train tiny adapter matrices instead of full weights — the default trick for customizing big models on small GPUs.",
    review_body: `## The problem

Full fine-tuning a 7B+ model needs memory for optimizer states on every parameter. Most teams only need to steer behavior on a narrow domain — not rewrite the entire representation.

## Core mechanism

Freeze pretrained weights W. Inject trainable low-rank updates:

**W' = W + BA** where B ∈ ℝ^{d×r}, A ∈ ℝ^{r×k}, with rank r ≪ min(d,k).

Only A and B get gradients. Memory drops sharply; you can stack multiple LoRA modules per layer for different tasks.

## What to look for in the paper

- Rank sweeps: r=4, 8, 16 often match full FT on GLUE-style tasks — until the task needs new knowledge, not style.
- Where adapters attach: attention projections (q,v) dominate quality per parameter in many reproductions.
- Merging adapters into base weights for inference — deployment story matters as much as training.

## BUILD reproduction sketch

1. Pick a small instruction dataset (500–2k examples).
2. Compare full FT vs LoRA r=8 on the same GPU budget.
3. Measure perplexity **and** task accuracy — cheap LoRA can overfit tone without improving facts.

## BUILD take

LoRA is not "free fine-tuning." It is a **controlled subspace** for steering. If your eval does not move, you need data or rank — not another epoch.`,
    published: true,
    published_at: "2026-03-12T00:00:00Z",
    created_at: "2026-03-12T00:00:00Z",
    updated_at: "2026-03-12T00:00:00Z",
  },
  {
    id: "seed-mamba",
    slug: "mamba-selective-state-spaces",
    title: "Mamba: Linear-Time Sequence Modeling with Selective State Spaces",
    authors: "Gu & Dao",
    year: 2023,
    arxiv_url: "https://arxiv.org/abs/2312.00752",
    tags: ["Sequence models", "SSM", "Efficiency"],
    is_classic: false,
    summary:
      "State-space models that select what to remember — sub-quadratic context at long horizons, with transformer-class quality on some benchmarks.",
    review_body: `## Why people cared

Transformers scale well but attention is O(n²) in sequence length. SSMs (S4, H3) offered O(n) recurrence but struggled on discrete copying tasks. Mamba makes the state transition **input-dependent** — a selective gate on what enters and leaves the hidden state.

## Intuition

Classic SSM: same linear dynamics for every token. Mamba: dynamics change per token, like content-based addressing without full attention matrices.

## Evidence to weigh

- Long-context synthetic tasks (selective copying) where prior SSMs failed.
- Language modeling perplexity competitive with small transformers at matched parameter counts — check **training FLOPs**, not just params.
- Hardware-aware parallel scan — the implementation is part of the result.

## Limits (as of the paper era)

- Ecosystem maturity vs FlashAttention transformers.
- Multimodal and tool-use stacks still transformer-centric in production.
- Scaling laws at 10B+ less settled than dense decoder-only transformers.

## BUILD take

Mamba is a bet on **long context + throughput**, not a universal transformer replacement. Prototype on your actual sequence length distribution — not LM perplexity alone.`,
    published: true,
    published_at: "2026-03-14T00:00:00Z",
    created_at: "2026-03-14T00:00:00Z",
    updated_at: "2026-03-14T00:00:00Z",
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
