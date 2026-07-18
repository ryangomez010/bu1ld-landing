/**
 * Public institution content — labs, programs, competitions, partnerships.
 * Keep claims precise; only list metrics that are operationally true or labeled as goals.
 */

export type LabSlug =
  | "scientific-discovery"
  | "mathematical-intelligence"
  | "robotics"
  | "computational-finance"
  | "real-world-ai"
  | "emerging";

export type InstitutionLab = {
  slug: LabSlug;
  name: string;
  shortName: string;
  tagline: string;
  summary: string;
  focus: string[];
  methods: string[];
  openRoles: string[];
  relatedProgramSlugs: string[];
  color: "blue" | "green" | "red" | "bone" | "violet" | "orange";
};

export type InstitutionProgram = {
  slug: string;
  name: string;
  kind: "fellowship" | "incubation" | "cohort" | "competition" | "workshop";
  duration: string;
  selectivity: string;
  summary: string;
  /** What the program exists to accomplish. */
  objective: string;
  /** Expected weekly / cycle commitment. */
  commitment: string;
  /** Schedule framing (dates may be TBA until a live cycle is published). */
  timeline: string;
  /** Honest operating status for visitors. */
  status: "open" | "rolling" | "upcoming" | "closed";
  outcomes: string[];
  whoFor: string;
  /** Member-portal or competitions destination after auth. */
  applyHref: string;
};

export type InstitutionCompetition = {
  slug: string;
  name: string;
  status: "open" | "upcoming" | "closed";
  summary: string;
  prize: string;
  deadline: string | null;
  labSlug?: LabSlug;
};

export type InstitutionPartner = {
  name: string;
  kind: "academic" | "industry" | "community" | "infrastructure";
  summary: string;
  status: "active" | "exploring";
};

export const LABS: InstitutionLab[] = [
  {
    slug: "scientific-discovery",
    name: "Machine Learning for Scientific Discovery",
    shortName: "Scientific Discovery",
    tagline: "Surrogates, simulators, and discovery loops that survive contact with real data.",
    summary:
      "This lab studies how learned models accelerate scientific workflows — from PDE surrogates and experimental design to literature-grounded hypothesis generation — without treating benchmark wins as discovery.",
    focus: [
      "Neural PDE surrogates and dynamical phase transitions",
      "Active learning and experimental design under budget",
      "Scientific literature → testable hypothesis pipelines",
      "Uncertainty, calibration, and failure localization",
    ],
    methods: [
      "Controlled defect injection in world models",
      "Reproducible training recipes with published configs",
      "Ablations that name when a surrogate silently breaks",
    ],
    openRoles: ["Research contributor", "Systems engineer", "Domain collaborator"],
    relatedProgramSlugs: ["research-fellowship", "ai-builder-cohort"],
    color: "green",
  },
  {
    slug: "mathematical-intelligence",
    name: "Mathematical Approaches to Intelligence",
    shortName: "Mathematical Intelligence",
    tagline: "Geometry, information, and theory that constrain what models can and cannot learn.",
    summary:
      "We treat representation geometry, inductive bias, and information bottlenecks as first-class objects — not afterthoughts to scale. The lab connects classical theory to measurable structure inside modern models.",
    focus: [
      "Latent manifold geometry and intrinsic dimension",
      "Theory-laden structure in adaptive representations",
      "Formalizing residual / surprise-bearing tokenization",
      "Limits of generalization under distribution shift",
    ],
    methods: [
      "Probe suites on synthetic and real manifolds",
      "Scaling-law aware experimental design",
      "Proof-oriented writeups paired with runnable notebooks",
    ],
    openRoles: ["Theory researcher", "ML engineer", "Reviewer"],
    relatedProgramSlugs: ["research-fellowship"],
    color: "blue",
  },
  {
    slug: "robotics",
    name: "Robotics and Autonomous Intelligence",
    shortName: "Robotics",
    tagline: "Agents that plan, recover, and explain themselves when the world breaks.",
    summary:
      "Autonomy fails at the edge cases. This lab focuses on recovery under perturbation, residual event streams, and evaluation protocols that punish confident wrongness.",
    focus: [
      "Latent safety and recovery under perturbation",
      "Residual event tokenization for continuous streams",
      "Sim-to-real evaluation with explicit failure catalogs",
      "Multi-agent coordination under partial observability",
    ],
    methods: [
      "Counterfactual defect worlds",
      "Closed-loop demos with logged trajectories",
      "Weekly postmortems on silent failure modes",
    ],
    openRoles: ["Robotics engineer", "RL researcher", "Hardware collaborator"],
    relatedProgramSlugs: ["ai-builder-cohort", "research-fellowship"],
    color: "red",
  },
  {
    slug: "computational-finance",
    name: "Computational Finance and Economics",
    shortName: "Comp. Finance",
    tagline: "Markets as dynamical systems — models that are inspectable under stress.",
    summary:
      "We build decision systems for financial and economic regimes where calibration, regime detection, and auditability matter more than leaderboard deltas.",
    focus: [
      "Regime-aware forecasting and risk models",
      "Market microstructure and agent-based simulation",
      "Causal evaluation under non-stationarity",
      "Governance-ready model cards for financial ML",
    ],
    methods: [
      "Walk-forward evaluation with frozen protocols",
      "Adversarial stress tests on regime shifts",
      "Public postmortems on what failed and why",
    ],
    openRoles: ["Quant researcher", "ML engineer", "Risk reviewer"],
    relatedProgramSlugs: ["startup-incubation", "ai-builder-cohort"],
    color: "violet",
  },
  {
    slug: "real-world-ai",
    name: "Real-World AI Applications",
    shortName: "Real-World AI",
    tagline: "End-to-end systems that ship evidence, not decks.",
    summary:
      "Applied threads that turn a narrow technical hypothesis into an inspectable prototype — with users, evaluators, or operators who can falsify the claim.",
    focus: [
      "Text-to-structure and generative design tools",
      "Documented research-to-product decision gates",
      "Reliability under messy real inputs",
      "Member-facing tools that dogfood our own methods",
    ],
    methods: [
      "30-day shipping checkpoints",
      "User / evaluator sessions with written findings",
      "Kill criteria decided before the first demo",
    ],
    openRoles: ["Founding engineer", "Product-minded researcher", "Designer"],
    relatedProgramSlugs: ["startup-incubation", "ai-builder-cohort"],
    color: "orange",
  },
  {
    slug: "emerging",
    name: "Interdisciplinary & Emerging Projects",
    shortName: "Emerging",
    tagline: "Threads that do not fit a single lab — yet.",
    summary:
      "A holding bay for interdisciplinary proposals, early probes, and cross-lab collaborations. Threads graduate into a home lab once scope, method, and ownership are clear.",
    focus: [
      "Cross-lab collaborations with shared milestones",
      "Early probes that need two weeks, not six months",
      "Open calls for emerging problem statements",
    ],
    methods: [
      "Lightweight charters with explicit kill dates",
      "Rotation of mentors across labs",
      "Promotion criteria into a primary lab",
    ],
    openRoles: ["Any background with a falsifiable claim"],
    relatedProgramSlugs: ["ai-builder-cohort", "open-competitions"],
    color: "bone",
  },
];

