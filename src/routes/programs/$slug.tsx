import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { RequireMember } from "@/components/auth/RequireAuth";
import { MemberLayout } from "@/components/member/MemberLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getProgram } from "@/data/institution";
import { useAuth } from "@/lib/auth";
import {
  applyToProgram,
  fetchMyProgramApplication,
  fetchProgramBySlug,
  programApplicationState,
  withdrawProgramApplication,
} from "@/lib/programs";
import type { Program, ProgramApplication } from "@/lib/types";

export const Route = createFileRoute("/programs/$slug")({
  component: ProgramDetailPage,
});

function ProgramDetailPage() {
  return (
    <RequireMember>
      <ProgramDetail />
    </RequireMember>
  );
}

function ProgramDetail() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const [program, setProgram] = useState<Program | null>(null);
  const [application, setApplication] = useState<ProgramApplication | null>(null);
  const [statement, setStatement] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void fetchProgramBySlug(slug).then(async (item) => {
      setProgram(item);
      if (item && user) setApplication(await fetchMyProgramApplication(user.id, item.id));
      setLoading(false);
    });
  }, [slug, user]);

  const onApply = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!program || !user) return;
    setSubmitting(true);
    const { error } = await applyToProgram(user.id, program.id, statement);
    setSubmitting(false);
    if (error) return toast.error(error);
    const next = await fetchMyProgramApplication(user.id, program.id);
    setApplication(next);
    toast.success("Program application submitted.");
  };

  if (loading) {
    return (
      <MemberLayout title="Program">
        <p className="font-mono text-xs text-muted-foreground">Loading program…</p>
      </MemberLayout>
    );
  }
  if (!program) {
    const catalog = getProgram(slug);
    if (catalog && catalog.slug !== "open-competitions") {
      return (
        <MemberLayout title={catalog.name} eyebrow={catalog.kind}>
          <p className="-mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground">
            {catalog.summary}
          </p>
          <dl className="mt-7 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="font-mono text-[8px] uppercase text-muted-foreground">Objective</dt>
              <dd className="mt-2 text-sm text-bone">{catalog.objective}</dd>
            </div>
            <div>
              <dt className="font-mono text-[8px] uppercase text-muted-foreground">Audience</dt>
              <dd className="mt-2 text-sm text-bone">{catalog.whoFor}</dd>
            </div>
            <div>
              <dt className="font-mono text-[8px] uppercase text-muted-foreground">Commitment</dt>
              <dd className="mt-2 text-sm text-bone">{catalog.commitment}</dd>
            </div>
            <div>
              <dt className="font-mono text-[8px] uppercase text-muted-foreground">Selection</dt>
              <dd className="mt-2 text-sm text-bone">{catalog.selectivity}</dd>
            </div>
            <div>
              <dt className="font-mono text-[8px] uppercase text-muted-foreground">Timeline</dt>
              <dd className="mt-2 text-sm text-bone">{catalog.timeline}</dd>
            </div>
            <div>
              <dt className="font-mono text-[8px] uppercase text-muted-foreground">Status</dt>
              <dd className="mt-2 text-sm text-bone">{catalog.status}</dd>
            </div>
          </dl>
          <h2 className="mt-8 font-display text-xl text-bone">Expected output</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {catalog.outcomes.map((outcome) => (
              <li key={outcome}>· {outcome}</li>
            ))}
          </ul>
          <p className="mt-8 rounded-sm border border-border/50 bg-bone/[0.03] p-4 text-sm text-muted-foreground">
            This track is defined in the institution catalog. Live applications open when an
            administrator publishes a dated cycle in the member programs list. Until then, finish
            your profile and watch announcements — or apply to an open project.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/programs" className="text-sm text-accent-blue">
              Browse published programs →
            </Link>
            <Link to="/projects" className="text-sm text-accent-blue">
              Browse projects →
            </Link>
          </div>
        </MemberLayout>
      );
    }
    return (
      <MemberLayout title="Program not found">
        <p className="text-muted-foreground">
          This program is unavailable or has not been published.
        </p>
        <Link to="/programs" className="mt-5 inline-block text-sm text-accent-blue">
          Browse programs →
        </Link>
      </MemberLayout>
    );
  }

  const applicationState = programApplicationState(program);

  return (
    <MemberLayout title={program.title} eyebrow={program.program_type}>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section>
          <p className="-mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground">
            {program.summary}
          </p>
          <dl className="mt-7 grid gap-px border border-border/50 bg-border/50 sm:grid-cols-3">
            <div className="bg-background p-4">
              <dt className="font-mono text-[8px] uppercase text-muted-foreground">Starts</dt>
              <dd className="mt-2 text-sm text-bone">
                {program.starts_at ? new Date(program.starts_at).toLocaleDateString() : "TBA"}
              </dd>
            </div>
            <div className="bg-background p-4">
              <dt className="font-mono text-[8px] uppercase text-muted-foreground">Ends</dt>
              <dd className="mt-2 text-sm text-bone">
                {program.ends_at ? new Date(program.ends_at).toLocaleDateString() : "TBA"}
              </dd>
            </div>
            <div className="bg-background p-4">
              <dt className="font-mono text-[8px] uppercase text-muted-foreground">Capacity</dt>
              <dd className="mt-2 text-sm text-bone">{program.capacity ?? "TBA"}</dd>
            </div>
          </dl>
          {program.application_instructions ? (
            <section className="mt-8">
              <h2 className="font-display text-xl text-bone">How this works</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {program.application_instructions}
              </p>
            </section>
          ) : null}
          {program.outcomes ? (
            <section className="mt-8">
              <h2 className="font-display text-xl text-bone">Completion bar</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {program.outcomes}
              </p>
            </section>
          ) : null}
        </section>
        <aside className="h-fit rounded-sm border border-border/60 p-5">
          {application ? (
            <>
              <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-accent-green">
                Application {application.status}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Your statement has been recorded. Decisions and next steps appear in your
                notifications.
              </p>
              {application.review_note ? (
                <div className="mt-4 border-l-2 border-accent-blue/60 pl-3 text-sm leading-relaxed text-muted-foreground">
                  <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-accent-blue">
                    Programme team note
                  </p>
                  <p className="mt-1">{application.review_note}</p>
                </div>
              ) : null}
              {application.status === "pending" ? (
                <Button
                  type="button"
                  variant="outline"
                  className="mt-5 w-full"
                  onClick={() =>
                    void withdrawProgramApplication(user?.id ?? "", application.id).then(
                      ({ error }) => {
                        if (error) toast.error(error);
                        else {
                          setApplication(null);
                          toast.success("Application withdrawn.");
                        }
                      },
                    )
                  }
                >
                  Withdraw application
                </Button>
              ) : null}
            </>
          ) : applicationState === "open" ? (
            <form onSubmit={onApply} className="space-y-3">
              <Label htmlFor="program-statement">
                Why this program, and what will you produce?
              </Label>
              <Textarea
                id="program-statement"
                value={statement}
                onChange={(event) => setStatement(event.target.value)}
                minLength={40}
                rows={8}
                required
              />
              <p className="text-xs text-muted-foreground">
                Be concrete about the research question, build, or practice you will carry through
                the cycle.
              </p>
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? "Submitting…" : "Apply"}
              </Button>
            </form>
          ) : (
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent-blue">
                Applications {applicationState === "upcoming" ? "not yet open" : "closed"}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {applicationState === "upcoming" && program.applications_open_at
                  ? `Applications open ${new Date(program.applications_open_at).toLocaleString()}.`
                  : program.applications_close_at
                    ? `The application window closed ${new Date(program.applications_close_at).toLocaleString()}.`
                    : "This programme is not accepting further applications."}
              </p>
            </div>
          )}
        </aside>
      </div>
    </MemberLayout>
  );
}
