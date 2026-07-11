import type { Guide } from "@/lib/types";

export const GUIDES: Guide[] = [
  {
    slug: "how-llms-work",
    title: "How Large Language Models Work",
    description:
      "Tokenization, pretraining objective, and inference loop — the baseline vocabulary before reading scaling-law or alignment papers.",
    readMinutes: 14,
    tags: ["LLMs", "Foundations"],
    sections: [
      {
        type: "p",
        text: "A large language model is a function that takes a sequence of tokens and outputs a probability distribution over the next token. Everything else — chat, agents, code generation — is built on top of that single primitive repeated autoregressively.",
      },
      { type: "h2", text: "Tokens are the input" },
      {
        type: "p",
        text: "Raw text is split into tokens (subword pieces). 'Understanding' in an LLM means statistical patterns over token sequences, not symbols grounded in the world unless additional training or tooling provides that grounding.",
      },
      {
        type: "diagram",
        title: "Autoregressive loop",
        lines: [
          "Prompt tokens  →  [Transformer]  →  P(next token)",
          "                         ↑                    │",
          "                         └──── append ────────┘",
        ],
      },
      { type: "h2", text: "Training objective" },
      {
        type: "p",
        text: "During pretraining, the model sees billions of tokens and is trained to minimize cross-entropy loss: predict the next token given all previous tokens. This is self-supervised — no human labels required for the base model.",
      },
      {
        type: "list",
        items: [
          "Pretraining builds broad language + world knowledge (imperfect).",
          "Supervised fine-tuning (SFT) teaches instruction following.",
          "RLHF / preference optimization shapes helpfulness and safety.",
        ],
      },
      { type: "h2", text: "Inference" },
      {
        type: "p",
        text: "At inference time you sample or greedily pick from the output distribution, append the token, and repeat. Context length limits how far back attention can look. KV caching makes this efficient by storing past key/value pairs.",
      },
      {
        type: "callout",
        text: "The Bu1ld take: when a project 'uses an LLM,' ask whether they need pretraining-scale data, fine-tuning, or just prompting + retrieval. Most products are the last one.",
      },
    ],
  },
  {
    slug: "math-behind-ai",
    title: "The Math Behind AI (Oversimplified)",
    description:
      "Loss landscapes, gradient descent, and why high-dimensional optimization behaves unlike 2D plots — prerequisite for reading training-instability papers.",
    readMinutes: 12,
    tags: ["Math", "Foundations"],
    sections: [
      {
        type: "p",
        text: "Modern ML is applied calculus and linear algebra at scale. You do not need to derive backprop by hand, but you do need intuition for what optimization is doing when training fails or generalization breaks.",
      },
      { type: "h2", text: "Loss and gradients" },
      {
        type: "p",
        text: "A loss function scores how wrong your model is. Training moves parameters in the direction that reduces loss — the negative gradient. Stochastic gradient descent (SGD) and Adam are just rules for how big a step to take.",
      },
      {
        type: "diagram",
        title: "Loss landscape (intuition)",
        lines: [
          "        high loss",
          "           ∩",
          "          / \\     ← saddle / sharp minima",
          "         /   \\",
          "  low loss     global-ish minimum",
        ],
      },
      { type: "h2", text: "Linear algebra intuition" },
      {
        type: "p",
        text: "Neural networks are chains of matrix multiplications and nonlinearities. Attention is batched matrix multiply + softmax. Embeddings live in high-dimensional space where semantic similarity ≈ cosine distance.",
      },
      { type: "h2", text: "Generalization" },
      {
        type: "p",
        text: "Low training loss does not imply good test performance. Overfitting memorizes; underfitting misses structure. Regularization, data diversity, and architecture choices shift the tradeoff.",
      },
      {
        type: "callout",
        text: "When a paper review mentions 'intrinsic dimension' or 'curvature,' they are talking about the shape of these representation spaces — not abstract math for its own sake.",
      },
    ],
  },
  {
    slug: "what-is-attention",
    title: "What Is Attention?",
    description:
      "Scaled dot-product attention step by step — the mechanism behind every transformer block, with notation matched to the Attention Is All You Need review.",
    readMinutes: 10,
    tags: ["Transformers", "Attention"],
    sections: [
      {
        type: "p",
        text: "Attention is a differentiable lookup: given a query, compare against keys, weight values, and sum. Self-attention means queries, keys, and values all come from the same sequence — each position attends to all positions.",
      },
      { type: "h2", text: "Q, K, V" },
      {
        type: "list",
        items: [
          "Query: what am I looking for?",
          "Key: what do I contain?",
          "Value: what information do I pass if matched?",
        ],
      },
      {
        type: "p",
        text: "Weights = softmax(QKᵀ / √d). The scaling prevents dot products from growing too large and saturating softmax. Multi-head attention runs several attention operations in parallel with different learned projections.",
      },
      {
        type: "diagram",
        title: "One attention head",
        lines: [
          "X  →  Wq, Wk, Wv  →  Q, K, V",
          "scores = Q × Kᵀ",
          "weights = softmax(scores)",
          "output = weights × V",
        ],
      },
      {
        type: "callout",
        text: "Read 'Attention Is All You Need' after this guide — you will recognize every component immediately.",
      },
    ],
  },
  {
    slug: "what-is-jepa",
    title: "What Is a JEPA?",
    description:
      "Representation-space prediction vs pixel reconstruction — the architecture thesis behind several open world-model projects at The Bu1ld.",
    readMinutes: 11,
    tags: ["World models", "JEPA", "LeCun"],
    sections: [
      {
        type: "p",
        text: "A JEPA learns abstract representations of the world and predicts future representations — not raw pixels or waveforms. The hypothesis: planning and reasoning need semantic state, not texture reconstruction.",
      },
      { type: "h2", text: "Generative vs joint-embedding" },
      {
        type: "list",
        items: [
          "Generative models: predict x̂ from context — can waste capacity on irrelevant detail.",
          "JEPA: predict ẑ (embedding) from context — forces abstract sufficient statistics.",
        ],
      },
      { type: "h2", text: "Why it matters here" },
      {
        type: "p",
        text: "Our world-model and latent-safety threads ask whether latents encode causal structure. JEPA is the clearest articulation of that design goal at architecture level. It connects to I-JEPA, V-JEPA, and ongoing work on video world models.",
      },
      {
        type: "callout",
        text: "JEPA is a research direction, not a single shipped model. Treat it as a lens for reading papers, not a drop-in API.",
      },
    ],
  },
  {
    slug: "physics-informed-nns",
    title: "Physics-Informed Neural Networks",
    description:
      "PDE residuals in the loss vs classical solvers — when PINNs help with sparse boundary data and when they fail on stiff multi-scale systems.",
    readMinutes: 13,
    tags: ["Physics ML", "PINNs", "PDEs"],
    sections: [
      {
        type: "p",
        text: "A physics-informed neural network (PINN) trains a neural net to satisfy both data constraints and a differential equation residual. The PDE becomes part of the loss function — not just the training data.",
      },
      { type: "h2", text: "The loss has two parts" },
      {
        type: "list",
        items: [
          "Data loss: match observed boundary / initial conditions.",
          "Physics loss: PDE residual should be near zero inside the domain.",
        ],
      },
      {
        type: "diagram",
        title: "PINN training",
        lines: ["L = L_data + λ · L_PDE", "L_PDE = mean(|N[u] - f|²)  over collocation points"],
      },
      { type: "h2", text: "When they work" },
      {
        type: "p",
        text: "PINNs shine when data is sparse but the governing equations are known — inverse problems, parameter discovery, fast surrogate screening. They struggle when equations are wrong, stiff, or multi-scale without careful sampling.",
      },
      {
        type: "callout",
        text: "Our PDE surrogate thread tracks representation phase transitions — where the learned surrogate looks fine on metrics but fails catastrophically off-distribution.",
      },
    ],
  },
  {
    slug: "paper-to-prototype",
    title: "From Paper to Prototype",
    description:
      "Read → isolate one falsifiable claim → smallest experiment → ship code or kill the idea — the weekly loop project leads expect in application pitches.",
    readMinutes: 9,
    tags: ["Research process", "Prototyping"],
    sections: [
      {
        type: "p",
        text: "The Bu1ld is not a reading group. Papers are fuel for prototypes. The default loop: read → identify one falsifiable claim → build the smallest experiment that tests it → publish code or kill the idea fast.",
      },
      { type: "h2", text: "The Monday-to-Friday loop" },
      {
        type: "list",
        items: [
          "Monday: paper + collective skim, pick one figure or table to reproduce.",
          "Midweek: minimal implementation — synthetic data first, real data second.",
          "Friday: demo or postmortem. No demo = write why it failed.",
        ],
      },
      { type: "h2", text: "What we optimize for" },
      {
        type: "p",
        text: "Scientific honesty and engineering rigor at once. A beautiful idea that breaks on edge cases is still valuable if the failure mode is documented. That is how threads become startups — or get cut before they waste a quarter.",
      },
      {
        type: "callout",
        text: "When you join an open project, expect this pace. If you want slow certainty, academia has that. If you want hype without code, Twitter has that. We sit in the middle.",
      },
    ],
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

export function getAllGuides(): Guide[] {
  return GUIDES;
}
