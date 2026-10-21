export type ResearchKind = "idea" | "study" | "report" | "paper";
export type ResearchStage = "idea" | "scoping" | "experiment" | "review" | "published" | "archived";

/** Exact clean source revision used to recover the original public 33-line atlas. */
export const RESEARCH_ATLAS_SOURCE_REVISION = "a5464067d3f154f306d7e3d11d66edcda3e347ef";

export type ResearchPortfolioItem = {
  slug: string;
  title: string;
  summary: string;
  kind: ResearchKind;
  stage: ResearchStage;
  tags: string[];
  publicStatus: string;
  evidenceBoundary: string;
  repositoryUrl?: string;
  portfolioRecordId?: string;
  featured?: boolean;
  parentSlug?: string;
};

/**
 * Canonical public research lines only. Duplicate archives, shadow worktrees,
 * empty shells, and generated registry children are deliberately not counted
 * as independent projects.
 */
export const PUBLIC_RESEARCH_PORTFOLIO: ResearchPortfolioItem[] = [
  {
    slug: "what-survived-the-search-navier-stokes",
    title: "Navier–Stokes Extremal Search",
    summary:
      "A falsification-first search for persistent extreme flows, with matched random controls and strict numerical refinement.",
    kind: "report",
    stage: "review",
    tags: ["Scientific ML", "Fluid dynamics", "Negative results"],
    publicStatus: "Executed study · negative result",
    evidenceBoundary:
      "The completed screen promoted no candidate and does not establish blow-up or a new extreme-flow family.",
    featured: true,
  },
  {
    slug: "neurocad",
    title: "NeuroCAD",
    summary:
      "A verification-first prompt-to-parametric-program workflow for editable, testable CAD artifacts.",
    kind: "study",
    stage: "experiment",
    tags: ["Applied AI", "CAD", "Geometry"],
    publicStatus: "Alpha research prototype",
    evidenceBoundary:
      "The bounded compiler path is reproducible; open-world language, physics, and manufacturing validation remain open.",
    repositoryUrl: "https://github.com/THE-BU1LD/NeuroCAD",
    portfolioRecordId: "neurocad",
    featured: true,
  },
  {
    slug: "siderea-transient-jepa",
    title: "SIDEREA",
    summary:
      "A human-supervised astronomical discovery pipeline combining transient triage with representation-learning research.",
    kind: "study",
    stage: "experiment",
    tags: ["Space intelligence", "JEPA", "Astronomy"],
    publicStatus: "Research alpha · shadow only",
    evidenceBoundary:
      "Core components are tested, but prospective real-sky validation and a complete broker-to-report campaign are still required.",
    repositoryUrl: "https://github.com/build-the-future-11/IRIS-Space",
    featured: true,
  },
  {
    slug: "counterfactual-defect-worlds",
    title: "Counterfactual Defect Worlds",
    summary:
      "Controlled defect worlds for testing whether learned systems detect, localize, and recover from broken causal structure.",
    kind: "study",
    stage: "experiment",
    tags: ["World models", "Robustness", "Scientific ML"],
    publicStatus: "Executed pilots · mixed evidence",
    evidenceBoundary:
      "The implementation is substantial, while retained studies remain mixed or negative and do not support a blanket success claim.",
    featured: true,
  },
  {
    slug: "adaptive-theory-geometry",
    title: "Adaptive Theory Geometry",
    summary:
      "A closed-loop study of geometry-aware experiment selection under model misspecification and natural-data falsification.",
    kind: "report",
    stage: "review",
    tags: ["Scientific ML", "Active learning", "Geometry"],
    publicStatus: "Executed study · negative / mixed",
    evidenceBoundary:
      "The public atlas retains a negative/mixed selection result. Historical manuscript, illustration, and experiment identities still need reconciliation before quantitative claims can be reused.",
    portfolioRecordId: "atg",
    featured: true,
  },
  {
    slug: "causal-memory-use",
    title: "Causal Memory Use",
    summary:
      "Diagnostics for whether a model actually uses supplied memory, including controlled interventions and naturalistic transfer checks.",
    kind: "report",
    stage: "review",
    tags: ["Memory", "Evaluation", "Causality"],
    publicStatus: "Controlled evidence retained",
    evidenceBoundary:
      "The controlled diagnostic is strong; a key naturalistic exchangeability assumption fails and limits transfer claims.",
  },
  {
    slug: "assumption-integrity",
    title: "Assumption Integrity Under Distribution Shift",
    summary:
      "Tests whether model-selection assumptions survive synthetic and natural distribution shifts.",
    kind: "report",
    stage: "review",
    tags: ["Robustness", "Distribution shift", "Evaluation"],
    publicStatus: "Executed study · adverse natural result",
    evidenceBoundary:
      "The natural-data result is adverse and has not been independently reproduced.",
  },
  {
    slug: "fabric-induced-memory",
    title: "Fabric-Induced Memory",
    summary:
      "Structured latent memory dynamics for long-horizon sequence modeling, retrieval, decay, and persistent traces.",
    kind: "report",
    stage: "review",
    tags: ["Memory", "Sequence modeling", "Dynamical systems"],
    publicStatus: "Frozen component study · negative",
    evidenceBoundary:
      "The retained study does not show blanket superiority; a baseline wins part of the compact benchmark.",
    repositoryUrl: "https://github.com/THE-BU1LD/Fabric-Induced-Memory",
  },
  {
    slug: "gaussian-memory-fields",
    title: "Gaussian Memory Fields",
    summary:
      "A mechanism study of differentiable memory fields, write dynamics, and long-horizon retrieval.",
    kind: "report",
    stage: "review",
    tags: ["Memory", "Mechanistic evaluation", "Sequence modeling"],
    publicStatus: "Executed study · negative",
    evidenceBoundary:
      "The primary hypothesis failed correction and the original write mechanism showed zero write-token gradient.",
    repositoryUrl: "https://github.com/THE-BU1LD/GaussianMemory",
  },
  {
    slug: "ngmt-robust-memory",
    title: "NGMT Robust Memory",
    summary:
      "Tests whether Student-t influence weighting improves forecasting recovery beyond a Student-t output distribution.",
    kind: "report",
    stage: "review",
    tags: ["Memory", "Forecasting", "Robust statistics"],
    publicStatus: "Recovery study · null",
    evidenceBoundary:
      "The predefined improvement criterion was not met, and older overwritten mechanism artifacts remain compromised.",
  },
  {
    slug: "neural-predictive-memory-spectroscopy",
    title: "Neural Predictive Memory Spectroscopy",
    summary:
      "A controlled framework for measuring memory transfer, failure profiles, and intervention sensitivity across systems.",
    kind: "study",
    stage: "experiment",
    tags: ["Memory", "Evaluation", "Language models"],
    publicStatus: "Controlled transfer supported",
    evidenceBoundary:
      "Synthetic transfer gates pass; accepted LoCoMo and LongMemEval confirmatory evidence is still absent.",
    portfolioRecordId: "npms",
  },
  {
    slug: "ripii-world-models",
    title: "RIPII World Models",
    summary:
      "Object-state world modeling with multiresolution dynamics, conditional routing, and exact-resume evaluation.",
    kind: "report",
    stage: "review",
    tags: ["World models", "Object state", "Multiresolution"],
    publicStatus: "Executed pilots · no advance",
    evidenceBoundary:
      "Controlled pilots did not advance the benchmark; conditional routing remains experimental.",
    repositoryUrl: "https://github.com/THE-BU1LD/RIPII",
    portfolioRecordId: "ripii-ipii",
  },
  {
    slug: "eigen-jepa",
    title: "Eigen-JEPA",
    summary:
      "Joint-embedding predictive modeling for market representations across a real multi-asset panel.",
    kind: "report",
    stage: "review",
    tags: ["JEPA", "Finance", "Representation learning"],
    publicStatus: "Real-panel study · mostly null",
    evidenceBoundary:
      "The retained real-panel comparisons are mostly null and the paper-facing single-seed path fails the rigor gate.",
    repositoryUrl: "https://github.com/Finance-Meta-Research/Eigen-JEPA",
    portfolioRecordId: "eigen-jepa",
  },
  {
    slug: "fi-jepa",
    title: "FI-JEPA",
    summary:
      "A macroeconomic representation-learning study comparing joint-embedding prediction with simple forecasting baselines.",
    kind: "report",
    stage: "review",
    tags: ["JEPA", "Economics", "Forecasting"],
    publicStatus: "Development study · negative",
    evidenceBoundary:
      "The retained development study underperforms ridge and persistence baselines.",
    repositoryUrl: "https://github.com/Finance-Meta-Research/FI-JEPA",
  },
  {
    slug: "lam-jepa",
    title: "LAM-JEPA",
    summary:
      "Latent-action predictive modeling for educational reasoning, tutoring, and intervention selection.",
    kind: "report",
    stage: "review",
    tags: ["JEPA", "Education", "Reasoning"],
    publicStatus: "Frozen external validation · negative",
    evidenceBoundary:
      "The current ARC validation loses to the supervised baseline and shows codebook collapse.",
    repositoryUrl: "https://github.com/vertex-studyAI/LAM-JEPA",
  },
  {
    slug: "weather-jepa",
    title: "Weather-JEPA",
    summary:
      "A predictive representation pipeline for weather fields, designed around staged synthetic and ERA5 validation.",
    kind: "study",
    stage: "scoping",
    tags: ["JEPA", "Weather", "Scientific ML"],
    publicStatus: "Stage 0 · synthetic pipeline",
    evidenceBoundary:
      "The engineering path runs on synthetic data; ERA5 science and external validation have not started.",
  },
  {
    slug: "pde-surrogate-phase-transitions",
    title: "Dynamical Representation Phase Transitions",
    summary:
      "A study of whether representation changes can warn when neural PDE surrogates will fail outside training regimes.",
    kind: "study",
    stage: "experiment",
    tags: ["Scientific ML", "PDEs", "Representation learning"],
    publicStatus: "Prototype · active study",
    evidenceBoundary:
      "Finite smoke runs and phase feedback exist; a scientific phase-transition result has not been established.",
  },
  {
    slug: "residual-event-tokenization",
    title: "Residual Event Tokenization",
    summary:
      "Event-centered tokenization that spends representation budget on changes and surprise in continuous streams.",
    kind: "study",
    stage: "experiment",
    tags: ["Tokenization", "Compression", "World models"],
    publicStatus: "Working prototype",
    evidenceBoundary:
      "Train and evaluation paths exist, but there is no frozen paper-grade multi-seed result ledger yet.",
  },
  {
    slug: "epu-omega",
    title: "EPU-Ω∞",
    summary:
      "An efficient processing and retrieval architecture explored through a retained digit-level benchmark.",
    kind: "study",
    stage: "experiment",
    tags: ["Systems", "Retrieval", "Efficient intelligence"],
    publicStatus: "Research prototype",
    evidenceBoundary:
      "A retained benchmark exists, while hardware and deployment claims remain untested.",
    repositoryUrl: "https://github.com/THE-BU1LD/EPU",
  },
  {
    slug: "eigenfinance",
    title: "EigenFinance",
    summary:
      "A walk-forward research evaluator for financial hypotheses, data identity, and held-out market testing.",
    kind: "study",
    stage: "scoping",
    tags: ["Finance", "Evaluation", "Time series"],
    publicStatus: "Engineering complete · science not started",
    evidenceBoundary:
      "The evaluator is implemented, but no retained licensed real-market result supports a performance claim.",
    repositoryUrl: "https://github.com/Finance-Meta-Research/EigenFinance",
    portfolioRecordId: "eigen-finance",
  },
  {
    slug: "colorworld",
    title: "ColorWorld",
    summary:
      "A learned color-grading and palette system spanning aligned grades, image/video inference, and LUT export.",
    kind: "study",
    stage: "experiment",
    tags: ["Applied AI", "Computer vision", "Generative tools"],
    publicStatus: "Product research prototype",
    evidenceBoundary:
      "The pipeline and synthetic demo run; production weights and production validation are absent.",
  },
  {
    slug: "olympus-cognitive-architecture",
    title: "OLYMPUS Cognitive Architecture",
    summary:
      "A modular cognitive architecture and model-family foundry for testing memory, planning, and reconstruction ideas.",
    kind: "study",
    stage: "experiment",
    tags: ["Agents", "Cognitive architecture", "Systems"],
    publicStatus: "Engineering foundry · science T0/T1",
    evidenceBoundary:
      "Demos and software exist; current ledgers do not authorize model-family promotion or autonomous-agent claims.",
    portfolioRecordId: "olympus",
  },
  {
    slug: "ris-bounded-hessian-study",
    title: "RIS Bounded Hessian Study",
    summary:
      "A bounded numerical study of logistic Hessian behavior and finite-difference agreement on WDBC.",
    kind: "study",
    stage: "experiment",
    tags: ["Optimization", "Numerical methods", "Evaluation"],
    publicStatus: "Numerical prototype",
    evidenceBoundary:
      "The current result is numerical-only and does not support the earlier broader interpretation.",
    repositoryUrl: "https://github.com/build-the-future-11/RIS",
  },
  {
    slug: "scdmit",
    title: "SCDMIT",
    summary:
      "A large experimental codebase exploring structured dynamics and memory-inspired learning systems.",
    kind: "study",
    stage: "scoping",
    tags: ["Memory", "Dynamical systems", "Research tooling"],
    publicStatus: "Prototype · evidence ledger incomplete",
    evidenceBoundary:
      "The implementation surface is larger than the retained claim-bearing evidence; no broad result is public.",
  },
  {
    slug: "sapir-whorf-latent-language",
    title: "Sapir–Whorf and the Latent Tongue",
    summary:
      "Tools and experiments for asking how language priors shape internal representation geometry.",
    kind: "study",
    stage: "scoping",
    tags: ["Language", "Representation learning", "Geometry"],
    publicStatus: "Research toolkit",
    evidenceBoundary:
      "A toolkit exists, while canonical real-model evidence and a frozen result ledger remain unverified.",
  },
  {
    slug: "speechly",
    title: "Speechly",
    summary:
      "A callable speech and language experimentation pipeline with disclosed heuristic components.",
    kind: "study",
    stage: "scoping",
    tags: ["Speech", "Language", "Applied AI"],
    publicStatus: "Prototype / demo",
    evidenceBoundary:
      "The pipeline runs, but there is no trained-checkpoint evidence ledger supporting performance claims.",
  },
  {
    slug: "apen-synthica",
    title: "APEN / Synthica",
    summary:
      "A portfolio of adaptive prediction experiments and synthetic research packages with retained gate outcomes.",
    kind: "report",
    stage: "review",
    tags: ["Foundry", "Prediction", "Synthetic studies"],
    publicStatus: "Portfolio · negative / partial",
    evidenceBoundary:
      "APEN studies fail their gates and the Synthica packages are not independent submission-ready studies.",
    portfolioRecordId: "apen-pen",
  },
  {
    slug: "project-2424",
    title: "Project 2424",
    summary:
      "A registry and quality-gate control plane for a large research-idea portfolio with explicit implementation classes.",
    kind: "idea",
    stage: "scoping",
    tags: ["Foundry", "Research operations", "Evaluation"],
    publicStatus: "Registry + selected implementations",
    evidenceBoundary:
      "The registry contains 2,424 records, but only a small classified subset is executable research; the portfolio remains release-rejected.",
  },
  {
    slug: "independent-research-foundry",
    title: "Independent Research Foundry",
    summary:
      "A 64-direction screening foundry for turning broad research ideas into bounded, testable protocols.",
    kind: "idea",
    stage: "scoping",
    tags: ["Foundry", "Research operations", "Screening"],
    publicStatus: "Stage-1 screens",
    evidenceBoundary:
      "The 64 names are screens and specifications, not 64 papers or submission-ready studies.",
  },
  {
    slug: "ml4science-portfolio",
    title: "ML4Science Portfolio",
    summary:
      "A mechanism-led scientific ML portfolio spanning eight families and four externally framed proposals.",
    kind: "idea",
    stage: "scoping",
    tags: ["Foundry", "Scientific ML", "Mechanisms"],
    publicStatus: "Audited hypothesis portfolio",
    evidenceBoundary:
      "The externally framed proposals fail advancement gates; the portfolio is not a set of validated discoveries.",
  },
  {
    slug: "ml4industry-portfolio",
    title: "ML4Industry Portfolio",
    summary:
      "A 64-identity industrial ML foundry for scoping task-native studies and deployment questions.",
    kind: "idea",
    stage: "scoping",
    tags: ["Foundry", "Industry", "Applied AI"],
    publicStatus: "Shared scaffolds + small external subset",
    evidenceBoundary:
      "Most identities share scaffolding; synthetic demonstrations are not industrial proof.",
  },
  {
    slug: "ml4semantic-intelligence",
    title: "ML4SemanticIntelligence",
    summary:
      "A semantic-intelligence idea portfolio with diagnostics, specifications, and a small external subset.",
    kind: "idea",
    stage: "scoping",
    tags: ["Foundry", "Semantics", "Language"],
    publicStatus: "Predominantly specification-only",
    evidenceBoundary:
      "Most entries remain specification-only and none is currently conference-ready.",
  },
  {
    slug: "ml-invention-foundry",
    title: "MLInvention Foundry",
    summary:
      "A 64-proxy invention foundry with three promoted domains and explicit promotion gates.",
    kind: "report",
    stage: "review",
    tags: ["Foundry", "Invention", "Evaluation"],
    publicStatus: "Three promoted lanes · negative / inconclusive",
    evidenceBoundary:
      "The foundry is operational, but the promoted lanes do not support a positive research claim.",
  },
  {
    slug: "krylov-jepa",
    title: "Spectral Krylov-JEPA",
    summary:
      "A controlled study of operator-informed predictive representations and classical spectral baselines for synthetic quantum systems.",
    kind: "report",
    stage: "review",
    tags: ["JEPA", "Spectral methods", "Scientific ML"],
    publicStatus: "Public baseline audit · no advantage established",
    evidenceBoundary:
      "The retained audit favors simple spectral controls in important comparisons. Pipeline checks do not establish a Krylov pretraining or few-shot transfer advantage.",
    repositoryUrl: "https://github.com/build-the-future-11/Kyrlov-JEPA",
  },
  {
    slug: "spectral-jepa",
    title: "Spectral JEPA",
    summary:
      "A proposed research direction asking whether spectral structure improves predictive representations of scientific and dynamical systems.",
    kind: "idea",
    stage: "scoping",
    tags: ["JEPA", "Spectral methods", "Scientific ML"],
    publicStatus: "Research direction · identity reconciliation open",
    evidenceBoundary:
      "This public seed record has no verified independent result. Its relationship to Spectral Krylov-JEPA is unresolved; it is not counted as another evaluated study or merged with financial Eigen-JEPA.",
  },
  {
    slug: "quantized-adaptive-transformers",
    title: "Quantized Adaptive Transformers",
    summary:
      "A research brief on adaptation under limited numerical precision and compute, with quality, latency, and memory considered together.",
    kind: "idea",
    stage: "scoping",
    tags: ["Transformers", "Quantization", "Efficient ML"],
    publicStatus: "Research brief · evaluation unverified",
    evidenceBoundary:
      "The public description establishes the question, not an implemented precision policy, benchmark result, or performance improvement.",
  },
  {
    slug: "mahjong",
    title: "Mahjong",
    summary:
      "A research direction on decision-making and uncertainty in a partially observed combinatorial game.",
    kind: "idea",
    stage: "scoping",
    tags: ["Reinforcement learning", "Decision making", "Game AI"],
    publicStatus: "Research brief · environment unverified",
    evidenceBoundary:
      "The ruleset, environment implementation, opponents, and evaluation protocol are not established by the public record. No solved-game or competitive-strength claim is made.",
  },
  {
    slug: "latent-safety-recovery",
    title: "Latent Safety & Recovery",
    summary:
      "An archived public research thread asking whether models can detect confident errors and recover through self-consistency.",
    kind: "study",
    stage: "archived",
    tags: ["Safety", "Evaluation", "World models"],
    publicStatus: "Archived thread · results not independently verified",
    evidenceBoundary:
      "The existing public catalog marks this thread closed. A retained paper, result artifact, and reproducible comparison have not been verified for this page.",
  },
  {
    slug: "space-jepa",
    title: "Space JEPA 2",
    summary:
      "SIDEREA's shadow-only predictive-representation subproject for irregular astronomical light curves, with time-aware provenance and entity-disjoint evaluation controls.",
    kind: "study",
    stage: "experiment",
    tags: ["JEPA", "Astronomy", "Representation learning"],
    publicStatus: "SIDEREA subproject · engineering only",
    evidenceBoundary:
      "The public implementation report has no genuine model-ready time-series input with point-in-time availability. Synthetic examples establish execution, not improved recall, calibration, workload, or discovery yield.",
    repositoryUrl: "https://github.com/build-the-future-11/IRIS-Space",
    parentSlug: "siderea-transient-jepa",
  },
  {
    slug: "iris-robust-memory",
    title: "IRIS Robust Recurrent Memory",
    summary:
      "A retained robust-memory mechanism study with mixed/negative development evidence and unresolved canonical trajectory provenance.",
    kind: "report",
    stage: "archived",
    tags: ["Memory", "Robust statistics", "Negative results"],
    publicStatus: "Closed evidence line · confirmation blocked",
    evidenceBoundary:
      "The learned mechanism did not clear strong-control or persistent-shift gates. Protected confirmation remains unopened while canonical raw-trajectory provenance is unresolved. This is separate from SIDEREA's astronomy work.",
    repositoryUrl: "https://github.com/build-the-future-11/IRIS",
  },
];

