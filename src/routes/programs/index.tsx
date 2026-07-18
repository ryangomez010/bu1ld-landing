import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { RequireMember } from "@/components/auth/RequireAuth";
import { EmptyState } from "@/components/member/ContentCard";
import { FilterChip } from "@/components/member/FilterChip";
import { ListSkeleton } from "@/components/member/LoadingState";
import { MemberLayout } from "@/components/member/MemberLayout";
import { Input } from "@/components/ui/input";
import { fetchPrograms, programApplicationState } from "@/lib/programs";
import type { Program, ProgramType } from "@/lib/types";

export const Route = createFileRoute("/programs/")({
  component: ProgramsPage,
  head: () => ({ meta: [{ title: "Programs — The Bu1ld" }] }),
});

function ProgramsPage() {
  return (
    <RequireMember>
      <ProgramsContent />
    </RequireMember>
  );
}

function ProgramsContent() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<ProgramType | "all">("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    void fetchPrograms().then((items) => {
      setPrograms(items);
      setLoading(false);
    });
  }, []);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return programs.filter((program) => {
      if (type !== "all" && program.program_type !== type) return false;
      return !needle || `${program.title} ${program.summary}`.toLowerCase().includes(needle);
    });
  }, [programs, query, type]);

  return (
    <MemberLayout title="Programs" eyebrow="cohorts, fellowships & workshops">
      <p className="-mt-4 mb-7 max-w-2xl text-muted-foreground leading-relaxed">
        Time-bounded working programs for people who want structured feedback, accountable output,
        and a clear end state. Programs are distinct from open projects: apply for a defined cycle,
        then leave with an artifact, a research record, or a working prototype.
      </p>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {(["all", "cohort", "fellowship", "workshop", "incubation", "competition"] as const).map(
          (item) => (
            <FilterChip key={item} active={type === item} onClick={() => setType(item)}>
              {item}
            </FilterChip>
          ),
        )}
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search programs"
          className="ml-auto max-w-xs font-mono text-xs"
        />
      </div>
      {loading ? (
        <ListSkeleton rows={3} />
      ) : visible.length === 0 ? (
        <EmptyState
          title="No programs in this view"
          body="Programs are published only when their scope, dates, and application path are confirmed. Check Events for upcoming public workshops."
        />
      ) : (
        <div className="grid gap-2">
          {visible.map((program) => (
            <Link
              key={program.id}
              to="/programs/$slug"
              params={{ slug: program.slug }}
              className="panel panel-interactive block rounded-sm p-6"
            >
              <span className="font-mono text-[9px] tracking-[0.25em] uppercase text-accent-green">
                {program.program_type}
              </span>
              <h2 className="mt-3 font-display text-xl tracking-tight text-bone">
                {program.title}
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                {program.summary}
              </p>
              <p className="mt-4 font-mono text-[9px] tracking-[0.18em] uppercase text-muted-foreground">
                {program.starts_at
                  ? `Starts ${new Date(program.starts_at).toLocaleDateString()}`
                  : "Dates to be announced"}
                {program.capacity ? ` · ${program.capacity} places` : ""}
              </p>
              <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.16em] text-accent-blue">
                Applications {programApplicationState(program)}
                {program.applications_close_at && programApplicationState(program) === "open"
                  ? ` · close ${new Date(program.applications_close_at).toLocaleDateString()}`
                  : ""}
              </p>
            </Link>
          ))}
        </div>
      )}
    </MemberLayout>
  );
}
