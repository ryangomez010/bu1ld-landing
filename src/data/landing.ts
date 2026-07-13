export const RESEARCH = [
  {
    id: "01",
    name: "Counterfactual Defect Worlds",
    color: "red",
    href: "/projects",
    desc: "Probing how generative world models reason about broken, perturbed, and out-of-distribution environments by injecting controlled defects and studying recovery.",
  },
  {
    id: "02",
    name: "Sapir, Whorf & the Latent Tongue",
    color: "blue",
    href: "/guides/what-is-attention",
    desc: "Studying how language priors shape internal representations, and what monolingual vs. multilingual models actually carve up differently.",
  },
  {
    id: "03",
    name: "Adaptive Theory Geometry in World Models",
    color: "green",
    href: "/papers",
    desc: "Mapping curvature, intrinsic dimension, and theory-laden structure inside latent manifolds as models adapt to new physical regimes.",
  },
  {
    id: "04",
    name: "Residual Event Tokenization",
    color: "bone",
    href: "/projects",
    desc: "A tokenization scheme that encodes only residual, surprise-bearing events from continuous streams, compressing video, sensor, and agent trajectories without losing causal signal.",
  },
  {
    id: "05",
    name: "Dynamical Representation Phase Transitions for PDE Surrogates",
    color: "blue",
    href: "/projects",
    desc: "Tracking phase transitions in learned representations as neural PDE surrogates scale, and using them to predict where a surrogate will silently break.",
  },
  {
    id: "06",
    name: "Latent Safety and Recovery",
    color: "green",
    href: "/projects",
    desc: "Studying whether a model can detect when it has become confidently wrong, then recover through self-consistency, retrieval, or replanning.",
  },
] as const;

export const PROGRAMS = [
  {
    tag: "P-01",
    name: "AI Builder Cohort",
    time: "12 weeks, rolling",
    href: "/programs",
    body: "A project-driven cohort for turning a scoped technical question into a reproducible prototype, clear documentation, and a final demo.",
  },
  {
    tag: "P-02",
    name: "Research Fellowship",
    time: "6 months, selective",
    href: "/programs",
    body: "A structured research cycle for developing a question, testing it with disciplined experiments, and publishing an evidence-backed project record.",
  },
  {
    tag: "P-03",
    name: "Startup Incubation",
    time: "ongoing",
    href: "/projects",
    body: "For active builders who want to test whether a technical thread deserves a real product prototype and early user conversations.",
  },
] as const;

export const STARTUPS = [
  {
    name: "Applied ML threads",
    stage: "research",
    domain: "Text to CAD",
    href: "/projects",
    thesis:
      "Members turn a narrow technical hypothesis into an inspectable build, with evidence, limitations, and a next decision.",
  },
  {
    name: "Prototype practice",
    stage: "prototype",
    domain: "Generative color",
    href: "/newsletter",
    thesis:
      "Small, end-to-end systems that make a research claim tangible enough to test with users or evaluators.",
  },
  {
    name: "Research-to-product review",
    stage: "research",
    domain: "AI native games",
    href: "/newsletter",
    thesis:
      "A place to decide whether a result is ready for further research, an open artifact, or a product experiment.",
  },
  {
    name: "Documented outcomes",
    stage: "research",
    domain: "Foundation models",
    href: "/papers",
    thesis:
      "Milestones, contribution records, repositories, and postmortems make progress legible without inflating claims.",
  },
  {
    name: "Many more",
    stage: "research",
    domain: "Open thread",
    href: "/projects",
    thesis:
      "New threads start when a member proposes a falsifiable claim and finds two others willing to ship weekly. Some become startups; most get cut after a documented postmortem.",
  },
] as const;

export const TEAM = [
  { name: "Ryan Gomez", role: "Founder, Research & Systems", initials: "RG", color: "blue" },
  {
    name: "Research contributors",
    role: "Method, experiments, and review",
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
  "Research threads with weekly demos, not quarterly slide decks",
  "A distributed roster — researchers, systems engineers, founders, and students on the same threads",
  "Paper reviews that name failure modes, not just benchmark deltas",
  "Open project listings with explicit scope, private applications, and attributed collaboration records",
] as const;

export const MEMBERSHIP_PERKS = [
  {
    id: "01",
    title: "Join projects",
    desc: "Browse open threads, submit a short pitch, and attach your full profile — leads see bio, background, interests, and links in one review queue.",
    color: "blue",
  },
  {
    id: "02",
    title: "Learn ML deeply",
    desc: "Six reading paths across transformers, world models, scaling laws, and alignment — each links internal guides to member paper reviews with progress tracking.",
    color: "green",
  },
  {
    id: "03",
    title: "Paper insights",
    desc: "Member-written reviews on classics and active threads — methods, reproducibility gaps, and what we would prototype next.",
    color: "red",
  },
  {
    id: "04",
    title: "Events & conferences",
    desc: "Submission deadlines, workshop dates, and meetups with prep notes, RSVP tracking, and one-click .ics export.",
    color: "bone",
  },
] as const;

export const FAQ = [
  {
    q: "Is this only for ML researchers?",
    a: "No. Open projects list required skills explicitly — many threads need systems engineers for training infra, product-minded builders for demos, and students for reproduction work. Researchers anchor methodology; engineers ship the codebase.",
  },
  {
    q: "Do you prefer papers or products?",
    a: "Both, depending on the thread. Research work should leave behind a reproducible method or result; startup work should leave behind a working prototype and a grounded decision. The application pitch should name the outcome you can advance in the first 30 days.",
  },
  {
    q: "What happens after I join?",
    a: "You create an account, walk through a four-step profile setup (background, interests, links, timezone), and land on your dashboard. From there you can browse open projects, read guides and paper reviews, RSVP to events, save items into collections, and apply to threads — each application sends your full profile to the project lead automatically.",
  },
  {
    q: "How do project applications work?",
    a: "Open a project page, write a short pitch (templates available), and submit. Your full profile attaches automatically — bio, background, interests, GitHub, LinkedIn. The lead reviews in the manage queue; you track status under Applications and get notified on change.",
  },
  {
    q: "Is membership free?",
    a: "Yes at launch. No payment step — create an account, finish your profile, and you have access to the full member area: projects, reading paths, paper reviews, events, jobs, and the member directory.",
  },
] as const;

export const STATS = [
  ["Papers", "reviews and explainers"],
  ["Projects", "open research and builds"],
  ["Programs", "cohorts and workshops"],
  ["Records", "milestones and contributions"],
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
export const LINKEDIN_URL = "https://www.linkedin.com/in/ryan-gomez-03701b363/";

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
