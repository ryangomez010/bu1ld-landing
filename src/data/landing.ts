export const RESEARCH = [
  {
    id: "01",
    name: "Counterfactual Defect Worlds",
    color: "red",
    desc: "Probing how generative world models reason about broken, perturbed, and out-of-distribution environments by injecting controlled defects and studying recovery.",
  },
  {
    id: "02",
    name: "Sapir, Whorf & the Latent Tongue",
    color: "blue",
    desc: "Studying how language priors shape internal representations, and what monolingual vs. multilingual models actually carve up differently.",
  },
  {
    id: "03",
    name: "Adaptive Theory Geometry in World Models",
    color: "green",
    desc: "Mapping curvature, intrinsic dimension, and theory-laden structure inside latent manifolds as models adapt to new physical regimes.",
  },
  {
    id: "04",
    name: "Residual Event Tokenization",
    color: "bone",
    desc: "A tokenization scheme that encodes only residual, surprise-bearing events from continuous streams, compressing video, sensor, and agent trajectories without losing causal signal.",
  },
  {
    id: "05",
    name: "Dynamical Representation Phase Transitions for PDE Surrogates",
    color: "blue",
    desc: "Tracking phase transitions in learned representations as neural PDE surrogates scale, and using them to predict where a surrogate will silently break.",
  },
  {
    id: "06",
    name: "Latent Safety and Recovery",
    color: "green",
    desc: "Studying whether a model can detect when it has become confidently wrong, then recover through self-consistency, retrieval, or replanning.",
  },
] as const;

export const PROGRAMS = [
  {
    tag: "P-01",
    name: "AI Builder Cohort",
    time: "12 weeks, rolling",
    body: "A project-driven cohort where builders ship a production ML system end to end, from paper reading to deployed inference.",
  },
  {
    tag: "P-02",
    name: "Research Fellowship",
    time: "6 months, selective",
    body: "Co-advised research with academic collaborators, targeting strong venue submissions and clean open-source reference code.",
  },
  {
    tag: "P-03",
    name: "Startup Incubation",
    time: "ongoing",
    body: "Translate a research thread into a venture with technical due diligence, founder matching, infra credits, and a runway to first users.",
  },
] as const;

export const STARTUPS = [
  {
    name: "NeuroCad",
    stage: "scaling",
    domain: "Text to CAD",
    thesis: "Natural language to manufacturable CAD assemblies, with a learned mechanical prior.",
  },
  {
    name: "Colorworld",
    stage: "seed",
    domain: "Generative color",
    thesis:
      "An AI color coding generator that produces brand-coherent palettes and full design tokens from intent.",
  },
  {
    name: "Exovian Games",
    stage: "prototype",
    domain: "AI native games",
    thesis:
      "Game worlds where the simulator, NPCs, and narrative are driven by on-device learned models.",
  },
  {
    name: "Eigen Δ",
    stage: "research",
    domain: "Foundation models",
    thesis: "Compact delta-trained foundation models that specialize in hours, not weeks.",
  },
  {
    name: "Many more",
    stage: "research",
    domain: "Open thread",
    thesis:
      "New ventures spin out of the lab every cycle. Builders propose, the community pressure tests, the best ideas get shipped.",
  },
] as const;

export const TEAM = [
  { name: "Ryan Gomez", role: "Founder, Research & Systems", initials: "RG", color: "blue" },
  {
    name: "UC Physics PhD",
    role: "Principal Researcher, Physics ML",
    initials: "ΦD",
    color: "green",
  },
  {
    name: "Distributed Builders",
    role: "Engineers, researchers, founders",
    initials: "∴",
    color: "red",
  },
] as const;

export const BENEFITS = [
  "Research threads that turn into real prototypes fast",
  "A community for builders of all ages and backgrounds",
  "Academic depth with startup urgency",
  "Open projects, visible output, and high standards",
] as const;

export const MEMBERSHIP_PERKS = [
  {
    id: "01",
    title: "Join projects",
    desc: "Apply to active research threads and startup builds matched to your skills and interests.",
    color: "blue",
  },
  {
    id: "02",
    title: "Learn ML deeply",
    desc: "Curated learning paths, internal notes, and builder-led sessions across frontier topics.",
    color: "green",
  },
  {
    id: "03",
    title: "Paper insights",
    desc: "Distilled takes on important ML papers — what matters, what breaks, and what to build next.",
    color: "red",
  },
  {
    id: "04",
    title: "Events & conferences",
    desc: "Stay ahead of deadlines, meetups, and conferences across the ML ecosystem.",
    color: "bone",
  },
] as const;

export const FAQ = [
  {
    q: "Is this only for ML researchers?",
    a: "No. The best teams mix researchers, engineers, product-minded builders, and people who can turn ambiguity into shipping momentum.",
  },
  {
    q: "Do you prefer papers or products?",
    a: "Both. Papers are useful when they create leverage, but the end goal is systems people can actually use, test, and build on.",
  },
  {
    q: "What happens after someone joins?",
    a: "Create your account, complete your profile, and land on the member hub — events, guides, papers, open projects, and applications. Match to threads by applying; leads review with your full profile attached.",
  },
  {
    q: "How do project applications work?",
    a: "Browse open projects, write a short pitch (templates provided), and submit. Your bio, background, interests, and LinkedIn go to the project lead. Track status in Applications.",
  },
  {
    q: "Is membership free?",
    a: "Yes at launch. Create an account, complete your profile, and you're in the pool for projects, learning, and community access.",
  },
] as const;

export const STATS = [
  ["100+", "builders"],
  ["6", "active research threads"],
  ["3", "program tracks"],
  ["Stanford · MIT · UC", "research collaborators"],
] as const;

export const NAV_ITEMS = [
  ["What we do", "what"],
  ["Membership", "membership"],
  ["Research", "research"],
  ["Programs", "programs"],
  ["Startups", "startups"],
  ["Team", "team"],
  ["FAQ", "faq"],
  ["Contact", "contact"],
] as const;

export const DISCORD_URL = "https://discord.gg/NG4QYat4P";
export const CONTACT_EMAIL = "ryan@thebu1ld.com";

export const stageColor: Record<string, string> = {
  research: "text-bone border-bone/40",
  prototype: "text-accent-green border-accent-green/40",
  seed: "text-accent-blue border-accent-blue/40",
  scaling: "text-accent-red border-accent-red/40",
};

export const hoverGlow: Record<string, string> = {
  blue: "hover:glow-blue",
  red: "hover:glow-red",
  green: "hover:glow-green",
  bone: "hover:glow-bone",
};

export const textAccent: Record<string, string> = {
  blue: "text-accent-blue",
  red: "text-accent-red",
  green: "text-accent-green",
  bone: "text-bone",
};

export const dotColor = (color: string) =>
  color === "red"
    ? "bg-accent-red"
    : color === "green"
      ? "bg-accent-green"
      : color === "blue"
        ? "bg-accent-blue"
        : "bg-bone";

export const INTEREST_OPTIONS = [
  "World models",
  "Foundation models",
  "Physics ML",
  "NLP & representation",
  "Computer vision",
  "Reinforcement learning",
  "Systems & inference",
  "Startups & product",
] as const;

export const BACKGROUND_OPTIONS = [
  { value: "researcher", label: "Researcher" },
  { value: "engineer", label: "Engineer" },
  { value: "founder", label: "Founder" },
  { value: "student", label: "Student" },
  { value: "other", label: "Other" },
] as const;