export const INSTITUTION_PROGRAMS: InstitutionProgram[] = [
  {
    slug: "research-fellowship",
    name: "Research Fellowship",
    kind: "fellowship",
    duration: "6 months, selective",
    selectivity: "Written application + interview with a lab lead",
    summary:
      "A structured research cycle: clarify a question, run disciplined experiments, and leave a public project record with evidence, limitations, and next decisions.",
    objective:
      "Produce a falsifiable research charter, executed milestones, and an evidence-backed record other members can inspect.",
    commitment: "About 8–12 hours per week, including a weekly research sync.",
    timeline:
      "Six-month cycles. Exact start dates publish when a live cohort opens in the member portal.",
    status: "rolling",
    outcomes: [
      "Scoped research charter",
      "Milestone and contribution history",
      "Optional paper review or research note",
      "Demo or written postmortem",
    ],
    whoFor: "Researchers, advanced students, and engineers ready to own a methodological thread.",
    applyHref: "/programs/research-fellowship",
  },
  {
    slug: "startup-incubation",
    name: "Startup Incubation",
    kind: "incubation",
    duration: "Ongoing, stage-gated",
    selectivity: "Active build + clear kill criteria reviewed by a lead",
    summary:
      "For builders testing whether a technical thread deserves a product prototype and early user conversations — not a fundraising narrative.",
    objective:
      "Decide go / pivot / stop with a working prototype, evaluator sessions, and a written decision memo.",
    commitment: "Founding-team intensity — typically 15+ hours per week while a stage is open.",
    timeline: "Stage-gated. Each stage has an explicit review date before the next commitment.",
    status: "rolling",
    outcomes: [
      "Working prototype with documented scope",
      "User or evaluator sessions",
      "Go / pivot / stop decision memo",
    ],
    whoFor: "Founders and founding engineers with a narrow, testable product claim.",
    applyHref: "/programs/startup-incubation",
  },
  {
    slug: "ai-builder-cohort",
    name: "AI Builder Cohort",
    kind: "cohort",
    duration: "12 weeks, rolling admission",
    selectivity: "Open application with capacity limits per wave",
    summary:
      "A project-driven cohort that turns a scoped technical question into a reproducible prototype, clear documentation, and a final demo.",
    objective:
      "Ship a scoped prototype with weekly demos, peer review, and a final demo-day artifact.",
    commitment: "6–10 hours per week plus demo day at the end of the wave.",
    timeline: "12-week waves. Admission rolls until the wave is full.",
    status: "rolling",
    outcomes: ["Weekly shipping cadence", "Peer review of demos", "Final demo day artifact"],
    whoFor:
      "Engineers, researchers, and students who want structured practice shipping ML systems.",
    applyHref: "/programs/ai-builder-cohort",
  },
  {
    slug: "open-competitions",
    name: "Competitions",
    kind: "competition",
    duration: "Varies by challenge",
    selectivity: "Public entry when a challenge status is open",
    summary:
      "Time-boxed challenges with published evaluation protocols. Winning means beating the protocol — not networking.",
    objective:
      "Evaluate submissions against a frozen protocol and surface strong work into lab threads.",
    commitment: "Challenge-specific; published with each open call.",
    timeline: "Challenges remain upcoming until evaluation rules and deadlines are frozen.",
    status: "upcoming",
    outcomes: [
      "Public leaderboard or judged review",
      "Reproducible submission package",
      "Optional invitation into a lab thread",
    ],
    whoFor: "Individuals and small teams who want a sharp, fair evaluation surface.",
    applyHref: "/competitions",
  },
];

