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
    body: "World models are active across several open projects — ICLR submission deadlines are listed under Events, and the JEPA guide is the recommended prerequisite if you are applying to a world-model thread.",
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
      "I'm applying because this thread needs…\n\nRelevant work (repo, paper, or shipped system):\n- \n\nFirst 30 days — concrete deliverable:\n- \n\nTimezone / hours per week:\n- ",
  },
  {
    id: "ship-fast",
    label: "30-day deliverable plan",
    prompt:
      "Week 1: reproduce baseline or re-implement core method from the thread's anchor paper\nWeek 2: first runnable prototype on project dataset\nWeek 3: ablation + document failure modes\nWeek 4: demo notebook + short write-up for lead review",
  },
  {
    id: "research-angle",
    label: "Research angle",
    prompt:
      "Hypothesis I would test on this thread:\n\nWhy it matters (metric or system constraint):\n\nPapers I have already read:\n\nFirst experiment — dataset, baseline, success criterion:",
  },
] as const;
