import { Link } from "@tanstack/react-router";
import { Wordmark } from "@/components/Wordmark";
import { SectionLabel } from "@/components/landing/Section";
import { trackEvent } from "@/lib/analytics";

export function HeroSection() {
  return (
    <section className="relative flex min-h-[92svh] items-start overflow-hidden pt-28 scanline md:pt-36">
      <div className="relative mx-auto flex min-h-[calc(92svh-7rem)] w-full max-w-7xl flex-col justify-between px-6 pb-10 md:min-h-[calc(92svh-9rem)] md:pb-12">
        <div className="absolute right-6 top-10 hidden flex-col items-end gap-1 font-mono text-[9px] uppercase text-bone/40 md:flex">
          <span>independent / distributed</span>
          <span>research + building</span>
        </div>
        <div className="max-w-5xl">
          <SectionLabel id="00">independent machine-learning work</SectionLabel>
          <h1 className="mt-7 font-display text-[clamp(2.7rem,7.4vw,7rem)] font-bold leading-[0.92]">
            <Wordmark />
            <span className="block text-foreground/90 mt-5">
              Join active technical projects.
              <br className="hidden md:block" />
              Leave{" "}
              <span className="italic text-bone relative">
                evidence others can inspect.
                <span className="caret-blink" />
              </span>
            </span>
          </h1>
          <p className="mt-8 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            The Bu1ld is an independent research and builder institution. Browse scoped work, see
            the skills and weekly commitment, apply to a project, and publish reviewed contribution
            evidence.
          </p>
          <p className="mt-4 max-w-xl text-sm text-muted-foreground/90">
            Projects are labeled recruiting, active, or completed. Public claims and contribution
            records require evidence; empty states stay empty.
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            <Link
              to="/projects"
              onClick={() =>
                trackEvent("landing_primary_cta_clicked", { destination: "/projects" })
              }
              className="group inline-flex items-center gap-3 rounded-sm bg-bone px-7 py-3.5 font-mono text-[11px] uppercase text-background transition-all duration-200 hover:bg-accent-blue active:scale-[0.98] glow-bone"
            >
              Find a project{" "}
              <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
            </Link>
            <Link
              to="/evidence"
              onClick={() =>
                trackEvent("landing_evidence_cta_clicked", { destination: "/evidence" })
              }
              className="inline-flex items-center gap-3 rounded-sm border border-bone/25 px-7 py-3.5 font-mono text-[11px] uppercase transition-all duration-200 hover:border-bone/50 hover:bg-bone/5 active:scale-[0.98]"
            >
              Inspect public evidence
            </Link>
          </div>
        </div>

        <div className="mt-12 hidden flex-col items-center gap-2 self-center font-mono text-[9px] uppercase text-bone/40 md:flex">
          <span>scroll</span>
          <span className="h-8 w-px bg-gradient-to-b from-bone/40 to-transparent" />
        </div>
      </div>
    </section>
  );
}
