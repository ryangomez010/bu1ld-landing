import { Link } from "@tanstack/react-router";
import { ArrowUpRight, ShieldCheck } from "lucide-react";

import { SectionShell } from "@/components/landing/Section";
import { INSTITUTION_OVERVIEW } from "@/data/institution";

function InlineList({ items }: { items: readonly string[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-foreground/85">
      {items.map((item) => (
        <li key={item} className="flex items-center gap-2">
          <span className="h-1 w-1 rounded-full bg-accent-blue" aria-hidden="true" />
          {item}
        </li>
      ))}
    </ul>
  );
}

export function InstitutionOverviewSection() {
  return (
    <SectionShell
      id="institution"
      eyebrow="01"
      label="institution overview"
      title="Built to move ambitious research forward."
      subtitle={INSTITUTION_OVERVIEW.summary}
    >
      <dl className="grid border-y border-border/60 sm:grid-cols-3">
        {INSTITUTION_OVERVIEW.metrics.map((metric) => (
          <div
            key={metric.label}
            className="flex flex-col border-b border-border/60 py-6 last:border-b-0 sm:border-b-0 sm:border-r sm:px-6 sm:first:pl-0 sm:last:border-r-0 sm:last:pr-0"
          >
            <dt className="order-2 mt-2 text-sm text-muted-foreground">{metric.label}</dt>
            <dd className="order-1 font-display text-4xl tracking-tight text-bone md:text-5xl">
              {metric.value}
            </dd>
            <dd className="order-3 mt-3 font-mono text-[9px] uppercase tracking-[0.18em] text-bone/40">
              {metric.provenance}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-12 grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
        <section aria-labelledby="portfolio-heading">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent-green">
            Research portfolio
          </p>
          <h3 id="portfolio-heading" className="mt-3 font-display text-3xl text-bone">
            One community. Many technical fronts.
          </h3>
          <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
            Work spans machine learning, scientific computing, neural architectures, computational
            physics, and AI infrastructure. Each public project carries its own stage, evidence,
            limitations, and next decision.
          </p>

          <ul className="mt-7 grid gap-px overflow-hidden rounded-sm border border-border/60 bg-border/50 sm:grid-cols-2">
            {INSTITUTION_OVERVIEW.researchDomains.map((domain, index) => (
              <li
                key={domain}
                className="flex items-center gap-3 bg-background/90 px-4 py-3 text-sm"
              >
                <span className="font-mono text-[9px] text-accent-green">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {domain}
              </li>
            ))}
          </ul>

          <p className="mt-8 font-mono text-[9px] uppercase tracking-[0.2em] text-bone/40">
            Active initiatives
          </p>
          <div className="mt-3">
            <InlineList items={INSTITUTION_OVERVIEW.activeInitiatives} />
          </div>

          <Link
            to="/research-atlas"
            className="group mt-7 inline-flex min-h-11 items-center gap-2 text-sm text-accent-blue transition hover:text-bone"
          >
            Explore methods, status, and evidence
            <ArrowUpRight
              className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </section>

        <section className="border-t border-border/60 pt-8 lg:border-l lg:border-t-0 lg:pl-12 lg:pt-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent-blue">
            Distributed network
          </p>
          <h3 className="mt-3 font-display text-3xl text-bone">Global by design.</h3>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Contributors report ties to {INSTITUTION_OVERVIEW.contributorInstitutions.join(", ")}.
            Those affiliations describe individual contributors and do not imply institutional
            endorsement.
          </p>

          <dl className="mt-7 divide-y divide-border/60 border-y border-border/60">
            <div className="py-5">
              <dt className="font-mono text-[9px] uppercase tracking-[0.18em] text-bone/40">
                Reported support
              </dt>
              <dd className="mt-3 text-sm leading-relaxed text-foreground/85">
                {INSTITUTION_OVERVIEW.supportOrganizations.join(" · ")}
              </dd>
            </div>
            <div className="py-5">
              <dt className="font-mono text-[9px] uppercase tracking-[0.18em] text-bone/40">
                Collaboration network
              </dt>
              <dd className="mt-3 text-sm leading-relaxed text-foreground/85">
                {INSTITUTION_OVERVIEW.collaborationNetwork.join(" · ")}
              </dd>
            </div>
            <div className="py-5">
              <dt className="font-mono text-[9px] uppercase tracking-[0.18em] text-bone/40">
                International expansion
              </dt>
              <dd className="mt-3 text-sm leading-relaxed text-foreground/85">
                {INSTITUTION_OVERVIEW.internationalInitiatives.join(" · ")}
              </dd>
            </div>
          </dl>

          <Link
            to="/partnerships"
            className="group mt-7 inline-flex min-h-11 items-center gap-2 text-sm text-accent-blue transition hover:text-bone"
          >
            Review the network and relationship status
            <ArrowUpRight
              className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </section>
      </div>

      <section
        className="mt-14 border-t border-border/60 pt-10"
        aria-labelledby="priorities-heading"
      >
        <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent-red">
              Current priorities
            </p>
            <h3 id="priorities-heading" className="mt-3 font-display text-3xl text-bone">
              Turn activity into durable output.
            </h3>
          </div>
          <p className="leading-relaxed text-muted-foreground">
            Researcher recruitment, technical evaluations, conference submissions, open-source
            engineering, and large-scale competitions continue in parallel.
          </p>
        </div>

        <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {INSTITUTION_OVERVIEW.currentPriorities.map((item, index) => (
            <li key={item} className="border-l border-border/70 pl-4">
              <span className="font-mono text-[9px] text-accent-blue">
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className="mt-3 text-sm leading-relaxed text-foreground/85">{item}</p>
            </li>
          ))}
        </ol>

        <div className="mt-9 flex flex-col gap-3 border-t border-border/40 pt-6 sm:flex-row sm:items-start">
          <p className="shrink-0 font-mono text-[9px] uppercase tracking-[0.2em] text-bone/40">
            Work underway
          </p>
          <InlineList items={INSTITUTION_OVERVIEW.ongoingWork} />
        </div>
      </section>

      <aside className="mt-10 flex gap-4 rounded-sm border border-accent-blue/20 bg-accent-blue/[0.035] p-5">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent-blue" aria-hidden="true" />
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-accent-blue">
            Claim boundary
          </p>
          <p className="mt-2 max-w-5xl text-xs leading-relaxed text-muted-foreground">
            {INSTITUTION_OVERVIEW.qualification}
          </p>
          <Link
            to="/evidence"
            className="mt-3 inline-flex min-h-9 items-center text-xs text-bone underline decoration-border underline-offset-4 transition hover:text-accent-blue"
          >
            Inspect the public evidence register
          </Link>
        </div>
      </aside>
    </SectionShell>
  );
}