export function getResearchPortfolioItem(slug: string): ResearchPortfolioItem | undefined {
  return PUBLIC_RESEARCH_PORTFOLIO.find((item) => item.slug === slug);
}

export function getResearchRecordClassification(
  project: ResearchPortfolioItem,
): "project" | "subproject" | "collection" | "unresolved direction" {
  if (project.parentSlug) return "subproject";
  if (project.slug === "spectral-jepa") return "unresolved direction";
  if (project.tags.includes("Foundry") && project.slug !== "apen-synthica") return "collection";
  return "project";
}

export function getResearchAtlasCounts() {
  return {
    records: PUBLIC_RESEARCH_PORTFOLIO.length,
    projects: PUBLIC_RESEARCH_PORTFOLIO.filter(
      (project) => getResearchRecordClassification(project) === "project",
    ).length,
    subprojects: PUBLIC_RESEARCH_PORTFOLIO.filter(
      (project) => getResearchRecordClassification(project) === "subproject",
    ).length,
    collections: PUBLIC_RESEARCH_PORTFOLIO.filter(
      (project) => getResearchRecordClassification(project) === "collection",
    ).length,
    unresolvedDirections: PUBLIC_RESEARCH_PORTFOLIO.filter(
      (project) => getResearchRecordClassification(project) === "unresolved direction",
    ).length,
  };
}

