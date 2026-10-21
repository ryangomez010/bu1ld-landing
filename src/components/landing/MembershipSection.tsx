import { Link } from "@tanstack/react-router";

import { SectionShell } from "@/components/landing/Section";
import { MEMBERSHIP_PERKS, dotColor, hoverGlow, textAccent } from "@/data/landing";

export function MembershipSection() {
  return (
    <SectionShell
      id="membership"
      eyebrow="02"
      label="membership"
      title="Make your time here count."
      subtitle="Start with the skill you want to build or the problem you want to solve. Your account connects learning, applications, and your contribution record."
    >
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border/40 border border-border/40">
        {MEMBERSHIP_PERKS.map((perk) => (
          <Link
            to={perk.to}
            key={perk.id}
            className={`flex flex-col p-6 bg-background/75 backdrop-blur-md ${hoverGlow[perk.color]} transition-all duration-300 group hover:-translate-y-px`}
          >
            <span
              className={`font-mono text-[10px] tracking-[0.3em] uppercase ${textAccent[perk.color]} flex items-center gap-2`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${dotColor(perk.color)}`} />
              {perk.id}
            </span>
            <h3 className="font-display text-xl mt-6 text-bone tracking-tight">{perk.title}</h3>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{perk.desc}</p>
            <span className="mt-auto pt-6 text-sm text-accent-blue">
              {perk.action} <span aria-hidden="true">→</span>
            </span>
          </Link>
        ))}
      </div>
      <p className="mt-5 text-sm text-muted-foreground">
        Reading paths are public. An account is required to save progress, apply to projects, and
        maintain a contribution record. Project and program admission is reviewed separately.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          to="/projects"
          className="inline-flex min-h-12 items-center gap-3 rounded-sm bg-bone px-6 py-3 text-sm font-medium text-background transition hover:bg-accent-blue"
        >
          Browse projects <span aria-hidden="true">→</span>
        </Link>
        <Link
          to="/apply"
          className="inline-flex min-h-12 items-center rounded-sm border border-bone/25 px-6 py-3 text-sm text-bone transition hover:border-bone/50 hover:bg-bone/5"
        >
          How to get involved
        </Link>
      </div>
    </SectionShell>
  );
}
