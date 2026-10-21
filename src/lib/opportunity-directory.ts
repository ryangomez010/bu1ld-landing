import { INSTITUTION_PROGRAMS, LABS } from "@/data/institution";

export const OPPORTUNITY_CHECKED_AT = "2026-10-16";
export const OPPORTUNITY_TOPICS = LABS.map((lab) => ({ value: lab.slug, label: lab.shortName }));
export const OPPORTUNITY_OPTIONS = {
  type: [
    ["all", "All paths"],
    ["program", "Program formats"],
    ["research", "Research directions"],
  ],
  experience: [
    ["all", "Any experience focus"],
    ["advanced", "Advanced research"],
    ["builders", "Builders / engineers"],
    ["mixed", "Individuals / teams"],
    ["unknown", "Not confirmed"],
  ],
  location: [
    ["all", "Any location"],
    ["unknown", "Not confirmed"],
  ],
  commitment: [
    ["all", "Any commitment"],
    ["part-time", "6–12 hours / week"],
    ["intensive", "15+ hours / week"],
    ["variable", "Challenge-specific"],
    ["unknown", "Not confirmed"],
  ],
  deadline: [
    ["all", "Any deadline"],
    ["dated", "Published deadline"],
    ["rolling", "Confirmed rolling intake"],
    ["unknown", "Not confirmed"],
  ],
  status: [
    ["current", "Current interest pages"],
    ["all", "All, including archive"],
    ["open", "Confirmed open"],
    ["interest-only", "Interest only"],
    ["closed", "Closed / expired"],
    ["archived", "Archived"],
  ],
  sort: [
    ["name", "Name A–Z"],
    ["deadline", "Deadline, earliest first"],
    ["checked", "Most recently checked"],
  ],
  saved: [
    ["all", "All interests"],
    ["saved", "Saved on this device"],
  ],
} as const;

type FilterKey = keyof typeof OPPORTUNITY_OPTIONS;
export type OpportunitySearch = Record<FilterKey, string> & { q: string; topic: string };
export type Opportunity = {
  id: string;
  type: "program" | "research";
  slug: string;
  name: string;
  summary: string;
  topics: string[];
  experience: string;
  eligibility: string;
  commitment: string;
  commitmentBand: string;
  location: "unknown";
  deadline: string | null;
  rollingConfirmed: boolean;
  status: "interest-only" | "open" | "closed" | "archived";
  /** A catalog's aspirational status never establishes operational approval. */
  operationallyConfirmed: boolean;
  timeline: string;
  outputs: string[];
  checkedAt: string;
};

const programCategories: Record<string, [string, string]> = {
  "research-fellowship": ["advanced", "part-time"],
  "startup-incubation": ["builders", "intensive"],
  "ai-builder-cohort": ["builders", "part-time"],
  "open-competitions": ["mixed", "variable"],
};

const programInterests: Opportunity[] = INSTITUTION_PROGRAMS.map((program) => ({
  id: `program:${program.slug}`,
  type: "program",
  slug: program.slug,
  name: program.name,
  summary: program.summary,
  topics: LABS.filter((lab) => lab.relatedProgramSlugs.includes(program.slug)).map(
    (lab) => lab.slug,
  ),
  experience: programCategories[program.slug]?.[0] ?? "unknown",
  eligibility: program.whoFor,
  commitment: program.commitment,
  commitmentBand: programCategories[program.slug]?.[1] ?? "unknown",
  location: "unknown",
  deadline: null,
  rollingConfirmed: false,
  status: "interest-only",
  operationallyConfirmed: false,
  timeline: program.timeline,
  outputs: program.outcomes,
  checkedAt: OPPORTUNITY_CHECKED_AT,
}));

export const OPPORTUNITIES: Opportunity[] = [
  ...programInterests,
  ...LABS.map(
    (lab): Opportunity => ({
      id: `research:${lab.slug}`,
      type: "research",
      slug: lab.slug,
      name: lab.name,
      summary: lab.summary,
      topics: [lab.slug],
      experience: "unknown",
      eligibility:
        "Eligibility and prerequisites depend on a scoped project; not confirmed for a placement.",
      commitment: "Not confirmed; agree a bounded scope and reviewer before starting.",
      commitmentBand: "unknown",
      location: "unknown",
      deadline: null,
      rollingConfirmed: false,
      status: "interest-only",
      operationallyConfirmed: false,
      timeline: "Research direction for exploration. No active role or intake window confirmed.",
      outputs: lab.focus,
      checkedAt: OPPORTUNITY_CHECKED_AT,
    }),
  ),
  // The catalog explicitly records an ended wave. Preserve it as history, not a new intake.
  ...programInterests
    .filter((program) => program.slug === "ai-builder-cohort")
    .map(
      (program): Opportunity => ({
        ...program,
        id: "archive:ai-builder-cohort-q2-2026",
        name: "AI Builder Cohort — historical Q2 2026 wave",
        summary:
          "The program catalog records that this wave has ended. Successor dates and reviewer capacity are unconfirmed.",
        status: "archived",
        timeline:
          "Historical Q2 2026 wave ended; exact application and start dates are not recorded here.",
      }),
    ),
];

