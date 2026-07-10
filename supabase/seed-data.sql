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

## Core idea

**Self-attention** lets every token look at every other token in one step. Each position builds a query, key, and value vector. Attention weights are softmax(QKᵀ/√d)V — a weighted mix of values based on query–key similarity.

## What to notice when reading

- Multi-head attention is not just redundancy; different heads specialize in different relational patterns.
- Positional information is injected because attention itself is permutation-invariant.
- The encoder–decoder cross-attention pattern is what later decoder-only LLMs simplified away.

## BUILD take

Every modern LLM is a descendant of this architecture choice. When you read newer papers about MoE, RoPE, or sliding windows, you are looking at patches on this foundation — not replacements.',
  true,
  '2026-01-15T00:00:00Z'
) ON CONFLICT (slug) DO NOTHING;

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

## Key distinction

| Approach | Predicts | Risk |
|----------|----------|------|
| Generative (VAE, diffusion) | Raw observations | Spends capacity on texture |
| JEPA | Abstract embeddings | Must design good abstraction |

## Why BUILD cares

Several of our research threads — world models, latent safety, PDE surrogates — hinge on whether your latent space encodes **causal** structure or just compresses appearance. JEPA is the clearest public articulation of "predict in the right space."

## Reading tip

Do not treat this as a single architecture paper. Read it as a research agenda: hierarchical planning, self-supervised pretraining, and energy-based models as components of one stack.',
  true,
  '2026-02-01T00:00:00Z'
) ON CONFLICT (slug) DO NOTHING;

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

## Status

This is active BUILD research, not a published paper. Members on the Residual Event Tokenization thread are prototyping on synthetic physical environments first.',
  true,
  '2026-03-01T00:00:00Z'
) ON CONFLICT (slug) DO NOTHING;

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