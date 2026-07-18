import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { InstitutionLayout } from "@/components/institution/InstitutionLayout";
import { COMPETITIONS, getLab, INSTITUTION_PROGRAMS } from "@/data/institution";
import { textAccent } from "@/data/landing";
import { fetchLabBySlug } from "@/lib/labs";
import { fetchProjects } from "@/lib/projects";
import type { Lab, Project } from "@/lib/types";

export const Route = createFileRoute("/labs/$slug")({
  component: LabDetailPage,
  head: ({ params }) => {
    const lab = getLab(params.slug);
    return {
      meta: [
        { title: lab ? `${lab.name} — The Bu1ld` : "Lab — The Bu1ld" },
        {
          name: "description",
          content: lab?.summary ?? "Research lab at The Bu1ld.",
        },
      ],
    };
  },
});

function LabDetailPage() {
  const { slug } = Route.useParams();
  const [lab, setLab] = useState<Lab | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [labRow, allProjects] = await Promise.all([fetchLabBySlug(slug), fetchProjects()]);
      if (cancelled) return;
      setLab(labRow);
      if (labRow) {
        setProjects(allProjects.filter((p) => p.lab_id === labRow.id));
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <InstitutionLayout eyebrow="Research lab" title="Loading…">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground animate-pulse">
          Loading lab…
        </p>
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
              className="rounded-sm border border-bone/20 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-bone transition hover:border-accent-blue/50 hover:text-accent-blue"
            >
              {role}
            </Link>
          ))}
        </div>
        <p className="mt-5 text-sm text-muted-foreground">
          Role types are filled through project applications — open a project listing, read required
          skills, and submit a pitch.{" "}
          <Link to="/apply" className="text-accent-blue hover:text-bone">
            Start the apply path →
          </Link>
        </p>
      </section>

      {projects.length > 0 ? (
        <section className="mt-12">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
            Open projects
          </h2>
          <div className="mt-4 space-y-3">
            {projects.map((project) => (
              <Link
                key={project.id}
                to="/projects/$slug"
                params={{ slug: project.slug }}
                className="block rounded-sm border border-border/40 p-4 transition hover:border-accent-blue/40"
              >
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-accent-blue">
                  {project.type} · {project.status}
                </p>
                <p className="mt-2 font-display text-lg text-bone">{project.title}</p>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                  {project.description}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

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