export function getResearchForPortfolioRecord(recordId: string): ResearchPortfolioItem[] {
  return PUBLIC_RESEARCH_PORTFOLIO.filter((item) => item.portfolioRecordId === recordId);
}

export type ResearchBrief = {
  question: string;
  method: string;
  evaluation: string;
  nextStep: string;
  interpretation?: string;
  owner: string;
  reviewedAt: string;
  evidenceDate: string | null;
  publication: string;
  recruitment: string;
  aliases: string[];
  prerequisiteLessons: string[];
  sources: Array<{ label: string; url?: string }>;
};

/** Specific public preparation routes; these do not imply placement prerequisites or approval. */
const RESEARCH_PREREQUISITES: Record<string, string[]> = {
  "what-survived-the-search-navier-stokes": [
    "ml-pde-boundary-contracts",
    "ml-paired-run-comparisons",
    "ml-negative-results",
  ],
  neurocad: [
    "ml-research-environments-tests",
    "ml-agent-tool-contracts",
    "ml-simulation-robotics-limits",
  ],
  "siderea-transient-jepa": [
    "ml-scientific-data-provenance",
    "ml-astronomy-candidate-validation",
    "ml-calibration",
  ],
  "counterfactual-defect-worlds": [
    "ml-latent-dynamics-rollouts",
    "ml-ablation-studies",
    "ml-simulation-robotics-limits",
  ],
  "adaptive-theory-geometry": [
    "ml-falsifiable-hypotheses",
    "ml-cross-validation",
    "ml-paired-run-comparisons",
  ],
  "causal-memory-use": [
    "ml-causal-memory-interventions",
    "ml-ablation-studies",
    "ml-paired-run-comparisons",
  ],
  "assumption-integrity": [
    "ml-cross-validation",
    "ml-calibration",
    "ml-scientific-data-provenance",
  ],
  "fabric-induced-memory": [
    "ml-latent-dynamics-rollouts",
    "ml-causal-memory-interventions",
    "ml-ablation-studies",
  ],
  "gaussian-memory-fields": ["ml-backpropagation", "ml-training-debugging", "ml-ablation-studies"],
  "ngmt-robust-memory": [
    "ml-calibration",
    "ml-causal-memory-interventions",
    "ml-paired-run-comparisons",
  ],
  "neural-predictive-memory-spectroscopy": [
    "ml-causal-memory-interventions",
    "ml-paired-run-comparisons",
    "ml-data-pipeline-contracts",
  ],
  "ripii-world-models": [
    "ml-latent-dynamics-rollouts",
    "ml-simulation-robotics-limits",
    "ml-research-environments-tests",
  ],
  "eigen-jepa": [
    "ml-jepa-targets-collapse",
    "ml-scientific-data-provenance",
    "ml-cross-validation",
  ],
  "fi-jepa": ["ml-linear-regression", "ml-scientific-data-provenance", "ml-cross-validation"],
  "lam-jepa": ["ml-jepa-targets-collapse", "ml-attention-masks", "ml-paired-run-comparisons"],
  "weather-jepa": [
    "ml-weather-time-baselines",
    "ml-scientific-data-provenance",
    "ml-jepa-targets-collapse",
  ],
  "pde-surrogate-phase-transitions": [
    "ml-pde-boundary-contracts",
    "ml-neural-operators",
    "ml-surrogate-stability-shift",
  ],
  "residual-event-tokenization": [
    "ml-tokenization",
    "ml-latent-dynamics-rollouts",
    "ml-ablation-studies",
  ],
  "epu-omega": ["ml-quantization", "ml-inference-batching", "ml-paired-run-comparisons"],
  eigenfinance: [
    "ml-scientific-data-provenance",
    "ml-cross-validation",
    "ml-paired-run-comparisons",
  ],
  colorworld: ["ml-autoencoders", "ml-data-pipeline-contracts", "ml-calibration"],
  "olympus-cognitive-architecture": [
    "ml-agent-tool-contracts",
    "ml-kv-cache",
    "ml-ablation-studies",
  ],
  "ris-bounded-hessian-study": [
    "ml-gradient-descent",
    "ml-numpy-shape-contracts",
    "ml-paired-run-comparisons",
  ],
  scdmit: ["ml-training-debugging", "ml-latent-dynamics-rollouts", "ml-negative-results"],
  "sapir-whorf-latent-language": [
    "ml-language-model-objectives",
    "ml-contrastive-learning",
    "ml-paired-run-comparisons",
  ],
  speechly: ["ml-language-model-objectives", "ml-data-pipeline-contracts", "ml-calibration"],
  "apen-synthica": ["ml-neural-operators", "ml-ablation-studies", "ml-paired-run-comparisons"],
  "project-2424": [
    "ml-falsifiable-hypotheses",
    "ml-research-environments-tests",
    "ml-negative-results",
  ],
  "independent-research-foundry": [
    "ml-falsifiable-hypotheses",
    "ml-ablation-studies",
    "ml-negative-results",
  ],
  "ml4science-portfolio": [
    "ml-scientific-data-provenance",
    "ml-neural-operators",
    "ml-falsifiable-hypotheses",
  ],
  "ml4industry-portfolio": [
    "ml-data-pipeline-contracts",
    "ml-cross-validation",
    "ml-inference-batching",
  ],
  "ml4semantic-intelligence": [
    "ml-language-model-objectives",
    "ml-retrieval-augmented-generation",
    "ml-falsifiable-hypotheses",
  ],
  "ml-invention-foundry": [
    "ml-falsifiable-hypotheses",
    "ml-paired-run-comparisons",
    "ml-negative-results",
  ],
  "krylov-jepa": [
    "ml-vectors-matrices",
    "ml-dot-products",
    "ml-jepa-targets-collapse",
    "ml-paired-run-comparisons",
  ],
  "spectral-jepa": ["ml-vectors-matrices", "ml-jepa-targets-collapse", "ml-falsifiable-hypotheses"],
  "quantized-adaptive-transformers": ["ml-quantization", "ml-lora", "ml-paired-run-comparisons"],
  mahjong: [
    "ml-mdp-return-contracts",
    "ml-value-policy-iteration",
    "ml-exploration-offline-evaluation",
  ],
  "latent-safety-recovery": [
    "ml-calibration",
    "ml-causal-memory-interventions",
    "ml-negative-results",
  ],
  "space-jepa": [
    "ml-scientific-data-provenance",
    "ml-astronomy-candidate-validation",
    "ml-jepa-targets-collapse",
  ],
  "iris-robust-memory": [
    "ml-causal-memory-interventions",
    "ml-paired-run-comparisons",
    "ml-scientific-data-provenance",
  ],
};

