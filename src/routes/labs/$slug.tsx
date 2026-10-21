import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { InstitutionLayout } from "@/components/institution/InstitutionLayout";
import { COMPETITIONS, getLab, INSTITUTION_PROGRAMS } from "@/data/institution";
import { textAccent } from "@/data/landing";
import { fetchLabBySlug } from "@/lib/labs";
import { useProjectsQuery } from "@/lib/queries/use-projects";
import { PROJECT_STATUS_LABEL } from "@/data/seed/projects";
import { Button } from "@/components/ui/button";
import { pageHead, titleFromSlug } from "@/lib/seo";

export const Route = createFileRoute("/labs/$slug")({
  component: LabDetailPage,
  head: ({ params }) => {
    const lab = getLab(params.slug);
    return pageHead({
      title: `${lab?.name ?? titleFromSlug(params.slug)} — The Bu1ld`,
      description: lab?.summary ?? "Research division and connected projects at The Bu1ld.",
      path: `/labs/${encodeURIComponent(params.slug)}`,
    });
  },
});

function LabDetailPage() {
  const { slug } = Route.useParams();
  const {
    data: lab,
    isLoading: loading,
    isError: labError,
    isFetching: labFetching,
    refetch: retryLab,
  } = useQuery({
    queryKey: ["public-lab", slug],
    queryFn: () => fetchLabBySlug(slug),
    staleTime: 60_000,
    retry: false,
  });
  const {
    data: catalog,
    isLoading: projectsLoading,
    isError: projectsError,
    isFetching: projectsFetching,
    refetch: retryProjects,
  } = useProjectsQuery();
  const projects = (catalog?.projects ?? []).filter((project) => project.lab_id === lab?.id);

  if (loading) {
    return (
      <InstitutionLayout eyebrow="Research lab" title="Loading…">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground animate-pulse">
          Loading lab…
        </p>
      </InstitutionLayout>
    );
  }

  if (labError) {
    return (
      <InstitutionLayout eyebrow="Research lab" title="We couldn’t load this lab.">
        <p role="alert" className="text-muted-foreground">
          Please try again, or return to the lab directory.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <Button
            type="button"
            variant="outline"
            disabled={labFetching}
            onClick={() => void retryLab()}
          >
            {labFetching ? "Retrying…" : "Retry lab"}
          </Button>
          <Link to="/labs" className="inline-flex min-h-11 items-center text-accent-blue">
            Browse labs →
          </Link>
        </div>
      </InstitutionLayout>
    );
  }

  if (!lab) {
    return (
      <InstitutionLayout eyebrow="Lab" title="Lab not found">
        <p className="text-muted-foreground">This lab does not exist.</p>
        <Link to="/labs" className="mt-6 inline-block text-accent-blue">
          Browse labs →
        </Link>
      </InstitutionLayout>
    );
  }

  const seedLab = getLab(slug);
  const related = seedLab
    ? INSTITUTION_PROGRAMS.filter((p) => seedLab.relatedProgramSlugs.includes(p.slug))
    : [];
  const relatedCompetitions = COMPETITIONS.filter((c) => c.labSlug === slug);

  return (
    <InstitutionLayout eyebrow="Research lab" title={lab.name} description={lab.summary}>
      <p
        className={`-mt-6 font-mono text-[11px] uppercase tracking-[0.2em] ${textAccent[lab.color] ?? "text-bone"}`}
      >
        {lab.tagline}
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
            Focus areas
          </h2>
          <ul className="mt-4 space-y-3">
            {lab.focus.map((item) => (
              <li
                key={item}
                className="border-l border-bone/20 pl-4 text-sm leading-relaxed text-bone"
              >
                {item}
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
            Methods
          </h2>
          <ul className="mt-4 space-y-3">
            {lab.methods.map((item) => (
              <li
                key={item}
                className="border-l border-accent-blue/30 pl-4 text-sm leading-relaxed text-muted-foreground"
              >
                {item}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-12 rounded-sm border border-border/50 bg-bone/[0.02] p-6">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
          Open role types
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {lab.open_roles.map((role) => (
            <Link
              key={role}
              to="/projects"
              className="inline-flex min-h-11 items-center rounded-sm border border-bone/20 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-bone transition hover:border-accent-blue/50 hover:text-accent-blue"
            >
              {role}
            </Link>
          ))}
        </div>
        <p className="mt-5 text-sm text-muted-foreground">
          These are role types within the lab, not confirmed vacancies. Published project listings
          show current openings, required skills, and capacity.{" "}
          <Link to="/apply" className="text-accent-blue hover:text-bone">
            Start the apply path →
          </Link>
        </p>
      </section>

      <section className="mt-12" aria-labelledby="lab-projects-title">
        <h2 id="lab-projects-title" className="font-display text-2xl text-bone">
          Linked projects
        </h2>
        {projectsError ? (
          <div role="alert" className="mt-4 rounded-sm border border-border/50 p-5">
            <p className="text-sm text-muted-foreground">
              {catalog
                ? "We couldn’t refresh the project directory. Last loaded listings may have changed."
                : "Project listings are temporarily unavailable. The lab description is still available above."}
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-4 min-h-11"
              disabled={projectsFetching}
              onClick={() => void retryProjects()}
            >
              {projectsFetching ? "Retrying…" : "Retry project listings"}
            </Button>
          </div>
        ) : null}
        {projectsLoading ? (
          <p role="status" className="mt-4 text-sm text-muted-foreground">
            Loading linked projects…
          </p>
        ) : projects.length > 0 ? (
          <div className="mt-4 space-y-3">
            {projects.map((project) => (
              <Link
                key={project.id}
                to="/projects/$slug"
                params={{ slug: project.slug }}
                className="block rounded-sm border border-border/40 p-4 transition hover:border-accent-blue/40"
              >
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-accent-blue">
                  {project.type} · {PROJECT_STATUS_LABEL[project.status] ?? project.status}
                </p>
                <p className="mt-2 font-display text-lg text-bone">{project.title}</p>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                  {project.description}
                </p>
              </Link>
            ))}
          </div>
        ) : !projectsError ? (
          <p className="mt-4 text-sm text-muted-foreground">
            {lab.id.startsWith("seed-")
              ? "The public lab catalog is available, but current project links for this lab could not be confirmed."
              : "No published projects are currently linked to this lab."}
          </p>
        ) : null}
        <Link
          to="/projects"
          className="mt-4 inline-flex min-h-11 items-center text-sm text-accent-blue hover:text-bone"
        >
          Browse all published projects →
        </Link>
      </section>

      {related.length > 0 ? (
        <section className="mt-12">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
            Related programs
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {related.map((program) => (
              <Link
                key={program.slug}
                to="/programs-public"
                hash={program.slug}
                className="rounded-sm border border-border/40 p-4 transition hover:border-accent-blue/40"
              >
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-accent-blue">
                  {program.kind}
                </p>
                <p className="mt-2 font-display text-lg text-bone">{program.name}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {relatedCompetitions.length > 0 ? (
        <section className="mt-12">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
            Related competitions
          </h2>
          <div className="mt-4 space-y-3">
            {relatedCompetitions.map((competition) => (
              <Link
                key={competition.slug}
                to="/competitions/$slug"
                params={{ slug: competition.slug }}
                className="block rounded-sm border border-border/40 p-4 transition hover:border-accent-blue/40"
              >
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-accent-blue">
                  {competition.status}
                </p>
                <p className="mt-2 font-display text-lg text-bone">{competition.name}</p>
                <p className="mt-2 text-sm text-muted-foreground">{competition.summary}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-12 rounded-sm border border-border/50 p-6">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
          Projects & publications
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Live project threads and paper reviews appear in the member portal once published. Browse{" "}
          <Link to="/projects" className="text-accent-blue hover:text-bone">
            open projects
          </Link>{" "}
          and{" "}
          <Link to="/publications" className="text-accent-blue hover:text-bone">
            publications
          </Link>{" "}
          for evidence-backed work tied to this lab’s methods.
        </p>
      </section>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link
          to="/apply"
          search={
            {
              program: seedLab?.relatedProgramSlugs[0] ?? "ai-builder-cohort",
            } as { program?: string }
          }
          className="rounded-sm bg-bone px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.22em] text-background transition hover:bg-accent-blue"
        >
          Apply to contribute
        </Link>
        <Link
          to="/labs"
          className="rounded-sm border border-bone/25 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground transition hover:text-bone"
        >
          All labs
        </Link>
      </div>
    </InstitutionLayout>
  );
}