export function parseOpportunitySearch(input: Record<string, unknown>): OpportunitySearch {
  const normalized = Object.fromEntries(
    Object.entries(OPPORTUNITY_OPTIONS).map(([key, options]) => [
      key,
      typeof input[key] === "string" && options.some(([value]) => value === input[key])
        ? input[key]
        : options[0][0],
    ]),
  ) as Record<FilterKey, string>;
  return {
    ...normalized,
    q: typeof input.q === "string" ? input.q.trim().slice(0, 120) : "",
    topic:
      typeof input.topic === "string" &&
      OPPORTUNITY_TOPICS.some(({ value }) => value === input.topic)
        ? input.topic
        : "all",
  };
}

export function opportunityStatus(item: Opportunity, now: number) {
  if (item.status === "archived" || item.status === "closed") return item.status;
  if (!item.operationallyConfirmed) return "interest-only";
  if (item.deadline && Date.parse(item.deadline) <= now) return "closed";
  return item.status;
}

export function filterOpportunities(
  items: Opportunity[],
  search: OpportunitySearch,
  { now, savedIds }: { now: number; savedIds?: readonly string[] },
) {
  const query = search.q.toLowerCase();
  return items
    .filter((item) => {
      const status = opportunityStatus(item, now);
      const text = [
        item.name,
        item.summary,
        item.eligibility,
        item.commitment,
        ...item.outputs,
        ...item.topics.map(
          (topic) => OPPORTUNITY_TOPICS.find(({ value }) => value === topic)?.label ?? topic,
        ),
      ]
        .join(" ")
        .toLowerCase();
      return (
        (!query || text.includes(query)) &&
        (search.type === "all" || item.type === search.type) &&
        (search.topic === "all" || item.topics.includes(search.topic)) &&
        (search.experience === "all" || item.experience === search.experience) &&
        (search.location === "all" || item.location === search.location) &&
        (search.commitment === "all" || item.commitmentBand === search.commitment) &&
        (search.status === "all" ||
          (search.status === "current"
            ? status !== "archived" && status !== "closed"
            : status === search.status)) &&
        (search.deadline === "all" ||
          (search.deadline === "dated"
            ? Boolean(item.deadline)
            : search.deadline === "rolling"
              ? item.rollingConfirmed && item.operationallyConfirmed
              : !item.deadline && !item.rollingConfirmed)) &&
        (search.saved !== "saved" || savedIds === undefined || savedIds.includes(item.id))
      );
    })
    .sort((a, b) => {
      if (search.sort === "deadline") {
        const delta =
          (a.deadline ? Date.parse(a.deadline) : Infinity) -
          (b.deadline ? Date.parse(b.deadline) : Infinity);
        if (Number.isFinite(delta) && delta !== 0) return delta;
        if (Boolean(a.deadline) !== Boolean(b.deadline)) return a.deadline ? -1 : 1;
      }
      if (search.sort === "checked" && a.checkedAt !== b.checkedAt)
        return b.checkedAt.localeCompare(a.checkedAt);
      return a.name.localeCompare(b.name);
    });
}

export const INTEREST_STORAGE_KEY = "bu1ld:opportunity-interests:v1";
type InterestStorage = Pick<Storage, "getItem" | "setItem">;
export function readSavedInterests(storage: InterestStorage) {
  try {
    const parsed: unknown = JSON.parse(storage.getItem(INTEREST_STORAGE_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return { ids: [], available: true };
    const valid = new Set(OPPORTUNITIES.map((item) => item.id));
    return {
      ids: [
        ...new Set(parsed.filter((id): id is string => typeof id === "string" && valid.has(id))),
      ],
      available: true,
    };
  } catch {
    return { ids: [], available: false };
  }
}

export function saveInterests(storage: InterestStorage, ids: readonly string[]) {
  try {
    const valid = new Set(OPPORTUNITIES.map((item) => item.id));
    storage.setItem(
      INTEREST_STORAGE_KEY,
      JSON.stringify([...new Set(ids.filter((id) => valid.has(id)))]),
    );
    return true;
  } catch {
    return false;
  }
}