type BriefContent = Pick<ResearchBrief, "question" | "method" | "evaluation" | "nextStep"> &
  Partial<ResearchBrief>;

/** Editorial depth for the same canonical records, never a second project registry. */
const RESEARCH_BRIEFS: Record<string, BriefContent> = {
  "what-survived-the-search-navier-stokes": {
    question:
      "Can a search find persistent extreme flows that survive both random controls and numerical refinement? A transient peak alone can be a numerical artifact or an ordinary outcome of the search budget.",
    method:
      "The public record describes a falsification-first candidate screen. Candidate flows are compared with matched random controls and subjected to refinement before promotion.",
    evaluation:
      "The retained study promoted no candidate. The atlas does not provide the numerical grid, seed-level table, or complete raw artifact package, so this page reports the disposition without inventing a quantitative benchmark.",
    nextStep:
      "Make the retained screening protocol and refinement receipts publicly reviewable before proposing a separately frozen successor.",
  },
  neurocad: {
    question:
      "How can a language request become an editable parametric design whose accepted constraints can be checked? A plausible picture does not establish geometry, units, or a usable manufacturing artifact.",
    method:
      "The public implementation separates conversational planning from compilation. An accepted plan passes through a versioned, schema-validated internal representation to deterministic OpenSCAD, with exported lengths in millimetres. SCAD and JSON outputs remain editable; compiled validation and STL export require OpenSCAD.",
    evaluation:
      "The public README distinguishes the original terminal mixed compiler study, a separate controlled Physics v2 study, and Physics v3 engineering work with scientific validation still open. The released v0.5.0a6 alpha has installation checks; those checks establish a software distribution boundary, not physical fit or an independent engineering assessment.",
    interpretation:
      "Parsing a supported prompt, validating its intermediate representation, compiling a solid, and checking a real fabricated part are different tests. Analytical physics and tolerance estimates use disclosed idealized assumptions. Concept drafts still need qualified review before fabrication; no load-capacity, material, safety, or manufacturability guarantee follows from successful export.",
    nextStep:
      "Complete independently authored prompt evaluation and physical or external validation with retained failure cases. A bounded contribution is an authorized geometry regression case with expected units, constraints, and rejection behavior.",
    owner: "THE-BU1LD / NeuroCAD",
    aliases: ["NeuroCad"],
    publication: "Public alpha v0.5.0a6; research acceptance not verified",
    sources: [
      {
        label: "Public NeuroCAD README · implementation and evidence boundary",
        url: "https://github.com/THE-BU1LD/NeuroCAD",
      },
    ],
  },
  "siderea-transient-jepa": {
    question:
      "How can astronomical observations become a useful queue for human follow-up without mistaking additional candidates for confirmed discoveries? Candidate selection must remain distinct from astrophysical confirmation.",
    method:
      "The public software descends from I SPY optical-transient scripts. It combines typed candidate records, survey/filter-aware light-curve features, explainable ranking, fail-closed catalogue checks, and immutable review/outcome ledgers. Statistical template evidence and JEPA representations remain separate evidence channels; a model score cannot bypass a catalogue or human-review gate.",
    evaluation:
      "The public research-alpha scope is local CSV analysis and shadow experiments. A prospective live broker-to-report validation campaign has not completed. The integrated synthetic walkthrough tests provenance, physical-entity separation, frozen cutoffs, and finite-budget queue selection; it does not validate astronomical discovery performance.",
    interpretation:
      "The public README identifies SIDEREA as the software, I SPY as the precursor, and IRIS as the conference for which a paper is prepared. Space JEPA 2 is a shadow-only subproject. The separate IRIS robust-memory repository is a different research identity. No candidate multiplier is treated as confirmed discovery yield, and no conference acceptance is inferred.",
    nextStep:
      "Validate a prospective campaign using survey photometry with observation and availability times, documented population shifts, human adjudication, and separate candidate/discovery outcomes. No unattended external-report submission is implemented.",
    owner: "build-the-future-11 / IRIS-Space",
    aliases: ["I SPY (precursor)", "IRIS-Space (repository)"],
    sources: [
      {
        label: "Public SIDEREA README · lineage, pipeline, and maturity",
        url: "https://github.com/build-the-future-11/IRIS-Space",
      },
    ],
  },
  "counterfactual-defect-worlds": {
    question:
      "Can a world model identify and recover from broken causal structure rather than simply notice a visual texture change?",
    method:
      "The public project record proposes controlled structural defects in synthetic scenes and separate detection, localization, and recovery checks.",
    evaluation:
      "Executed pilots are retained as mixed or negative. The public atlas does not establish a broad robustness improvement, a real-world transfer result, or a fully specified common benchmark.",
    nextStep:
      "Expose the permitted defect definitions and matched unmodified controls, keeping detection, localization, and recovery outcomes separate.",
  },
  "adaptive-theory-geometry": {
    question:
      "Can the geometry of competing theories help select an informative experiment when the candidate models are misspecified? Recovering a geometric representation and choosing a better experiment are separate claims.",
    method:
      "The public atlas describes a closed-loop model-discrimination and experiment-selection study. The canonical portfolio profile also records a mathematical manuscript and synthetic benchmark lineage; those source identities need reconciliation before their numerical outputs are combined.",
    evaluation:
      "The atlas retains a negative/mixed selection disposition. The source review does not authorize reusing historical numerical figures as newly verified results. No table is reproduced here without a complete claim-to-artifact mapping.",
    interpretation:
      "Synthetic demonstrations, mathematical results within explicit assumptions, and natural-data selection performance answer different questions. A favorable illustration cannot resolve missing experimental provenance, and an unfavorable selection result does not negate a conditional theorem.",
    nextStep:
      "Reconcile the manuscript, source revision, exact comparison policy, natural-data split, and retained outcome artifacts before making a quantitative claim.",
    aliases: ["ATG"],
  },
  "causal-memory-use": {
    question:
      "Does a model use the supplied memory to change its answer, or does it merely receive memory while relying on another shortcut?",
    method:
      "Controlled interventions vary memory while testing the response. Naturalistic transfer checks ask whether the assumptions supporting those comparisons still hold outside the controlled setup.",
    evaluation:
      "The public record supports a controlled diagnostic while retaining a failed naturalistic exchangeability assumption. The controlled result cannot be relabeled as general memory effectiveness.",
    nextStep:
      "Document which interventions remain comparable on natural data and preserve the failed assumption as a transfer limitation.",
  },
  "assumption-integrity": {
    question: "Do the assumptions behind a model-selection decision survive distribution shift?",
    method:
      "The research record compares synthetic and natural shifts and tracks whether the assumptions needed for interpretation remain defensible.",
    evaluation:
      "The natural-data result is adverse. Independent reproduction is absent from the public record, so neither a universal failure nor a validated correction is established.",
    nextStep:
      "Publish the permitted assumption checks and natural-data split provenance before attempting an independently specified successor.",
  },
  "fabric-induced-memory": {
    question:
      "Can structured latent memory improve long-horizon prediction beyond a simpler predictor? The useful test is whether writing and retrieving traces contribute after capacity and evaluation conditions are controlled.",
    method:
      "The public implementation explores local propagation, persistent traces, decay, salience, retrieval, latent geometry, and stochastic dynamics. It includes training and evaluation runners, stored artifacts, and a compact delayed-recall comparison.",
    evaluation:
      "The public README identifies DeepONet as having lower rollout MSE in the stored mini-suite. Historical paper-reference values are transcriptions, not fresh reproduction. The legacy ablation script is disabled because its flags were not connected to the maintained CLI; tested configuration switches are required before new component claims.",
    interpretation:
      "A memory mechanism existing in code does not show that it improves prediction. Baseline wins and ineffective components are part of the record. Local successor iterations are not silently substituted for the publicly available FIM study.",
    nextStep:
      "Freeze explicit full/no-memory/no-retrieval semantics and matched seeds, then retain raw outcomes and exact revision/configuration provenance in an authorized reproduction.",
    aliases: ["FIM"],
    owner: "THE-BU1LD / Fabric-Induced-Memory",
    sources: [
      {
        label: "Public FIM README · retained evidence and ablation warning",
        url: "https://github.com/THE-BU1LD/Fabric-Induced-Memory",
      },
    ],
  },
  "gaussian-memory-fields": {
    question:
      "Does the write mechanism in a differentiable memory field actually transmit a learning signal and improve long-horizon retrieval?",
    method:
      "The study examines field writes, gradients, and retrieval as mechanisms rather than treating a memory module's presence as evidence of use.",
    evaluation:
      "The public record retains a failed corrected primary hypothesis and zero write-token gradient in the original mechanism.",
    nextStep:
      "Preserve the failed mechanism study and require an independently specified, gradient-checked successor before testing another efficacy claim.",
  },
  "ngmt-robust-memory": {
    question:
      "Does Student-t influence weighting improve forecasting recovery beyond using a Student-t output distribution alone?",
    method:
      "The recovery study separates the influence-weighting mechanism from the output likelihood so that robust forecasts are not automatically attributed to memory.",
    evaluation:
      "The predefined improvement criterion was not met. Older overwritten mechanism artifacts are compromised and cannot be used to reconstruct a favorable result.",
    nextStep:
      "Retain the null recovery study and establish immutable, source-bound controls before another mechanism comparison.",
    aliases: ["NGMT"],
  },
  "neural-predictive-memory-spectroscopy": {
    question: "Can interventions reveal how memory transfers between tasks and where it fails?",
    method:
      "The public record describes controlled transfer diagnostics, failure profiles, and intervention sensitivity across systems.",
    evaluation:
      "Synthetic transfer gates pass in the retained record. Accepted LoCoMo and LongMemEval confirmatory evidence is not present, so the result remains bounded to controlled tasks.",
    nextStep:
      "Complete the predeclared external-evaluation provenance and acceptance checks without treating synthetic transfer as natural-language memory validation.",
    aliases: ["NPMS"],
  },
  "ripii-world-models": {
    question:
      "Can multiresolution object-state models route between dynamics without losing reproducibility across resumed runs?",
    method:
      "The retained record includes object-state representations, conditional routing experiments, and exact-resume evaluation.",
    evaluation:
      "Controlled pilots did not advance the benchmark. Conditional routing remains experimental, and the separate IPII identity has not been independently resolved.",
    nextStep:
      "Keep RIPII's pilot outcomes intact while resolving IPII provenance and freezing the next routing comparison.",
    aliases: ["RIPII"],
  },
  "eigen-jepa": {
    question:
      "Do predictive latent representations improve a financial task on a real multi-asset panel?",
    method:
      "The public record studies joint-embedding prediction on market representations, with comparison quality dependent on time ordering and panel provenance.",
    evaluation:
      "Retained real-panel comparisons are mostly null. The paper-facing single-seed path fails its rigor gate and cannot support a trading-performance claim.",
    nextStep:
      "Reconcile the time-indexed panel, comparison protocol, and independent seed evidence before changing the public conclusion.",
    owner: "Finance-Meta-Research · shared portfolio listing",
  },
  "fi-jepa": {
    question:
      "Does joint-embedding prediction improve macroeconomic forecasting over ridge regression and persistence?",
    method:
      "The study compares a predictive representation approach with simple forecasting baselines, keeping this financial research line attributed to Finance-Meta-Research.",
    evaluation:
      "The retained development study underperforms both ridge and persistence. Development results do not establish out-of-sample market or trading performance.",
    nextStep:
      "Preserve the negative baseline comparison and verify vintages, splits, and the exact forecasting target before any successor evaluation.",
    owner: "Finance-Meta-Research · shared portfolio listing",
  },
  "lam-jepa": {
    question:
      "Does a latent-action predictive model improve educational reasoning beyond a matched supervised comparator? Producing structured latent states is useful only if they preserve input information and improve the declared task.",
    method:
      "The frozen ARC-Challenge validation compares LAM-JEPA with a supervised model matched by gradient-active parameters. Its public protocol distinguishes the development-validation split from an unopened confirmatory test. Synthetic tutoring/concept-proxy tasks are separate from correctness on natural-language answers.",
    evaluation:
      "The public five-seed validation reports lower mean accuracy for LAM-JEPA than for the matched comparator. The superiority, planner-contribution, and target-path gates were not met. A bounded review traced constant predictions to single-code collapse in the tested vector-quantized path.",
    interpretation:
      "Disabling quantization restored input dependence in that diagnostic but did not demonstrate above-chance ARC performance. The result applies to the tested implementation; it does not establish that JEPA, planning, or vector quantization generally fails. The protected test is not a rescue set for the failed hypothesis.",
    nextStep:
      "Retain the frozen result and investigate a separately specified representation mechanism with input-dependence diagnostics before a new performance claim.",
    owner: "vertex-studyAI · shared portfolio listing",
    evidenceDate: "2026-09-30",
    publication: "Manuscript exists; venue submission and acceptance not verified",
    sources: [
      {
        label: "Public LAM-JEPA README · ARC protocol and failure analysis",
        url: "https://github.com/vertex-studyAI/LAM-JEPA",
      },
    ],
  },
  "weather-jepa": {
    question:
      "Can a predictive representation of weather fields support a useful forecasting task under a declared real-data protocol?",
    method:
      "The project stages synthetic pipeline checks before ERA5 evaluation. The synthetic stage tests execution and data flow rather than forecasting skill.",
    evaluation:
      "The public record is Stage 0: the synthetic engineering path runs, while ERA5 science and external validation have not started.",
    nextStep:
      "Define the real weather task, ERA5 provenance and split, baseline, forecast horizon, and metric before calling a later stage evaluated.",
  },
  "pde-surrogate-phase-transitions": {
    question:
      "Can representation changes warn when a neural PDE surrogate is about to fail outside its training regime?",
    method:
      "The prototype studies phase feedback in learned representations and surrogate behavior. The desired warning must precede failure rather than simply redescribe a large error afterward.",
    evaluation:
      "Finite smoke runs exist; a scientific phase-transition or early-warning result has not been established.",
    nextStep:
      "Freeze a measurable warning target, time-respecting evaluation, and simple error/uncertainty baselines before a confirmatory study.",
    aliases: ["PDE Surrogate Phase Transitions", "Dynamic Representation Phase Transition"],
  },
  "residual-event-tokenization": {
    question:
      "Can tokens concentrate on changes and surprise without discarding the signal needed for prediction?",
    method:
      "The prototype uses event-centered residual representations for continuous streams. Compression and downstream usefulness need separate measurements at comparable representation budgets.",
    evaluation:
      "Training and evaluation paths exist, but the public record has no frozen paper-grade multi-seed result ledger.",
    nextStep:
      "Define the stream, event rule, token budget, and common downstream task; compare with a regular sampling/tokenization baseline using retained raw results.",
  },
  "epu-omega": {
    question:
      "Can the proposed processing and retrieval design improve its bounded digit-level task?",
    method:
      "The public record describes an efficient-processing/retrieval architecture explored through a retained digit benchmark. It does not establish fabricated hardware.",
    evaluation:
      "A benchmark artifact exists, while hardware capabilities, deployment performance, and general efficiency claims remain untested.",
    nextStep:
      "Document the implemented software path and exact benchmark comparator before extending any claim to hardware or deployment.",
    aliases: ["EPU"],
  },
  eigenfinance: {
    question:
      "Can a financial hypothesis survive time-ordered evaluation with traceable data and a held-out market test?",
    method:
      "The retained public description concerns a walk-forward evaluator with data-identity and evaluation controls. Model proposals, backtests, and validated out-of-sample results are distinct stages.",
    evaluation:
      "No retained licensed real-market result supports a performance claim in this record. The separate FREM name has not been proven to be an alias of EigenFinance.",
    nextStep:
      "Resolve FREM ownership and lineage independently, and establish admissible data provenance before reporting a market result.",
    aliases: ["Eigen-Finance"],
    owner: "Finance-Meta-Research · shared portfolio listing",
  },
  colorworld: {
    question:
      "Can learned color grading produce useful, consistent image and video outputs with editable LUT exports?",
    method:
      "The product research pipeline spans aligned grades, image/video inference, and LUT export.",
    evaluation:
      "The synthetic demonstration runs. Production weights and production validation are absent, so demo execution cannot establish professional grading quality.",
    nextStep:
      "Establish authorized evaluation assets and color/temporal consistency criteria before a production-quality comparison.",
  },
  "olympus-cognitive-architecture": {
    question:
      "Can a modular research platform make memory, planning, and model reconstruction ideas testable without treating an architecture diagram as a capability result?",
    method:
      "The public atlas describes software modules, demos, and a model-family foundry. The source registry explicitly distinguishes the cognitive-architecture platform from the separate Olympus-Pantheon research line.",
    evaluation:
      "Engineering demonstrations exist, while the public record does not authorize broad model-family or autonomous-agent claims. A successful lifecycle or tiny reference checkpoint is not a trained large model with measured general capabilities.",
    interpretation:
      "Full and Ghost are discovery leads from the owner brief; no verified public architecture-to-benchmark mapping is available in this record. Their latency, memory, and quality tradeoffs are therefore not presented as measured results.",
    nextStep:
      "Bind one named model path to its exact protocol, baseline, compute conditions, and retained quality results before promoting a family or systems-performance claim.",
    aliases: ["Olympus"],
  },
  "ris-bounded-hessian-study": {
    question:
      "Do numerical Hessian calculations agree with finite differences in the declared logistic-model setup?",
    method:
      "The bounded study uses WDBC to inspect logistic Hessian behavior and finite-difference agreement.",
    evaluation:
      "The result is numerical-only. It does not support the earlier broader interpretation or clinical prediction claims.",
    nextStep:
      "Publish the numerical tolerances, step-size sensitivity, and exact model/data transformation before expanding the interpretation.",
  },
  scdmit: {
    question:
      "Which structured-dynamics or memory mechanism in this large codebase has a testable contribution?",
    method:
      "The public record establishes experimental implementation breadth, but a broad implementation surface is not a single controlled method comparison.",
    evaluation:
      "The retained evidence ledger is incomplete. No general scientific result is supported by the current public description.",
    nextStep:
      "Select one mechanism, one falsifiable question, and one matched baseline, then connect that scope to retained artifacts.",
  },
  "sapir-whorf-latent-language": {
    question: "How do language priors affect the geometry of internal representations?",
    method:
      "The project provides an experimental toolkit for language/representation studies. A toolkit can support multiple hypotheses without proving any of them.",
    evaluation: "Canonical real-model evidence and a frozen result ledger remain unverified.",
    nextStep:
      "Specify a language contrast, representation metric, matched model conditions, and a falsifiable explanation before reporting a language effect.",
  },
  speechly: {
    question:
      "Which parts of a speech/language pipeline are learned, and which depend on disclosed heuristics?",
    method:
      "The current public record describes a callable experimentation pipeline with heuristic components.",
    evaluation:
      "There is no trained-checkpoint evidence ledger supporting a performance claim. A working call does not demonstrate recognition or language quality.",
    nextStep:
      "Document the component boundary and evaluate against an authorized labeled dataset before reporting model performance.",
  },
  "apen-synthica": {
    question:
      "Does selective episodic residual memory help a neural PDE surrogate beyond an equally resourced baseline? The comparison must include unfavorable cells and the cost of the memory mechanism.",
    method:
      "The public project description scopes APEN around selective residual-memory correction under controlled regimes. APEN/PEN and the Synthica foundry share a source identity, but a generated package is not an independently completed research project.",
    evaluation:
      "The retained public atlas reports negative and partial gate outcomes. It does not establish a successful memory mechanism or submission-ready Synthica studies. New private-source implementation receipts are not exposed as public benchmark evidence.",
    interpretation:
      "A fair comparison needs matched training resources, a fixed baseline, separate development and held-out roles, and failure-preserving reporting. Smoke checks establish execution. They do not show that a memory correction improves a surrogate or transfers to another physical regime.",
    nextStep:
      "Reconcile an authorized public claim-to-artifact package with the current scientific state before reporting new metrics; preserve predecessor negatives and keep successor versions separate.",
    aliases: ["APEN", "PEN", "APEN-Synthica"],
  },
  "project-2424": {
    question:
      "How can a large idea inventory distinguish a runnable, falsifiable study from a specification?",
    method:
      "A research registry classifies implementation and quality-gate status across the collection.",
    evaluation:
      "The 2,424 registry rows are not 2,424 papers. Only a small classified subset is executable research, and the public disposition remains release-rejected.",
    nextStep:
      "Advance individual eligible studies through their own evidence gates and retain unresolved or rejected entries without counting them as validated outputs.",
  },
  "independent-research-foundry": {
    question: "Which broad research directions can be reduced to bounded, testable protocols?",
    method: "A 64-direction foundry performs Stage-1 screening and specification work.",
    evaluation:
      "The names represent screens and specifications, not standalone papers or submission-ready studies.",
    nextStep:
      "Select eligible screens by their explicit falsifiers and required evidence, preserving their parent-foundry relationship.",
  },
  "ml4science-portfolio": {
    question:
      "Which scientific-ML mechanisms merit a concrete experiment after hypothesis and feasibility review?",
    method:
      "The public portfolio groups mechanisms into eight families and four externally framed proposals. These organize research questions; they do not establish collaborators or validated discoveries.",
    evaluation:
      "The externally framed proposals fail advancement gates in the retained public record.",
    nextStep:
      "Resolve each proposal's failed gate and identity before promoting it as an independent study or attributing external institutional support.",
  },
  "ml4industry-portfolio": {
    question:
      "Which industrial tasks can support task-native evaluation instead of a generic synthetic demo?",
    method:
      "The foundry scopes 64 identities around industrial use cases and deployment questions, with shared scaffolding and a small external subset.",
    evaluation:
      "Most identities share implementation scaffolds. Synthetic demonstrations cannot establish industrial effectiveness or deployment readiness.",
    nextStep:
      "Bind an eligible task to permitted real data, operational baselines, and an explicit deployment boundary before promoting its evidence.",
  },
  "ml4semantic-intelligence": {
    question:
      "Which semantic-intelligence ideas have enough definition and evidence to justify a controlled study?",
    method: "The collection combines specifications, diagnostics, and a small external subset.",
    evaluation:
      "Most entries are specification-only, and the public record does not mark any as conference-ready.",
    nextStep:
      "Select and freeze one eligible semantic task with a matched baseline and artifact requirements rather than promoting the whole collection.",
  },
  "ml-invention-foundry": {
    question:
      "Can a screening system promote a small number of defensible research lanes from a broad invention inventory?",
    method:
      "The foundry uses explicit promotion gates across 64 proxies, with three promoted domains.",
    evaluation:
      "The operational foundry is separate from its scientific outcomes: promoted lanes remain negative or inconclusive.",
    nextStep:
      "Preserve the negative/inconclusive outcomes and require independently justified successor protocols before another promotion.",
  },
  "krylov-jepa": {
    question:
      "Does pretraining with operator/Krylov structure improve representations beyond simple spectral and learned baselines? High state fidelity alone need not imply a small physical residual.",
    method:
      "The public workspace separates Spectral Krylov-JEPA from a Free-Physics/LMOP-JEPA study. Its retained controls include fixed sine shapes, classical Ritz correction, ridge regression, and normalized-powers neural controls on synthetic potential problems.",
    evaluation:
      "The 27 September public claim ledger records a negative baseline audit: a fixed sine shape has greater mean in-distribution fidelity than retained Krylov N20, with the conditional interval crossing zero; a nine-mode Ritz control improves both fidelity and physical residual. Fourteen tiny control variants establish pipeline execution rather than efficacy.",
    interpretation:
      "The main design has one self-supervised pretraining seed and three downstream seeds, so it cannot estimate independent pretraining-seed uncertainty. Matching training steps does not match total compute or data-generation cost. Classical Ritz controls access the operator at inference, which must remain explicit when comparing methods.",
    nextStep:
      "Reconcile the missing full experiment matrix and source-bound result package, with independent pretraining seeds and a total-resource comparison, before a transfer or superiority claim.",
    aliases: ["Krylov-JEPA", "Kyrlov-JEPA"],
    owner: "build-the-future-11 / Kyrlov-JEPA",
    evidenceDate: "2026-09-27",
    publication: "Public technical report; journal acceptance not established",
    sources: [
      {
        label: "Public workspace and study boundaries",
        url: "https://github.com/build-the-future-11/Kyrlov-JEPA",
      },
      {
        label: "27 September claim ledger · controls and limitations",
        url: "https://github.com/build-the-future-11/Kyrlov-JEPA/blob/main/spectral-krylov-jepa/CLAIMS.md",
      },
    ],
  },
  "spectral-jepa": {
    question:
      "Could spectral structure create a more useful predictive latent space for scientific dynamics than a purely spatial objective?",
    method:
      "This is a public research direction. A particular spectral objective, model, or experiment has not been bound to the seed record.",
    evaluation:
      "No independent result is established. The similarly named Krylov study and financial Eigen-JEPA record remain separately identified until authoritative lineage evidence resolves their relationship.",
    nextStep:
      "Resolve the canonical source and whether this is a parent direction, alias, or separate project before assigning experiments or counting another evaluated study.",
    evidenceDate: "2026-10-02",
  },
  "quantized-adaptive-transformers": {
    question:
      "Can a transformer adapt under limited precision without losing the quality that makes adaptation useful?",
    method:
      "The public brief proposes studying precision and adaptation together. It does not yet establish a specific implemented quantizer or adaptive policy.",
    evaluation:
      "No verified dataset, baseline, quality result, memory measurement, or latency receipt is attached to the public seed record.",
    nextStep:
      "Bind a precise task and model, define precision settings and adaptation behavior, and freeze a matched quality/memory/latency comparison.",
    evidenceDate: "2026-10-02",
  },
  mahjong: {
    question:
      "How should a decision system represent uncertainty and act in a combinatorial game with hidden information?",
    method:
      "The public brief scopes a game-AI direction. The rules variant, observation model, search or learning algorithm, and opponent pool are not yet verified.",
    evaluation:
      "No retained game-strength or solved-performance evidence is available in this record.",
    nextStep:
      "Confirm the ruleset, legal-action environment, seeded opponent protocol, and metric before any training or competitive-performance claim.",
    evidenceDate: "2026-10-02",
  },
  "latent-safety-recovery": {
    question: "Can a model recognize confident errors and recover through self-consistency?",
    method:
      "The archived public description identifies a completed thread around confident wrongness and recovery; it does not specify an independently verified intervention or recovery algorithm.",
    evaluation:
      "Closed status records the operational disposition. It does not prove a safety improvement; the paper and underlying comparison remain unverified for this page.",
    nextStep:
      "Recover the permitted final report and evaluation artifacts before proposing a bounded extension. Recruitment is not currently verified.",
    evidenceDate: "2026-01-05",
    recruitment: "Archived · no verified open role",
  },
  "space-jepa": {
    question:
      "Can predictive representations of irregular light curves improve a bounded human-review queue while respecting when observations actually become available? Leakage through future observations or repeated physical entities would invalidate the comparison.",
    method:
      "The public implementation uses chronological, physical-entity-disjoint partitions, prefix-only normalization, and prediction horizons of 1, 3, 7, and 14 days. The AQPM-JEPA engine includes a quaternion causal encoder, an EMA target, a jump-flow predictor, and training-only residual memory. Controls include persistence, linear/quadratic extrapolation, GRU, a real-valued causal Transformer, and a real-valued predictive JEPA.",
    evaluation:
      "The 19 September implementation report records software verification, while explicitly stating that no genuine model-ready TNS time-series asset with an available-at timestamp is present. Its synthetic/shadow examples cannot support a scientific recall, calibration, workload, or discovery-yield claim.",
    interpretation:
      "A completed predictive-core campaign is not scientific promotion. The stated acceptance boundary still requires baseline and memory controls, calibration, rare-family and source-population-shift tests, and human review. Space JEPA 2 cannot authorize an astronomical report and is not counted as another independent project separate from SIDEREA.",
    nextStep:
      "Acquire permitted survey photometry with observation and availability times, reconcile the physical-entity split and population, and satisfy the frozen comparison grid before interpreting scientific outcomes.",
    owner: "build-the-future-11 / IRIS-Space · SIDEREA subproject",
    aliases: ["Space-JEPA", "AQPM-JEPA (engine)"],
    evidenceDate: "2026-09-19",
    sources: [
      {
        label: "Space JEPA 2 implementation report · 19 September 2026",
        url: "https://github.com/build-the-future-11/IRIS-Space/blob/main/docs/SPACE_JEPA_2_IMPLEMENTATION_STATUS_2026-09-19.md",
      },
    ],
  },
  "iris-robust-memory": {
    question:
      "Does a learned robust-memory mechanism improve recurrent prediction beyond strong fixed robust controls and under persistent shifts?",
    method:
      "The public IRIS repository preserves a recovered v0.2 research package and a common adaptation harness. It distinguishes scalar evidence from learned-sequence evidence and keeps a protected confirmatory family separate from development.",
    evaluation:
      "The public research-truth record retains mixed/negative findings: the scalar heavy-tail advantage did not transfer to the learned recurrent pilot, and the tested mechanism failed strong-control and persistent-shift gates. Canonical raw-trajectory provenance is unresolved, so source hashes alone do not authorize confirmation.",
    nextStep:
      "Recover canonical trajectory identity without regenerating approximate inputs and relabeling them original. Any successor requires a newly frozen question after the provenance boundary is resolved.",
    owner: "build-the-future-11 / IRIS",
    aliases: ["IRIS (robust recurrent memory)"],
    evidenceDate: "2026-09-30",
    recruitment: "Closed evidence line · no verified open role",
    sources: [
      {
        label: "Public IRIS repository · memory research identity and blocked confirmation",
        url: "https://github.com/build-the-future-11/IRIS",
      },
    ],
  },
};

