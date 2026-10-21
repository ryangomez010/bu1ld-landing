import { eventRegistrationState } from "@/lib/event-state";
import { programApplicationState } from "@/lib/programs";
import type { Job, MlEvent, Program, Project } from "@/lib/types";

export type MemberOpportunityKind = "project" | "program" | "job" | "event";
export type MemberOpportunityState = "actionable" | "upcoming" | "browse";

export type MemberOpportunity = {
  id: string;
  kind: MemberOpportunityKind;
  state: MemberOpportunityState;
  title: string;
  summary: string;
  tags: string[];
  meta: string;
  href: string;
  actionLabel: string;
};

function projectOpportunity(project: Project): MemberOpportunity {
  const seats = Math.max(0, project.capacity - project.team_count);
  return {
    id: `project:${project.id}`,
    kind: "project",
    state: seats > 0 ? "actionable" : "browse",
    title: project.title,
    summary: project.description,
    tags: project.tags,
    meta:
      seats > 0
        ? `${seats} contributor ${seats === 1 ? "place" : "places"} currently unfilled`
        : "Project is open, but contributor capacity is currently full",
    href: `/projects/${project.slug}`,
    actionLabel: seats > 0 ? "Review & apply" : "Review project",
  };
}

function programOpportunity(program: Program, now: Date): MemberOpportunity {
  const applicationState = programApplicationState(program, now);
  const state: MemberOpportunityState =
    applicationState === "open"
      ? "actionable"
      : applicationState === "upcoming"
        ? "upcoming"
        : "browse";
  const date = program.applications_close_at
    ? `Applications close ${new Date(program.applications_close_at).toLocaleDateString()}`
    : applicationState === "upcoming"
      ? "Applications are not open yet"
      : applicationState === "closed"
        ? "Applications are closed"
        : "Application window is currently open";
  return {
    id: `program:${program.id}`,
    kind: "program",
    state,
    title: program.title,
    summary: program.summary,
    tags: [program.program_type],
    meta: date,
    href: `/programs/${program.slug}`,
    actionLabel:
      applicationState === "open"
        ? "Review & apply"
        : applicationState === "upcoming"
          ? "Review program"
          : "View closed program",
  };
}

function jobOpportunity(job: Job): MemberOpportunity {
  return {
    id: `job:${job.id}`,
    kind: "job",
    state: "actionable",
    title: job.title,
    summary: job.description,
    tags: [job.source, ...(job.employment_type ? [job.employment_type] : []), ...job.tags],
    meta: [job.company, job.location].filter(Boolean).join(" · ") || "Location not published",
    href: `/jobs/${job.slug}`,
    actionLabel: job.source === "internal" ? "Review & apply" : "View application route",
  };
}

function eventOpportunity(event: MlEvent, now: number): MemberOpportunity {
  const registration = eventRegistrationState(event, now);
  const state: MemberOpportunityState =
    registration === "open" || registration === "waitlist"
      ? "actionable"
      : registration === "closed"
        ? "browse"
        : "upcoming";
  const date = event.starts_at ?? event.start_date;
  return {
    id: `event:${event.id}`,
    kind: "event",
    state,
    title: event.title,
    summary: event.summary ?? "Event details are available on the event page.",
    tags: event.topics,
    meta:
      registration === "open"
        ? "Registration is open"
        : registration === "waitlist"
          ? "Waitlist is available"
          : registration === "closed"
            ? "Registration is closed"
            : date
              ? `Registration not confirmed · event date ${date.slice(0, 10)}`
              : "Schedule or registration not confirmed",
    href: `/events/${event.slug}`,
    actionLabel:
      registration === "open" || registration === "waitlist" ? "View registration" : "View event",
  };
}

/**
 * Creates a member-facing catalog from live published records only. This deliberately does not
 * turn unconfirmed events, full project seats, or closed programs into actionable calls to action.
 */
export function buildMemberOpportunities(
  input: { projects: Project[]; programs: Program[]; jobs: Job[]; events: MlEvent[] },
  now = new Date(),
): MemberOpportunity[] {
  const timestamp = now.getTime();
  return [
    ...input.projects.filter((project) => project.status === "open").map(projectOpportunity),
    ...input.programs.map((program) => programOpportunity(program, now)),
    ...input.jobs.map(jobOpportunity),
    ...input.events.map((event) => eventOpportunity(event, timestamp)),
  ];
}

export function filterMemberOpportunities(
  items: MemberOpportunity[],
  filters: {
    kind: MemberOpportunityKind | "all";
    state: MemberOpportunityState | "all";
    query: string;
  },
) {
  const query = filters.query.trim().toLowerCase();
  return items.filter(
    (item) =>
      (filters.kind === "all" || item.kind === filters.kind) &&
      (filters.state === "all" || item.state === filters.state) &&
      (!query ||
        [item.title, item.summary, item.meta, ...item.tags]
          .join(" ")
          .toLowerCase()
          .includes(query)),
  );
}
