import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Code2,
  FlaskConical,
  ShieldCheck,
} from "lucide-react";

import { InstitutionLayout } from "@/components/institution/InstitutionLayout";
import { getGuideSummary } from "@/content/guides";
import {
  getRelatedResearchItems,
  getResearchBrief,
  getResearchPortfolioItem,
  PUBLIC_RESEARCH_PORTFOLIO,
  type ResearchBrief,
  type ResearchPortfolioItem,
} from "@/data/research-portfolio";
import type { GuideSummary } from "@/lib/types";
import { parseAtlasSearch, requirePublicRecord } from "@/lib/public-discovery";
import { pageHead, titleFromSlug } from "@/lib/seo";

export const Route = createFileRoute("/research-atlas/$slug")({
  validateSearch: parseAtlasSearch,
  loader: ({ params }) => ({
    project: requirePublicRecord(getResearchPortfolioItem(params.slug)),
    brief: requirePublicRecord(getResearchBrief(params.slug)),
  }),
  component: ResearchAtlasDetailPage,
  notFoundComponent: ResearchAtlasNotFound,
  head: ({ params }) => {
    const project = getResearchPortfolioItem(params.slug);
    const title = project?.title ?? titleFromSlug(params.slug);
    return pageHead({
      title: `${title} — BU1LD Research Atlas`,
      description:
        project?.summary ??
        "An evidence-bounded public research profile from the complete BU1LD research atlas.",
      path: `/research-atlas/${encodeURIComponent(params.slug)}`,
      robots: project ? "index, follow" : "noindex, nofollow",
    });
  },
});

function ResearchAtlasNotFound() {
  return (
    <InstitutionLayout
      eyebrow="Research atlas"
      title="Research line not found"
      description="This identifier is not part of the current public BU1LD research atlas."
    >
      <Link
        to="/research-atlas"
        className="inline-flex items-center gap-2 rounded-sm bg-bone px-4 py-2.5 font-mono text-[9px] uppercase tracking-[0.18em] text-background transition hover:bg-accent-blue"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Back to the atlas
      </Link>
    </InstitutionLayout>
  );
}

