import { INSTITUTION_PROGRAMS, LABS } from "@/data/institution";
import { getResearchPortfolioItem } from "@/data/research-portfolio";

// Selection and visual treatment only; titles, claims and statuses have one source.
export const RESEARCH = (
  [
    ["counterfactual-defect-worlds", "red"],
    ["sapir-whorf-latent-language", "blue"],
    ["adaptive-theory-geometry", "green"],
    ["residual-event-tokenization", "bone"],
    ["pde-surrogate-phase-transitions", "blue"],
    ["latent-safety-recovery", "green"],
  ] as const
).map(([slug, color], index) => {
  const project = getResearchPortfolioItem(slug);
  if (!project) throw new Error(`Homepage research record missing: ${slug}`);
  return {
    id: String(index + 1).padStart(2, "0"),
    slug,
    name: project.title,
    color,
    href: `/research-atlas/${project.slug}`,
    desc: project.summary,
    status: project.publicStatus,
  };
});

export const PROGRAMS = [
  {
    tag: "P-01",
    name: "AI Builder Cohort",
    time: "12-week format · dates unconfirmed",
    to: "/programs-public",
    hash: "ai-builder-cohort",
    body: "A project-driven cohort for turning a scoped technical question into a reproducible prototype, clear documentation, and a final demo.",
  },
  {
    tag: "P-02",
    name: "Research Fellowship",
    time: "6-month format · dates unconfirmed",
    to: "/programs-public",
    hash: "research-fellowship",
    body: "A structured research cycle for developing a question, testing it with disciplined experiments, and publishing an evidence-backed project record.",
  },
  {
    tag: "P-03",
    name: "Startup Incubation",
    time: "Stage-gated format · intake unconfirmed",
    to: "/programs-public",
    hash: "startup-incubation",
    body: "For active builders who want to test whether a technical thread deserves a real product prototype and early user conversations.",
  },
] as const;

export const STARTUPS = [
  {
    name: "Open projects",
    stage: "research",
    domain: "Member portal",
    to: "/projects",
    hash: undefined,
    thesis:
      "Browse open research and product threads, see required skills and commitment, and apply with a concrete pitch.",
  },
  {
    name: "Startup incubation",
    stage: "interest-only",
    domain: "Programs",
    to: "/programs-public",
    hash: "startup-incubation",
    thesis:
      "A proposed format for testing prototypes with evaluators and explicit stop criteria. Dates, reviewer capacity, and open intake are unconfirmed.",
  },
  {
    name: "Evidence register",
    stage: "research",
    domain: "Credibility",
    to: "/evidence",
    hash: undefined,
    thesis:
      "Public claims require sources. Unsupported affiliation, customer, and benchmark language is not published.",
  },
  {
    name: "Contribution records",
    stage: "research",
    domain: "Projects",
    to: "/projects",
    hash: undefined,
    thesis:
      "Milestones, assigned review, and evidence URLs make progress legible without inflating outcomes.",
  },
] as const;

export const TEAM = [
  { name: "Ryan Gomez", role: "Founder, Research & Systems", initials: "RG", color: "blue" },
] as const;

export const STATS = [
  [`${LABS.length} labs`, "published research divisions"],
  [`${INSTITUTION_PROGRAMS.length} program formats`, "interest only · intake unconfirmed"],
  ["Evidence-first", "claims require sources"],
  ["Member portal", "apply, contribute, record work"],
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
    title: "Find work that fits",
    color: "blue",
    desc: "Compare project scope, required skills, and weekly commitment before you apply. Track your applications in one place.",
    to: "/projects",
    action: "Explore projects",
  },
  {
    id: "02",
    title: "Learn with a clear path",
    color: "green",
    desc: "Follow ordered ML learning paths, save your reading progress, and return to the next article when you are ready.",
    to: "/guides",
    action: "Open the public library",
  },
  {
    id: "03",
    title: "Read beyond the abstract",
    color: "red",
    desc: "Explore paper reviews that connect methods and limitations to questions you could test in your own work.",
    to: "/papers",
    action: "Browse paper reviews",
  },
  {
    id: "04",
    title: "Keep a record of your work",
    color: "bone",
    desc: "Attach evidence to project contributions, follow review feedback, and export your contribution log from the member workspace.",
    to: "/workspace",
    action: "Open your workspace",
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

export const NAV_ITEMS = [
  ["Projects", "/projects"],
  ["Labs", "/labs"],
  ["Programs", "/programs-public"],
  ["Publications", "/publications"],
  ["Evidence", "/evidence"],
  ["Research atlas", "/research-atlas"],
] as const;

/** In-page anchors still used on the landing scroll experience. */
export const LANDING_ANCHORS = [
  ["Overview", "institution"],
  ["Library", "library"],
  ["Open work", "active-work"],
  ["Membership", "membership"],
  ["How it works", "what"],
  ["Research", "research"],
  ["Programs", "programs"],
] as const;

export const DISCORD_URL = "https://discord.gg/NG4QYat4P";
export const CONTACT_EMAIL = "ryan@thebu1ld.com";
export const LINKEDIN_URL = "https://www.linkedin.com/in/ryan-gomez-03701b363/";

export const stageColor: Record<string, string> = {
  "interest-only": "text-bone border-bone/40",
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
  violet: "text-accent-violet",
  orange: "text-accent-orange",
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
