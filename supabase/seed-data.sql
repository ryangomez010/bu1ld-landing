-- BUILD platform seed data (idempotent — safe to re-run)
BEGIN;

INSERT INTO public.events (slug, title, summary, location, start_date, end_date, topics, prep_notes, resources, deadlines, url, published)
VALUES (
  'neurips-2026',
  'NeurIPS 2026',
  'The flagship machine learning conference. Strong venue for world models, scaling laws, and systems papers.',
  'Sydney, Australia',
  '2026-12-06',
  '2026-12-12',
  ARRAY['Deep learning', 'World models', 'Theory', 'Systems']::text[],
  'Start with a crisp problem statement and a single strong baseline. NeurIPS reviewers reward honest limitations sections. If you are targeting the main track, line up internal reads 6–8 weeks before the abstract deadline.',
  '[{"label":"NeurIPS paper template (LaTeX)","url":"https://media.neurips.cc/Conferences/NeurIPS2024/Styles/neurips_2024.sty","kind":"latex"},{"label":"Overleaf NeurIPS template","url":"https://www.overleaf.com/latex/templates/neurips-2024/tpsbbrdqcmsh","kind":"template"},{"label":"Official conference site","url":"https://neurips.cc","kind":"other"}]'::jsonb,
  '[{"label":"Abstract deadline","date":"2026-05-15"},{"label":"Full paper deadline","date":"2026-05-22"},{"label":"Author notification","date":"2026-09-18"},{"label":"Camera-ready","date":"2026-10-23"}]'::jsonb,
  'https://neurips.cc',
  true
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.events (slug, title, summary, location, start_date, end_date, topics, prep_notes, resources, deadlines, url, published)
VALUES (
  'icml-2026',
  'ICML 2026',
  'International Conference on Machine Learning — broad ML with strong optimization and theory presence.',
  'Seoul, South Korea',
  '2026-07-06',
  '2026-07-12',
  ARRAY['Optimization', 'RL', 'Generative models', 'Probabilistic ML']::text[],
  'ICML favors clear empirical protocols. Reproducibility checklist matters. Workshop submissions are a good way to test ideas before the main conference cycle.',
  '[{"label":"ICML LaTeX style files","url":"https://icml.cc/Conferences/2025/StyleAuthorInstructions","kind":"latex"},{"label":"OpenReview ICML","url":"https://openreview.net/group?id=ICML.cc","kind":"cfp"}]'::jsonb,
  '[{"label":"Abstract deadline","date":"2026-01-28"},{"label":"Full paper deadline","date":"2026-02-04"},{"label":"Author notification","date":"2026-04-30"}]'::jsonb,
  'https://icml.cc',
  true
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.events (slug, title, summary, location, start_date, end_date, topics, prep_notes, resources, deadlines, url, published)
VALUES (
  'build-summit-2026-q3',
  'The Bu1ld Summit — Q3 2026',
  'Internal showcase: research threads, startup demos, and builder networking across the membership pool.',
  'Distributed / Stanford hub',
  '2026-09-20',
  '2026-09-21',
  ARRAY['BUILD community', 'Startups', 'Research threads']::text[],
  'Members presenting prototypes should prepare a 5-minute demo and one slide on what broke. This is a shipping checkpoint, not a poster session.',
  '[{"label":"BUILD Discord","url":"https://discord.gg/NG4QYat4P","kind":"other"}]'::jsonb,
  '[{"label":"Demo submission","date":"2026-09-01"}]'::jsonb,
  NULL,
  true
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.papers (slug, title, authors, year, arxiv_url, tags, is_classic, summary, review_body, published, published_at)
VALUES (
  'attention-is-all-you-need',
  'Attention Is All You Need',
  'Vaswani et al.',
  2017,
  'https://arxiv.org/abs/1706.03762',
  ARRAY['Transformers', 'Attention', 'Foundations']::text[],
  true,
  'The paper that made self-attention the default interface for sequence modeling.',
  '## Why it still matters

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
3. Read Section 3.2 on multi-head — map each head''s weights on a real sentence using a small pretrained model.

## BUILD take

Every modern LLM is a descendant of this architecture choice. When you read MoE, RoPE, or sliding-window papers, you are reading patches on this foundation — not replacements. Our threads on long-context world models usually fail or succeed based on whether the patch preserves the **relational** inductive bias attention gives you.',
  true,
  '2026-01-15T00:00:00Z'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  authors = EXCLUDED.authors,
  year = EXCLUDED.year,
  arxiv_url = EXCLUDED.arxiv_url,
  tags = EXCLUDED.tags,
  is_classic = EXCLUDED.is_classic,
  summary = EXCLUDED.summary,
  review_body = EXCLUDED.review_body,
  published = EXCLUDED.published,
  published_at = EXCLUDED.published_at,
  updated_at = now();

INSERT INTO public.papers (slug, title, authors, year, arxiv_url, tags, is_classic, summary, review_body, published, published_at)
VALUES (
  'lecun-jepa-world-models',
  'A Path Towards Autonomous Machine Intelligence (JEPA)',
  'Yann LeCun',
  2022,
  'https://arxiv.org/abs/2206.08808',
  ARRAY['World models', 'JEPA', 'Self-supervised learning']::text[],
  true,
  'LeCun''s blueprint for learning abstract world models without reconstructing pixels.',
  '## The problem LeCun is solving

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

Ask on every world-model prototype: *what is the embedding trained to ignore?* If the answer is "nothing," you are back in pixel reconstruction land.',
  true,
  '2026-02-01T00:00:00Z'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  authors = EXCLUDED.authors,
  year = EXCLUDED.year,
  arxiv_url = EXCLUDED.arxiv_url,
  tags = EXCLUDED.tags,
  is_classic = EXCLUDED.is_classic,
  summary = EXCLUDED.summary,
  review_body = EXCLUDED.review_body,
  published = EXCLUDED.published,
  published_at = EXCLUDED.published_at,
  updated_at = now();

INSERT INTO public.papers (slug, title, authors, year, arxiv_url, tags, is_classic, summary, review_body, published, published_at)
VALUES (
  'residual-event-tokenization',
  'Residual Event Tokenization (BUILD thread)',
  'The Bu1ld research collective',
  2026,
  NULL,
  ARRAY['Tokenization', 'World models', 'BUILD original']::text[],
  false,
  'Internal research direction: encode surprise, not every frame.',
  '## The intuition

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

If you cannot explain what your tokenizer throws away, you do not have a tokenizer — you have a compressor.',
  true,
  '2026-03-01T00:00:00Z'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  authors = EXCLUDED.authors,
  year = EXCLUDED.year,
  arxiv_url = EXCLUDED.arxiv_url,
  tags = EXCLUDED.tags,
  is_classic = EXCLUDED.is_classic,
  summary = EXCLUDED.summary,
  review_body = EXCLUDED.review_body,
  published = EXCLUDED.published,
  published_at = EXCLUDED.published_at,
  updated_at = now();

INSERT INTO public.papers (slug, title, authors, year, arxiv_url, tags, is_classic, summary, review_body, published, published_at)
VALUES (
  'chinchilla-scaling-laws',
  'Training Compute-Optimal Large Language Models (Chinchilla)',
  'Hoffmann et al.',
  2022,
  'https://arxiv.org/abs/2203.15556',
  ARRAY['Scaling', 'LLMs', 'Foundations']::text[],
  true,
  'Most big models were under-trained. Chinchilla showed how to spend compute between parameters and tokens — and changed the scaling conversation overnight.',
  '## The headline result

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

When a startup says "we need a bigger model," ask for their token budget and data repeat count. Under-training is still the silent killer in fine-tunes — not just pretraining.',
  true,
  '2026-02-15T00:00:00Z'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  authors = EXCLUDED.authors,
  year = EXCLUDED.year,
  arxiv_url = EXCLUDED.arxiv_url,
  tags = EXCLUDED.tags,
  is_classic = EXCLUDED.is_classic,
  summary = EXCLUDED.summary,
  review_body = EXCLUDED.review_body,
  published = EXCLUDED.published,
  published_at = EXCLUDED.published_at,
  updated_at = now();

INSERT INTO public.papers (slug, title, authors, year, arxiv_url, tags, is_classic, summary, review_body, published, published_at)
VALUES (
  'direct-preference-optimization',
  'Direct Preference Optimization (DPO)',
  'Rafailov et al.',
  2023,
  'https://arxiv.org/abs/2305.18290',
  ARRAY['Alignment', 'LLMs', 'RLHF']::text[],
  false,
  'Skip the RL loop — optimize preferences with a simple classification-style loss on paired outputs.',
  '## What problem this solves

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

Most member projects should start with SFT + light DPO on **small, curated** preference sets — not full RL stacks. If alignment fails, fix the pairs before touching the optimizer.',
  true,
  '2026-03-10T00:00:00Z'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  authors = EXCLUDED.authors,
  year = EXCLUDED.year,
  arxiv_url = EXCLUDED.arxiv_url,
  tags = EXCLUDED.tags,
  is_classic = EXCLUDED.is_classic,
  summary = EXCLUDED.summary,
  review_body = EXCLUDED.review_body,
  published = EXCLUDED.published,
  published_at = EXCLUDED.published_at,
  updated_at = now();

INSERT INTO public.papers (slug, title, authors, year, arxiv_url, tags, is_classic, summary, review_body, published, published_at)
VALUES (
  'lora-low-rank-adaptation',
  'LoRA: Low-Rank Adaptation of Large Language Models',
  'Hu et al.',
  2021,
  'https://arxiv.org/abs/2106.09685',
  ARRAY['Fine-tuning', 'Efficiency', 'LLMs']::text[],
  true,
  'Train tiny adapter matrices instead of full weights — the default trick for customizing big models on small GPUs.',
  '## The problem

Full fine-tuning a 7B+ model needs memory for optimizer states on every parameter. Most teams only need to steer behavior on a narrow domain — not rewrite the entire representation.

## Core mechanism

Freeze pretrained weights W. Inject trainable low-rank updates:

**W'' = W + BA** where B ∈ ℝ^{d×r}, A ∈ ℝ^{r×k}, with rank r ≪ min(d,k).

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

LoRA is not "free fine-tuning." It is a **controlled subspace** for steering. If your eval does not move, you need data or rank — not another epoch.',
  true,
  '2026-03-12T00:00:00Z'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  authors = EXCLUDED.authors,
  year = EXCLUDED.year,
  arxiv_url = EXCLUDED.arxiv_url,
  tags = EXCLUDED.tags,
  is_classic = EXCLUDED.is_classic,
  summary = EXCLUDED.summary,
  review_body = EXCLUDED.review_body,
  published = EXCLUDED.published,
  published_at = EXCLUDED.published_at,
  updated_at = now();

INSERT INTO public.papers (slug, title, authors, year, arxiv_url, tags, is_classic, summary, review_body, published, published_at)
VALUES (
  'mamba-selective-state-spaces',
  'Mamba: Linear-Time Sequence Modeling with Selective State Spaces',
  'Gu & Dao',
  2023,
  'https://arxiv.org/abs/2312.00752',
  ARRAY['Sequence models', 'SSM', 'Efficiency']::text[],
  false,
  'State-space models that select what to remember — sub-quadratic context at long horizons, with transformer-class quality on some benchmarks.',
  '## Why people cared

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

Mamba is a bet on **long context + throughput**, not a universal transformer replacement. Prototype on your actual sequence length distribution — not LM perplexity alone.',
  true,
  '2026-03-14T00:00:00Z'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  authors = EXCLUDED.authors,
  year = EXCLUDED.year,
  arxiv_url = EXCLUDED.arxiv_url,
  tags = EXCLUDED.tags,
  is_classic = EXCLUDED.is_classic,
  summary = EXCLUDED.summary,
  review_body = EXCLUDED.review_body,
  published = EXCLUDED.published,
  published_at = EXCLUDED.published_at,
  updated_at = now();

INSERT INTO public.newsletter_issues (slug, title, issue_number, summary, body, published, published_at)
VALUES (
  'issue-12-march-2026',
  'BUILD Digest #12 — March 2026',
  12,
  'NeurIPS deadlines on the horizon, new startup spinout, and three papers worth your weekend.',
  '## This month at BUILD

**Eigen Δ** closed a research milestone: delta-trained specialization in under 4 hours on a single A100 for a 7B base. Demo at the Q3 summit.

**Counterfactual Defect Worlds** thread added two new builders from MIT. They are building a synthetic defect injection suite for video world models.

## Paper picks

1. *Attention Is All You Need* — if you have not read it in five years, read it again. Notice what did not make it into GPT.
2. LeCun''s JEPA position paper — essential context for our world-model threads.
3. A fresh surrogate-model failure analysis from the PINN community — we will publish a full review soon.

## Events radar

- ICML 2026 full paper deadline: **Feb 4** (passed — workshop track still open)
- NeurIPS 2026 abstract: **May 15** — start internal reads now
- BUILD Summit Q3: demo submissions due **Sep 1**

## Startup spotlight

**Colorworld** shipped brand-token export to Figma. First paying design teams onboarding this month.

---

*Reply in Discord #digest with what you want covered next issue.*',
  true,
  '2026-03-01T00:00:00Z'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.newsletter_issues (slug, title, issue_number, summary, body, published, published_at)
VALUES (
  'issue-11-february-2026',
  'BUILD Digest #11 — February 2026',
  11,
  'Fellowship applications open, physics ML reading group, and ICML deadline week.',
  '## Fellowship

Research Fellowship (6-month track) is accepting applications through March 15. Co-advised placements with UC and Stanford collaborators.

## Reading group

Physics-informed neural networks — Thursdays 18:00 UTC on Discord. First session covers when PINNs beat classical solvers (and when they silently fail).

## Deadlines

ICML full paper deadline this week. Good luck to everyone submitting.

## New members

Welcome to 14 new builders who joined the membership pool in January.',
  true,
  '2026-02-01T00:00:00Z'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.projects (slug, title, description, type, status, skills_needed, tags, lead_name, capacity, team_count, published, discord_url)
VALUES (
  'counterfactual-defect-worlds',
  'Counterfactual Defect Worlds',
  'Probing how generative world models reason about broken, perturbed, and out-of-distribution environments. We inject controlled defects into synthetic scenes and study whether models can detect, localize, and recover from structural failures — not just texture noise.',
  'research',
  'open',
  ARRAY['PyTorch', 'Computer vision', 'World models', 'Python']::text[],
  ARRAY['World models', 'Robustness', 'Synthetic data']::text[],
  'Ryan Gomez',
  6,
  2,
  true,
  'https://discord.gg/NG4QYat4P'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.projects (slug, title, description, type, status, skills_needed, tags, lead_name, capacity, team_count, published, discord_url)
VALUES (
  'residual-event-tokenization',
  'Residual Event Tokenization',
  'Build a tokenization scheme that encodes only residual, surprise-bearing events from continuous streams. Target: compress video and sensor trajectories without losing causal signal. Prototype on synthetic physics environments first.',
  'research',
  'open',
  ARRAY['Sequence modeling', 'PyTorch', 'Signal processing']::text[],
  ARRAY['Tokenization', 'World models', 'Compression']::text[],
  'BUILD Research',
  4,
  1,
  true,
  NULL
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.projects (slug, title, description, type, status, skills_needed, tags, lead_name, capacity, team_count, published, discord_url)
VALUES (
  'neurocad',
  'NeuroCad — Text to CAD',
  'Natural language to manufacturable CAD assemblies with a learned mechanical prior. Looking for engineers who can ship inference pipelines and understand geometry constraints. Startup track — equity conversation for core contributors.',
  'startup',
  'open',
  ARRAY['CAD', 'LLMs', '3D geometry', 'Inference']::text[],
  ARRAY['Startups', 'Generative models', 'Manufacturing']::text[],
  'NeuroCad team',
  3,
  2,
  true,
  NULL
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.projects (slug, title, description, type, status, skills_needed, tags, lead_name, capacity, team_count, published, discord_url)
VALUES (
  'ai-builder-cohort-q2',
  'AI Builder Cohort — Q2 2026',
  '12-week project-driven cohort: ship a production ML system end to end, from paper reading to deployed inference. You pick a thread, we pressure-test it weekly, you demo at the end. Rolling admission.',
  'program',
  'open',
  ARRAY['Python', 'ML fundamentals', 'Shipping mindset']::text[],
  ARRAY['Cohort', 'Programs', 'Production ML']::text[],
  'BUILD Programs',
  20,
  8,
  true,
  NULL
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.projects (slug, title, description, type, status, skills_needed, tags, lead_name, capacity, team_count, published, discord_url)
VALUES (
  'pde-surrogate-phase-transitions',
  'PDE Surrogate Phase Transitions',
  'Track representation phase transitions in neural PDE surrogates as they scale. Goal: predict where a surrogate will silently break before it fails on held-out physics. Collaboration with UC Physics ML group.',
  'research',
  'active',
  ARRAY['Physics ML', 'PDEs', 'PyTorch', 'Scientific computing']::text[],
  ARRAY['Physics ML', 'PINNs', 'Scaling']::text[],
  'UC Physics PhD',
  5,
  3,
  true,
  NULL
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.projects (slug, title, description, type, status, skills_needed, tags, lead_name, capacity, team_count, published, discord_url)
VALUES (
  'latent-safety-recovery',
  'Latent Safety & Recovery',
  'Completed research thread: studied whether models can detect confident wrongness and recover via self-consistency. Alumni portfolio — read the paper review and reach out if you want to extend the line.',
  'research',
  'closed',
  ARRAY['Evaluation', 'World models', 'Safety']::text[],
  ARRAY['Safety', 'Alumni', 'World models']::text[],
  'BUILD Research',
  4,
  4,
  true,
  NULL
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.jobs (slug, title, company, location, source, employment_type, description, url, tags, published)
VALUES (
  'research-fellowship-2026',
  'Research Fellowship',
  'The Bu1ld',
  'Distributed',
  'internal',
  'Fellowship · 6 months',
  'Co-advised research with academic collaborators, targeting strong venue submissions and clean open-source reference code. Selective — apply through the fellowship project track or email ryan@thebu1ld.com.',
  NULL,
  ARRAY['Research', 'Fellowship', 'BUILD']::text[],
  true
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.jobs (slug, title, company, location, source, employment_type, description, url, tags, published)
VALUES (
  'neurocad-ml-engineer',
  'ML Engineer (Founding)',
  'NeuroCad',
  'SF / Remote',
  'internal',
  'Full-time',
  'Founding ML engineer for text-to-CAD startup spun out of BUILD. Own the inference stack, model evaluation, and geometry validation pipeline.',
  'mailto:ryan@thebu1ld.com',
  ARRAY['Startup', 'ML Engineer', '3D']::text[],
  true
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.jobs (slug, title, company, location, source, employment_type, description, url, tags, published)
VALUES (
  'deepmind-research-engineer',
  'Research Engineer',
  'DeepMind',
  'London',
  'external',
  'Full-time',
  'Curated external role — research engineering on large-scale training infrastructure. Strong BUILD fit for members with systems + ML depth.',
  'https://deepmind.google/careers/',
  ARRAY['External', 'Research engineer', 'Systems']::text[],
  true
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.jobs (slug, title, company, location, source, employment_type, description, url, tags, published)
VALUES (
  'anthropic-safety-research',
  'Research Scientist — Safety',
  'Anthropic',
  'SF / NYC / Remote',
  'external',
  'Full-time',
  'External listing relevant to BUILD members interested in latent safety, alignment, and evaluation of capable models.',
  'https://www.anthropic.com/careers',
  ARRAY['External', 'Safety', 'Research']::text[],
  true
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.announcements (title, body, href, pinned, published, created_at)
SELECT
  'This week in ML',
  'World models are having a moment — ICLR deadlines are stacking, and several BUILD threads are probing defect injection and latent recovery. Worth reading the JEPA guide if you''re joining a world-model project.',
  '/guides/what-is-jepa',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.announcements WHERE title = 'This week in ML'
);

COMMIT;