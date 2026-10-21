import { CURRICULUM_ARTICLES, curriculumEstimate, loadCurriculumGuide } from "./curriculum";
import type { Guide, GuideSummary } from "@/lib/types";
import { loadMlArticle, ML_ARTICLES } from "./articles";

export const GUIDES: Guide[] = [
  {
    slug: "how-llms-work",
    title: "How Large Language Models Work",
    description:
      "Trace next-token training and generation, calculate a token loss, and distinguish fluent output from supported claims.",
    tags: ["LLMs", "Foundations"],
    readMinutes: 2,
    wordCount: 385,
    sections: [
      {
        type: "h2",
        text: "Start with a conditional prediction",
      },
      {
        type: "p",
        text: "A causal language model assigns a distribution to the next token given preceding tokens. A tokenizer first converts text into model-specific IDs; an embedding maps those IDs to vectors. Transformer layers update their representations, and an output projection produces logits over the vocabulary. Softmax converts logits to probabilities. This describes the autoregressive text-model setting; other language-model objectives and multimodal architectures exist. A token is not necessarily a word, so token budgets must use the intended tokenizer and prompt template.",
      },
      {
        type: "h2",
        text: "What training actually scores",
      },
      {
        type: "p",
        text: "Next-token training shifts the sequence: each position predicts the following token while a causal mask prevents access to future inputs. The target comes from the text itself, which makes the objective self-supervised. For a target assigned probability p, its loss is −ln(p). An illustrative correct-token probability of 0.25 yields about 1.386 nats, while 0.5 yields about 0.693. A batch loss averages the intended valid targets; padding and context-only positions need deliberate masking.",
      },
      {
        type: "h2",
        text: "From a base model to a response",
      },
      {
        type: "p",
        text: "A base model can undergo supervised instruction tuning and preference-based training. These stages change the behavior learned from examples and feedback; they do not create a guarantee of factual accuracy. During generation, the system selects or samples one token, appends it to the context, and repeats until a stopping condition. Greedy selection chooses the largest current probability, but need not maximize the probability of the entire generated sequence.",
      },
      {
        type: "h2",
        text: "Context, caching, and evidence",
      },
      {
        type: "p",
        text: "Key–value caching reuses attention intermediates for previous tokens during decoding. It saves repeated computation at a memory cost; it does not supply an external source of truth. Retrieval can add documents to context, and tools can return observations, but the final answer still needs to be checked against those observations. Context-window size describes a capacity limit, not a promise that every included fact will be used reliably.",
      },
      {
        type: "h2",
        text: "Try it",
      },
      {
        type: "p",
        text: "A hypothetical model gives the correct next token probabilities 0.5, 0.25, and 0.125 at three scored positions. Compute the mean negative log-likelihood and perplexity. Then explain why a low score on these three tokens would not establish that the model can answer a factual question about a newly supplied document.",
      },
      {
        type: "answer",
        text: "The losses are ln(2), ln(4), and ln(8); their mean is ln(4), about 1.386 nats. Perplexity is exp(ln(4)) = 4. This measures prediction of those tokens under that context. Document-grounded answering additionally requires evidence selection, correct interpretation, and support for the actual claims. Three scored tokens cannot establish those capabilities.",
      },
    ],
    references: [
      {
        label: "Attention Is All You Need",
        url: "https://arxiv.org/abs/1706.03762",
      },
      {
        label: "Hugging Face: Perplexity of Fixed-Length Models",
        url: "https://huggingface.co/docs/transformers/perplexity",
      },
    ],
  },
  {
    slug: "math-behind-ai",
    title: "The Math Behind AI: Shapes, Gradients, and Generalization",
    description:
      "Work through a complete gradient step and learn what matrix shapes and held-out error tell you.",
    tags: ["Math", "Foundations"],
    readMinutes: 2,
    wordCount: 373,
    sections: [
      {
        type: "h2",
        text: "Begin with shapes and units",
      },
      {
        type: "p",
        text: "For n examples with d features, let X have shape n×d, weights w have d entries, and the target y have n entries. Linear predictions Xw+b have n entries, with a scalar intercept broadcast across examples. Checking these shapes catches many errors before training. Units matter too: changing a feature from seconds to milliseconds changes the scale of its coefficient and the geometry seen by optimization.",
      },
      {
        type: "h2",
        text: "Derive one update",
      },
      {
        type: "p",
        text: "For one example, prediction z = wx+b and squared loss L = (z−y)². The chain rule gives dL/dw = 2(z−y)x and dL/db = 2(z−y). With x = 2, y = 3, w = 1, and b = 0, the prediction is two, loss is one, and gradients are −4 and −2. Plain SGD with learning rate 0.1 updates w to 1.4 and b to 0.2. The new prediction is three. This exact fit concerns one illustrative observation only.",
      },
      {
        type: "h2",
        text: "Why a gradient is not a guarantee",
      },
      {
        type: "p",
        text: "The negative gradient is a local descent direction for a differentiable objective with nonzero gradient, but a finite step can overshoot. Even the simple loss L(w)=w² becomes unstable under sufficiently large fixed steps: the update is w_new = (1−2η)w. At η = 1, the sign flips without reducing the loss; at η > 1, its magnitude grows. Neural-network objectives add nonconvexity, noisy minibatch estimates, and numerical issues. Adam also changes directions through coordinatewise adaptive scaling.",
      },
      {
        type: "h2",
        text: "Representation geometry and generalization",
      },
      {
        type: "p",
        text: "A dot product depends on both length and direction; cosine similarity normalizes by vector norms. Whether either corresponds to semantic similarity depends on the learned representation and task. Low training error does not establish performance on new examples. Keep evaluation separate from model selection, inspect residuals or error slices, and compare with a simple baseline before interpreting a more elaborate model.",
      },
      {
        type: "h2",
        text: "Try it",
      },
      {
        type: "p",
        text: "For L(w)=w² starting at w=2, calculate one SGD update with η=0.25 and another independent update with η=1.25. Compare the new losses with the starting loss. Then state the shape of XW when X is 8×3 and W is 3×2.",
      },
      {
        type: "answer",
        text: "The gradient at w=2 is four. With η=0.25, w becomes one and loss falls from four to one. With η=1.25, w becomes −3 and loss rises to nine. XW has shape 8×2. Correct dimensions establish that an operation is defined, while appropriate step size and held-out evaluation address different questions about training and generalization.",
      },
    ],
    references: [
      {
        label: "Deep Learning: Numerical Computation",
        url: "https://www.deeplearningbook.org/contents/numerical.html",
      },
      {
        label: "Deep Learning: Deep Feedforward Networks",
        url: "https://www.deeplearningbook.org/contents/mlp.html",
      },
    ],
  },
  {
    slug: "what-is-attention",
    title: "What Is Attention?",
    description:
      "Calculate an attention-weighted output and understand scaling, masks, and the limits of attention maps.",
    tags: ["Transformers", "Attention"],
    readMinutes: 2,
    wordCount: 335,
    sections: [
      {
        type: "h2",
        text: "Queries compare keys and combine values",
      },
      {
        type: "p",
        text: "An attention head compares each query with keys, normalizes the scores into weights, and uses those weights to combine value vectors. For query matrix Q and key matrix K, scaled dot-product scores are QKᵀ/√d_k. Apply any attention mask before softmax, then multiply the resulting weights by V. With n queries and m keys, the weight matrix has shape n×m. The output has one value-sized vector per query.",
      },
      {
        type: "h2",
        text: "A calculation you can inspect",
      },
      {
        type: "p",
        text: "Suppose one query has already-scaled scores [0, ln(3)] against two keys. Exponentiation gives [1,3], so softmax weights are [0.25,0.75]. With value vectors v1=(2,0) and v2=(0,4), the output is 0.25v1+0.75v2=(0.5,3). These numbers are illustrative; in a learned head, projections produce the queries, keys, and values from the input representations.",
      },
      {
        type: "h2",
        text: "Scaling and masks have specific jobs",
      },
      {
        type: "p",
        text: "The square-root scaling controls dot-product magnitude under assumptions about coordinate scale; it does not guarantee well-behaved scores for every distribution. A causal mask blocks later positions when predicting a next token. A padding mask excludes artificial sequence positions. Self-attention means queries, keys, and values originate from the same sequence, but each position can attend only to positions allowed by its masks. Cross-attention obtains queries and key/value inputs from different sequences.",
      },
      {
        type: "h2",
        text: "What a picture of weights cannot prove",
      },
      {
        type: "p",
        text: "Multiple heads learn different projections and combine their outputs. A visually striking attention map does not by itself explain the final prediction or establish causal importance: values, residual paths, and later layers also contribute. To investigate a claim about an attended token, define an intervention and compare behavior while considering that masking or replacement can create an unusual input.",
      },
      {
        type: "h2",
        text: "Try it",
      },
      {
        type: "p",
        text: "Use scores [ln(2),0] and scalar values [3,9]. Calculate the normalized weights and output. Now mask the second key before softmax and recompute. Describe the problem with masking every key for one query without defining a special handling rule.",
      },
      {
        type: "answer",
        text: "The weights are [2/3,1/3], giving output five. Masking the second key leaves weight one on the first, giving output three. A row with all scores masked to negative infinity has no ordinary normalized probability distribution and can produce undefined arithmetic. Implementations need an explicit safe policy; it should not silently introduce future-token access.",
      },
    ],
    references: [
      {
        label: "Attention Is All You Need",
        url: "https://arxiv.org/abs/1706.03762",
      },
    ],
  },
  {
    slug: "what-is-jepa",
    title: "What Is a JEPA?",
    description:
      "Understand prediction in embedding space, representation collapse, and what downstream evaluation must establish.",
    tags: ["World models", "JEPA", "Self-supervised learning"],
    readMinutes: 2,
    wordCount: 370,
    sections: [
      {
        type: "h2",
        text: "Predict a representation of a target",
      },
      {
        type: "p",
        text: "A joint-embedding predictive architecture learns to predict a target representation from a context representation, often with information describing the target location. The target may be a missing region of an image or a future part of a sequence. JEPA therefore does not always mean future prediction. Its defining choice is to compare learned representations instead of requiring the predictor to reproduce every raw pixel or sample.",
      },
      {
        type: "h2",
        text: "A conceptual training path",
      },
      {
        type: "p",
        text: "A context encoder maps visible input to a context embedding. A target encoder maps the target region to a target embedding, and a predictor tries to match it from context. Training details matter: I-JEPA uses an architecture and masking strategy designed for image representation learning, with a target encoder updated through a moving average and stopped gradients on the target side. Other predictive embedding methods can use different objectives and stabilization mechanisms.",
      },
      {
        type: "h2",
        text: "Why low prediction error is insufficient",
      },
      {
        type: "p",
        text: "If both encoders return the same constant vector for every input, prediction becomes trivial while the representation carries no useful distinctions. This is representation collapse. Architectural asymmetry, target updates, masking, and other method-specific controls are intended to avoid degenerate solutions, but the actual trained representation still requires evaluation. Predicting an embedding does not automatically make it a sufficient statistic, a causal state, or a representation suitable for planning.",
      },
      {
        type: "h2",
        text: "Test the property you actually need",
      },
      {
        type: "p",
        text: "A frozen-encoder probe tests whether a chosen predictor can extract useful information under a fixed protocol. Retrieval and transfer tests ask other questions. A world-model claim needs additional evidence about dynamics, interventions, or planning beyond image classification. Compare appropriate baselines with matched data and budgets, and record the exact encoder, target construction, evaluation splits, and seeds. A useful result in one setting should retain that scope.",
      },
      {
        type: "h2",
        text: "Try it",
      },
      {
        type: "p",
        text: "Imagine two encoders: A always outputs (1,1), while B produces varied vectors. A achieves nearly zero target-prediction loss. Is A necessarily better? Name one direct collapse diagnostic and one downstream comparison that would help assess whether either representation is useful.",
      },
      {
        type: "answer",
        text: "A can achieve a trivial loss because all targets are identical, so the loss alone cannot rank useful representations. Inspect per-dimension variation or representation rank across diverse inputs as a collapse diagnostic. Then compare frozen-encoder probes under the same labeled data and evaluation protocol. Variation alone is also insufficient: random embeddings can vary without encoding the desired information.",
      },
    ],
    references: [
      {
        label:
          "Self-Supervised Learning from Images with a Joint-Embedding Predictive Architecture",
        url: "https://arxiv.org/abs/2301.08243",
      },
    ],
  },
  {
    slug: "physics-informed-nns",
    title: "Physics-Informed Neural Networks",
    description:
      "Construct a differential-equation residual, check a known solution, and separate training loss from numerical accuracy.",
    tags: ["Physics ML", "PINNs", "PDEs"],
    readMinutes: 2,
    wordCount: 329,
    sections: [
      {
        type: "h2",
        text: "Put a governing equation into the objective",
      },
      {
        type: "p",
        text: "A physics-informed neural network represents an unknown field with a neural function and penalizes disagreement with a specified differential equation. Automatic differentiation can compute derivatives with respect to coordinates. The objective may include interior residuals, boundary conditions, initial conditions, and observed data, each with explicit weights. This encodes an assumption about the governing physics; it does not guarantee that optimization finds the correct solution.",
      },
      {
        type: "h2",
        text: "An equation with a checkable answer",
      },
      {
        type: "p",
        text: "Consider u′(x)+u(x)=0 on [0,1] with u(0)=1. The exact solution is exp(−x). A neural approximation uθ has residual rθ(x)=uθ′(x)+uθ(x). An illustrative objective averages rθ(x)² at collocation points and adds λ(uθ(0)−1)². The constant function u=1 satisfies the boundary but has residual one everywhere. The function u=0 has zero residual but violates the boundary. Both terms are needed to distinguish these cases.",
      },
      {
        type: "h2",
        text: "Sampling and scaling can change the result",
      },
      {
        type: "p",
        text: "A small residual at sampled coordinates is not a uniform error bound over the domain. Unsampled regions can fail, and terms with different units or scales can dominate optimization. Nondimensionalization, collocation design, and loss weighting need justification. Evaluate residuals at independent points and compare the predicted field with an analytical solution or a validated numerical reference whenever available.",
      },
      {
        type: "h2",
        text: "Choose a fair baseline",
      },
      {
        type: "p",
        text: "PINNs can be useful candidates for some inverse or data-constrained problems, but sparse observations alone do not establish an advantage. Classical solvers and parameter-estimation methods may be more accurate or cheaper. Compare error, boundary violations, runtime, and sensitivity to initialization under the same problem definition. Stiffness, multiple scales, incorrect equations, and optimization failure remain possible. A forward-solution benchmark does not automatically establish inverse-problem identifiability.",
      },
      {
        type: "h2",
        text: "Try it",
      },
      {
        type: "p",
        text: "For the equation above, test candidate u(x)=1−x. Calculate its derivative, residual, boundary error, and residual at x=0.5. Then explain what goes wrong if the only residual collocation point is x=0.",
      },
      {
        type: "answer",
        text: "The derivative is −1, residual is −x, and boundary error is zero. At x=0.5 the residual is −0.5, whose square is 0.25. Sampling only x=0 produces zero sampled residual despite an incorrect solution elsewhere. Independent evaluation across the domain reveals the failure; a low training objective at one point would not establish numerical validity.",
      },
    ],
    references: [
      {
        label: "Physics Informed Deep Learning: PINNs",
        url: "https://maziarraissi.github.io/PINNs/",
      },
    ],
  },
  {
    slug: "paper-to-prototype",
    title: "From Paper to a Reproducible Experiment",
    description:
      "Turn one paper claim into a bounded protocol, preserve failures, and decide what the evidence supports.",
    tags: ["Research process", "Prototyping"],
    readMinutes: 2,
    wordCount: 372,
    sections: [
      {
        type: "h2",
        text: "Extract a claim before writing code",
      },
      {
        type: "p",
        text: "Begin with a specific statement from a paper: which method changes what outcome, on which data, compared with which baseline? Record the version of the paper and locate the table, figure, or experiment supporting it. Separate a claim made by the authors from your own proposed extension. A reproduction asks whether a defined result can be recovered; an extension asks a new question and needs its own comparison.",
      },
      {
        type: "h2",
        text: "Freeze the smallest informative protocol",
      },
      {
        type: "p",
        text: "Write the dataset version, split rules, preprocessing, metric, tuning budget, randomization plan, and failure criteria. Choose a baseline that can plausibly compete. Specify what you will inspect during development and which outcomes remain protected until the procedure is fixed. Synthetic data can check shapes or a known identity, but passing that check does not reproduce an empirical finding on the paper’s data.",
      },
      {
        type: "h2",
        text: "Make the experiment reconstructable",
      },
      {
        type: "p",
        text: "Retain source revision, environment versions, configuration, input hashes or immutable dataset identifiers, commands, logs, and raw outputs. Record failed attempts as well as successful ones. A seed helps document randomness but cannot by itself guarantee determinism across kernels and hardware. When exact reproduction is infeasible, describe the mismatch and limit the conclusion instead of silently substituting an easier task.",
      },
      {
        type: "h2",
        text: "Interpret results against the original question",
      },
      {
        type: "p",
        text: "Suppose a paper reports a benefit under scarce labels. Recovering a gain only with abundant labels is a different result. It may motivate further work, but the original condition remains unsupported. Report uncertainty across the planned experimental units and compare resource use. If the experiment fails, distinguish implementation failure, unavailable dependencies, inconclusive evidence, and evidence against the claim; these states imply different next actions.",
      },
      {
        type: "h2",
        text: "Try it",
      },
      {
        type: "p",
        text: "Draft a reproduction plan for a hypothetical paper claiming a two-point gain over a baseline on a fixed dataset. You can afford four matched runs. Specify the primary metric, run pairing, retained artifacts, and what happens if one run crashes. Then decide whether copying the same result directory to another folder counts as independent reproduction.",
      },
      {
        type: "answer",
        text: "A useful plan fixes the comparison and all four runs before examining protected outcomes, preserves per-run predictions and logs, and defines the failure treatment in advance. The exact metric must match the task rather than be invented from the headline. Copying files verifies neither execution nor independence. Independent reproduction requires an actual separate attempt with documented provenance and enough separation to support that claim.",
      },
    ],
    references: [
      {
        label: "The Machine Learning Reproducibility Checklist",
        url: "https://www.cs.mcgill.ca/~jpineau/ReproducibilityChecklist.pdf",
      },
      {
        label: "PyTorch: Reproducibility",
        url: "https://docs.pytorch.org/docs/main/notes/randomness.html",
      },
    ],
  },
];

const catalog: GuideSummary[] = [
  ...ML_ARTICLES.map(curriculumEstimate),
  ...CURRICULUM_ARTICLES,
  ...GUIDES.map(({ sections: _sections, ...summary }) => ({
    ...summary,
    track: "Reference essays",
  })),
];

export async function getGuide(slug: string): Promise<Guide | undefined> {
  const original = GUIDES.find((g) => g.slug === slug) ?? (await loadMlArticle(slug));
  return loadCurriculumGuide(slug, original);
}

export function getGuideSummary(slug: string): GuideSummary | undefined {
  return catalog.find((guide) => guide.slug === slug);
}

export function getAllGuides(): GuideSummary[] {
  return catalog;
}
