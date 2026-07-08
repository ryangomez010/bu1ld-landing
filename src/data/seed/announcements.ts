export type Announcement = {
  id: string;
  title: string;
  body: string;
  href: string | null;
  pinned: boolean;
  published: boolean;
  created_at: string;
};

export const SEED_ANNOUNCEMENTS: Announcement[] = [
  {
    id: "seed-week-ml",
    title: "This week in ML",
    body: "World models are having a moment — ICLR deadlines are stacking, and several BUILD threads are probing defect injection and latent recovery. Worth reading the JEPA guide if you're joining a world-model project.",
    href: "/guides/what-is-jepa",
    pinned: true,
    published: true,
    created_at: new Date().toISOString(),
  },
];

export const PITCH_TEMPLATES = [
  {
    id: "why-thread",
    label: "Why this thread?",
    prompt:
      "I'm drawn to this project because…\n\nRelevant experience:\n- \n\nWhat I'd ship in 30 days:\n- ",
  },
  {
    id: "ship-fast",
    label: "30-day ship plan",
    prompt:
      "Week 1: reproduce baseline / read core papers\nWeek 2: first prototype on synthetic data\nWeek 3: ablation + failure modes\nWeek 4: demo + write-up for the team",
  },
  {
    id: "research-angle",
    label: "Research angle",
    prompt:
      "Hypothesis I'd test:\n\nWhy it matters for BUILD:\n\nPrior work I've read:\n\nConcrete first experiment:",
  },
] as const;