export function getResearchBrief(slug: string): ResearchBrief | undefined {
  const project = getResearchPortfolioItem(slug);
  const content = RESEARCH_BRIEFS[slug];
  if (!project || !content) return undefined;
  return {
    owner: "BU1LD public portfolio · individual ownership not independently verified",
    reviewedAt: "2026-10-16",
    evidenceDate: null,
    publication: "Public project description; peer-reviewed publication not verified",
    recruitment: "No project-specific opening or reviewer capacity verified",
    aliases: [],
    prerequisiteLessons: RESEARCH_PREREQUISITES[slug] ?? [],
    sources: [
      {
        label: "Existing BU1LD public catalog · retained description, not independent reproduction",
      },
    ],
    ...content,
  };
}

export function getRelatedResearchItems(slug: string, limit = 3): ResearchPortfolioItem[] {
  const current = getResearchPortfolioItem(slug);
  if (!current || limit <= 0) return [];

  const currentTags = new Set(current.tags.map((tag) => tag.toLowerCase()));

  return PUBLIC_RESEARCH_PORTFOLIO.filter((item) => item.slug !== slug)
    .map((item, index) => {
      const sharedTags = item.tags.filter((tag) => currentTags.has(tag.toLowerCase())).length;
      const score =
        sharedTags * 10 +
        (item.kind === current.kind ? 2 : 0) +
        (item.stage === current.stage ? 1 : 0);
      return { item, index, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map(({ item }) => item);
}
