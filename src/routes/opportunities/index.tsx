import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { RequireMember } from "@/components/auth/RequireAuth";
import { EmptyState } from "@/components/member/ContentCard";
import { FilterChip } from "@/components/member/FilterChip";
import { ListSkeleton } from "@/components/member/LoadingState";
import { MemberLayout } from "@/components/member/MemberLayout";
import { Input } from "@/components/ui/input";
import { fetchEvents } from "@/lib/content";
import {
  buildMemberOpportunities,
  filterMemberOpportunities,
  type MemberOpportunityKind,
  type MemberOpportunityState,
} from "@/lib/member-opportunities";
import { fetchPrograms } from "@/lib/programs";
import { fetchJobs, fetchProjects } from "@/lib/projects";
import { isDemoMode } from "@/lib/supabase-fallback";
import type { Job, MlEvent, Program, Project } from "@/lib/types";

export const Route = createFileRoute("/opportunities/")({
  component: OpportunitiesPage,
  head: () => ({ meta: [{ title: "Opportunities — The Bu1ld" }] }),
});

const EMPTY_PROJECTS: Project[] = [];
const EMPTY_PROGRAMS: Program[] = [];
const EMPTY_JOBS: Job[] = [];
const EMPTY_EVENTS: MlEvent[] = [];

function OpportunitiesPage() {
  return (
    <RequireMember>
      <OpportunitiesContent />
    </RequireMember>
  );
}

function OpportunitiesContent() {
  const demoMode = isDemoMode();
  const [projects, setProjects] = useState<Project[]>(EMPTY_PROJECTS);
  const [programs, setPrograms] = useState<Program[]>(EMPTY_PROGRAMS);
  const [jobs, setJobs] = useState<Job[]>(EMPTY_JOBS);
  const [events, setEvents] = useState<MlEvent[]>(EMPTY_EVENTS);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [kind, setKind] = useState<MemberOpportunityKind | "all">("all");
  const [state, setState] = useState<MemberOpportunityState | "all">("actionable");
  const [query, setQuery] = useState("");

  const load = () => {
    setLoading(true);
    setFailed(false);
    void Promise.all([fetchProjects("open"), fetchPrograms(), fetchJobs(), fetchEvents()])
      .then(([nextProjects, nextPrograms, nextJobs, nextEvents]) => {
        setProjects(nextProjects);
        setPrograms(nextPrograms);
        setJobs(nextJobs);
        setEvents(nextEvents);
      })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const all = useMemo(
    () => buildMemberOpportunities({ projects, programs, jobs, events }),
    [projects, programs, jobs, events],
  );
  const visible = useMemo(
    () => filterMemberOpportunities(all, { kind, state, query }),
    [all, kind, state, query],
  );
  const count = (nextKind: MemberOpportunityKind | "all") =>
    all.filter(
      (item) =>
        (nextKind === "all" || item.kind === nextKind) && (state === "all" || item.state === state),
    ).length;

  return (
    <MemberLayout title="Opportunities" eyebrow="find a real next step">
      <p className="-mt-4 mb-7 max-w-3xl leading-relaxed text-muted-foreground">
        One place for published projects, programs, jobs, and event registrations. “Ready now” is
        deliberately conservative: it only shows a record when its own current status supports an
        application, registration, or direct next step.
      </p>

      {demoMode ? (
        <div
          role="status"
          className="mb-6 max-w-3xl rounded-sm border border-accent-blue/40 bg-accent-blue/5 px-4 py-3 text-sm text-muted-foreground"
        >
          Demo mode is active. Records shown here are examples for local interface testing only;
          they are not confirmed BU1LD openings and no real application or registration is sent.
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-2" aria-label="Opportunity type">
        {(["all", "project", "program", "job", "event"] as const).map((item) => (
          <FilterChip key={item} active={kind === item} onClick={() => setKind(item)}>
            {item === "all" ? `All (${count("all")})` : `${item}s (${count(item)})`}
          </FilterChip>
        ))}
      </div>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {(["actionable", "upcoming", "browse", "all"] as const).map((item) => (
          <FilterChip key={item} active={state === item} onClick={() => setState(item)}>
            {item === "actionable" ? "Ready now" : item === "browse" ? "View-only" : item}
          </FilterChip>
        ))}
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value.slice(0, 120))}
          className="ml-auto max-w-xs font-mono text-xs"
          placeholder="Search title, role, topic…"
          aria-label="Search opportunities"
        />
      </div>

      {loading ? (
        <ListSkeleton rows={5} />
      ) : failed ? (
        <EmptyState
          title="Opportunities could not load"
          body="No availability is assumed when a catalog request fails. Try again before relying on this view."
          action={
            <button type="button" onClick={load} className="text-accent-blue">
              Retry →
            </button>
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState
          title={
            state === "actionable" ? "Nothing ready for action right now" : "No opportunities match"
          }
          body={
            state === "actionable"
              ? "This does not mean the organization has no future work. It means no returned record currently supports a verified next step under these filters."
              : "Try another type, status, or search term."
          }
          action={
            state === "actionable" ? (
              <button type="button" onClick={() => setState("all")} className="text-accent-blue">
                Browse all published records →
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-px border border-border/40 bg-border/40">
          {visible.map((opportunity) => (
            <article key={opportunity.id} className="bg-background/75 p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-accent-blue">
                  {opportunity.kind}
                </span>
                <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                  {opportunity.state === "actionable" ? "ready now" : opportunity.state}
                </span>
              </div>
              <h2 className="mt-3 font-display text-xl text-bone">{opportunity.title}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                {opportunity.summary}
              </p>
              <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.14em] text-bone/60">
                {opportunity.meta}
              </p>
              {opportunity.tags.length ? (
                <p className="mt-2 text-xs text-muted-foreground">{opportunity.tags.join(" · ")}</p>
              ) : null}
              <a
                href={opportunity.href}
                className="mt-5 inline-block font-mono text-[10px] uppercase tracking-[0.18em] text-accent-green hover:text-bone"
              >
                {opportunity.actionLabel} →
              </a>
            </article>
          ))}
        </div>
      )}
    </MemberLayout>
  );
}