export const COMPETITIONS: InstitutionCompetition[] = [
  {
    slug: "defect-worlds-challenge",
    name: "Defect Worlds Challenge",
    status: "upcoming",
    summary:
      "Inject controlled defects into a shared world-model baseline and measure recovery quality under a frozen evaluation protocol.",
    prize: "Lab invitation + featured project record",
    deadline: null,
    labSlug: "scientific-discovery",
  },
  {
    slug: "residual-stream-hack",
    name: "Residual Stream Hack",
    status: "upcoming",
    summary:
      "Compress a continuous sensor stream with residual event tokens and beat a published bitrate / fidelity frontier.",
    prize: "Mentorship slot + demo day feature",
    deadline: null,
    labSlug: "robotics",
  },
];

export const PARTNERSHIPS: InstitutionPartner[] = [
  {
    name: "Academic collaborators",
    kind: "academic",
    summary:
      "Co-advised research threads targeting strong venue submissions and clean open-source reference code. Selective — apply through the fellowship track.",
    status: "exploring",
  },
  {
    name: "Infrastructure partners",
    kind: "infrastructure",
    summary:
      "Compute, data, and tooling relationships that remove bottlenecks for member experiments — disclosed when active and material.",
    status: "exploring",
  },
  {
    name: "Builder communities",
    kind: "community",
    summary:
      "Discord and peer networks for demos, paper clubs, and cross-project critique. Community channels are opt-in and moderated.",
    status: "active",
  },
];

export const PEOPLE_PUBLIC = [
  {
    name: "Ryan Gomez",
    role: "Founder — Research & Systems",
    bio: "Builds The Bu1ld’s research operating system: project governance, evidence standards, and the member portal that makes collaboration legible.",
    initials: "RG",
  },
  {
    name: "Lab contributors",
    role: "Researchers, engineers, mentors",
    bio: "Named contributors appear on project pages and the member directory once profiles are public. Roles are earned through verified contributions, not titles.",
    initials: "Φ",
  },
];

export const APPLICATION_STEPS = [
  {
    step: "01",
    title: "Create an account",
    body: "Sign up free. No payment step at launch.",
  },
  {
    step: "02",
    title: "Complete your profile",
    body: "Background, interests, links, and timezone — this attaches to every application automatically.",
  },
  {
    step: "03",
    title: "Choose a path",
    body: "Apply to a lab-aligned project, a program (fellowship / cohort / incubation), or wait for an open competition.",
  },
  {
    step: "04",
    title: "Review & join",
    body: "Leads and administrators review. Accepted applicants join a team with milestones, deliverables, and feedback loops.",
  },
] as const;

export function getLab(slug: string): InstitutionLab | undefined {
  return LABS.find((lab) => lab.slug === slug);
}

export function getProgram(slug: string): InstitutionProgram | undefined {
  return INSTITUTION_PROGRAMS.find((program) => program.slug === slug);
}