function ResearchAtlasDetailPage() {
  const { project, brief } = Route.useLoaderData() as {
    project: ResearchPortfolioItem;
    brief: ResearchBrief;
  };
  const search = Route.useSearch();

  const index = PUBLIC_RESEARCH_PORTFOLIO.findIndex((item) => item.slug === project.slug);
  const previous = PUBLIC_RESEARCH_PORTFOLIO[index - 1];
  const next = PUBLIC_RESEARCH_PORTFOLIO[index + 1];
  const related = getRelatedResearchItems(project.slug);
  const prerequisites = brief.prerequisiteLessons
    .map((slug) => getGuideSummary(slug))
    .filter((lesson): lesson is GuideSummary => lesson !== undefined);

  return (
    <InstitutionLayout
      eyebrow={`${project.kind} · ${project.stage}`}
      title={project.title}
      description={project.summary}
    >
      <Link
        to="/research-atlas"
        search={search}
        className="inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground transition hover:text-bone"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Complete research atlas
      </Link>

      {project.parentSlug ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Part of{" "}
          <Link
            to="/research-atlas/$slug"
            params={{ slug: project.parentSlug }}
            className="text-accent-blue underline underline-offset-4"
          >
            {getResearchPortfolioItem(project.parentSlug)?.title}
          </Link>
          . This page describes a subproject and does not add another independent project to the
          parent study.
        </p>
      ) : null}

      <nav aria-label="On this research page" className="mt-8 flex flex-wrap gap-2">
        {[
          ["question", "Question"],
          ["method", "Approach"],
          ["evaluation", "Evidence"],
          ["boundary", "Limitations"],
          ["next-step", "Next step"],
          ["prerequisites", "Preparation"],
          ["sources", "Sources"],
        ].map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            className="rounded-sm border border-border px-3 py-2 text-sm text-muted-foreground transition hover:border-accent-blue hover:text-bone focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-blue"
          >
            {label}
          </a>
        ))}
      </nav>

      <div className="mt-10 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(18rem,0.45fr)]">
        <section className="panel rounded-sm p-7" aria-labelledby="status-heading">
          <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-accent-green">
            Public status
          </p>
          <h2 id="status-heading" className="mt-3 font-display text-3xl text-bone">
            {project.publicStatus}
          </h2>
          <div className="mt-6 flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-border px-2.5 py-1 font-mono text-[8px] text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        </section>
        <aside className="panel rounded-sm p-7" aria-label="Research classification">
          <dl className="space-y-5">
            <div>
              <dt className="font-mono text-[8px] uppercase tracking-[0.18em] text-muted-foreground">
                Source review
              </dt>
              <dd className="mt-2 text-sm text-bone">
                <time dateTime={brief.reviewedAt}>{brief.reviewedAt}</time>
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[8px] uppercase tracking-[0.18em] text-muted-foreground">
                Evidence date
              </dt>
              <dd className="mt-2 text-sm text-bone">
                {brief.evidenceDate ?? "Not established by the public record"}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[8px] uppercase tracking-[0.18em] text-muted-foreground">
                Record type
              </dt>
              <dd className="mt-2 text-sm capitalize text-bone">{project.kind}</dd>
            </div>
            <div>
              <dt className="font-mono text-[8px] uppercase tracking-[0.18em] text-muted-foreground">
                Research stage
              </dt>
              <dd className="mt-2 text-sm capitalize text-bone">{project.stage}</dd>
            </div>
            <div>
              <dt className="font-mono text-[8px] uppercase tracking-[0.18em] text-muted-foreground">
                Atlas identity
              </dt>
              <dd className="mt-2 break-all font-mono text-[10px] text-bone/70">{project.slug}</dd>
            </div>
          </dl>
        </aside>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.42fr)]">
        <article className="min-w-0 space-y-10" aria-label="Research brief">
          {[
            ["question", "The research question", brief.question],
            ["method", "Approach and implementation", brief.method],
            ["evaluation", "Data, comparisons, and evidence", brief.evaluation],
          ].map(([id, title, text]) => (
            <section
              key={id}
              id={id}
              className="scroll-mt-28 border-t border-border/60 pt-7"
              aria-labelledby={`${id}-heading`}
            >
              <h2 id={`${id}-heading`} className="font-display text-2xl text-bone sm:text-3xl">
                {title}
              </h2>
              <p className="mt-4 max-w-[70ch] text-base leading-8 text-muted-foreground">{text}</p>
            </section>
          ))}
          {brief.interpretation ? (
            <section
              aria-labelledby="interpretation-heading"
              className="border-t border-border/60 pt-7"
            >
              <h2 id="interpretation-heading" className="font-display text-2xl text-bone">
                How to interpret the result
              </h2>
              <p className="mt-4 max-w-[70ch] text-base leading-8 text-muted-foreground">
                {brief.interpretation}
              </p>
            </section>
          ) : null}
        </article>
        <aside className="space-y-5" aria-label="Ownership and availability">
          <dl className="panel space-y-6 rounded-sm p-6 text-sm">
            <div>
              <dt className="font-mono text-[9px] uppercase tracking-[0.16em] text-accent-blue">
                Attribution
              </dt>
              <dd className="mt-2 leading-relaxed text-muted-foreground">{brief.owner}</dd>
            </div>
            <div>
              <dt className="font-mono text-[9px] uppercase tracking-[0.16em] text-accent-blue">
                Publication
              </dt>
              <dd className="mt-2 leading-relaxed text-muted-foreground">{brief.publication}</dd>
            </div>
            <div>
              <dt className="font-mono text-[9px] uppercase tracking-[0.16em] text-accent-blue">
                Participation
              </dt>
              <dd className="mt-2 leading-relaxed text-muted-foreground">{brief.recruitment}</dd>
            </div>
            {brief.aliases.length ? (
              <div>
                <dt className="font-mono text-[9px] uppercase tracking-[0.16em] text-accent-blue">
                  Source names
                </dt>
                <dd className="mt-2 leading-relaxed text-muted-foreground">
                  {brief.aliases.join(" · ")}
                </dd>
              </div>
            ) : null}
          </dl>
          <p className="text-sm leading-relaxed text-muted-foreground">
            The source-review date records editorial checking. It is not a new experiment,
            publication date, or independent reproduction.
          </p>
        </aside>
      </div>

      <section
        id="boundary"
        className="mt-10 scroll-mt-28 rounded-sm border border-accent-red/25 bg-accent-red/5 p-7 md:p-9"
        aria-labelledby="boundary-heading"
      >
        <ShieldCheck className="h-6 w-6 text-accent-red" aria-hidden />
        <p className="mt-5 font-mono text-[9px] uppercase tracking-[0.22em] text-accent-red">
          Claim boundary
        </p>
        <h2 id="boundary-heading" className="mt-2 font-display text-3xl text-bone">
          What the evidence does—and does not—support
        </h2>
        <p className="mt-5 max-w-4xl text-lg leading-relaxed text-muted-foreground">
          {project.evidenceBoundary}
        </p>
      </section>

      <section
        id="next-step"
        className="mt-10 scroll-mt-28 border-t border-border/60 pt-8"
        aria-labelledby="next-step-heading"
      >
        <h2 id="next-step-heading" className="font-display text-3xl text-bone">
          Next milestone
        </h2>
        <p className="mt-4 max-w-[70ch] text-base leading-8 text-muted-foreground">
          {brief.nextStep}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href="#prerequisites"
            className="inline-flex items-center gap-2 rounded-sm border border-border px-4 py-3 text-sm text-bone hover:border-accent-blue"
          >
            <BookOpen className="h-4 w-4" aria-hidden />
            Build the prerequisites
          </a>
          <Link
            to="/forms"
            className="inline-flex items-center gap-2 rounded-sm border border-border px-4 py-3 text-sm text-bone hover:border-accent-green"
          >
            Explore participation <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Participation routes describe available intake. An expression of interest does not
          guarantee a project place, authorship, or an assigned reviewer.
        </p>
      </section>

      <section
        id="prerequisites"
        className="mt-10 scroll-mt-28 border-t border-border/60 pt-8"
        aria-labelledby="prerequisites-heading"
      >
        <h2 id="prerequisites-heading" className="font-display text-3xl text-bone">
          Prepare to read this work
        </h2>
        <p className="mt-4 max-w-[75ch] text-sm leading-relaxed text-muted-foreground">
          These public lessons explain concepts used in this brief. They are preparation routes, not
          an eligibility requirement, an assessment of the project, or a confirmed placement.
        </p>
        <ul className="mt-6 divide-y divide-border/60">
          {prerequisites.map((lesson) => (
            <li key={lesson.slug} className="py-4">
              <Link
                to="/guides/$slug"
                params={{ slug: lesson.slug }}
                className="text-base text-accent-blue underline underline-offset-4"
              >
                {lesson.title}
              </Link>
              <p className="mt-2 max-w-[75ch] text-sm leading-relaxed text-muted-foreground">
                {lesson.description}
              </p>
            </li>
          ))}
        </ul>
        <Link to="/guides" className="mt-4 inline-flex min-h-11 items-center text-accent-blue">
          Browse every learning path <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
        </Link>
      </section>

      <section
        id="sources"
        className="mt-10 scroll-mt-28 border-t border-border/60 pt-8"
        aria-labelledby="sources-heading"
      >
        <h2 id="sources-heading" className="font-display text-3xl text-bone">
          Sources and reproducibility
        </h2>
        <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
          {brief.sources.map((source) => (
            <li key={source.label}>
              {source.url ? (
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-accent-blue underline decoration-accent-blue/40 underline-offset-4 hover:text-bone"
                >
                  {source.label}
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0" aria-label="opens in a new tab" />
                </a>
              ) : (
                source.label
              )}
            </li>
          ))}
        </ul>
        <p className="mt-4 max-w-[75ch] text-sm leading-relaxed text-muted-foreground">
          Source reading is not experimental reproduction. When only a public project description is
          available, this brief preserves its limits and does not supply an invented dataset, paper,
          benchmark table, or artifact link.
        </p>
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-2" aria-label="Research links">
        {project.repositoryUrl ? (
          <a
            href={project.repositoryUrl}
            target="_blank"
            rel="noreferrer"
            className="group rounded-sm border border-accent-blue/25 bg-accent-blue/5 p-6 transition hover:border-accent-blue/60"
          >
            <Code2 className="h-5 w-5 text-accent-blue" aria-hidden />
            <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.2em] text-accent-blue">
              Verified public source
            </p>
            <p className="mt-2 flex items-center gap-2 font-display text-2xl text-bone">
              Open repository
              <ArrowUpRight
                className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                aria-hidden
              />
            </p>
          </a>
        ) : (
          <div className="rounded-sm border border-border bg-bone/5 p-6">
            <BookOpen className="h-5 w-5 text-muted-foreground" aria-hidden />
            <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
              Public source
            </p>
            <p className="mt-2 font-display text-2xl text-bone">No repository URL verified</p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              The research record remains public without inventing or guessing a source destination.
            </p>
          </div>
        )}

        {project.portfolioRecordId ? (
          <Link
            to="/portfolio/$projectId"
            params={{ projectId: project.portfolioRecordId }}
            className="group rounded-sm border border-accent-green/25 bg-accent-green/5 p-6 transition hover:border-accent-green/60"
          >
            <FlaskConical className="h-5 w-5 text-accent-green" aria-hidden />
            <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.2em] text-accent-green">
              Connected source identity
            </p>
            <p className="mt-2 flex items-center gap-2 font-display text-2xl text-bone">
              Open portfolio profile
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden />
            </p>
          </Link>
        ) : (
          <div className="rounded-sm border border-border bg-bone/5 p-6">
            <FlaskConical className="h-5 w-5 text-muted-foreground" aria-hidden />
            <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
              Registry connection
            </p>
            <p className="mt-2 font-display text-2xl text-bone">Research-line page only</p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              No safe one-to-one mapping to the 20-identity control-plane registry is asserted.
            </p>
          </div>
        )}
      </section>

      {related.length ? (
        <section className="mt-14" aria-labelledby="related-research-heading">
          <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-accent-blue">
            Shared methods and domains
          </p>
          <h2 id="related-research-heading" className="mt-2 font-display text-3xl text-bone">
            Continue through related work
          </h2>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {related.map((item) => {
              const sharedTags = item.tags.filter((tag) => project.tags.includes(tag));
              return (
                <Link
                  key={item.slug}
                  to="/research-atlas/$slug"
                  params={{ slug: item.slug }}
                  search={search}
                  className="group flex flex-col rounded-sm border border-border p-5 transition hover:border-accent-blue/50 hover:bg-accent-blue/5"
                >
                  <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-muted-foreground">
                    {item.kind} · {item.stage}
                  </span>
                  <h3 className="mt-3 font-display text-xl text-bone">{item.title}</h3>
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                    {sharedTags.length
                      ? `Connected through ${sharedTags.join(", ")}.`
                      : "Connected through its research stage and record type."}
                  </p>
                  <span className="mt-auto inline-flex items-center gap-2 pt-5 font-mono text-[8px] uppercase tracking-[0.16em] text-accent-blue group-hover:text-bone">
                    Open research page <ArrowRight className="h-3 w-3" aria-hidden />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      <nav
        className="mt-14 grid gap-3 border-t border-border/60 pt-8 sm:grid-cols-2"
        aria-label="Research atlas pagination"
      >
        {previous ? (
          <Link
            to="/research-atlas/$slug"
            params={{ slug: previous.slug }}
            search={search}
            className="rounded-sm border border-border p-5 transition hover:border-bone/30 hover:bg-bone/5"
          >
            <span className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.18em] text-muted-foreground">
              <ArrowLeft className="h-3 w-3" aria-hidden /> Previous research line
            </span>
            <span className="mt-2 block font-display text-xl text-bone">{previous.title}</span>
          </Link>
        ) : (
          <div />
        )}
        {next ? (
          <Link
            to="/research-atlas/$slug"
            params={{ slug: next.slug }}
            search={search}
            className="rounded-sm border border-border p-5 text-right transition hover:border-bone/30 hover:bg-bone/5"
          >
            <span className="flex items-center justify-end gap-2 font-mono text-[8px] uppercase tracking-[0.18em] text-muted-foreground">
              Next research line <ArrowRight className="h-3 w-3" aria-hidden />
            </span>
            <span className="mt-2 block font-display text-xl text-bone">{next.title}</span>
          </Link>
        ) : null}
      </nav>
    </InstitutionLayout>
  );
}
