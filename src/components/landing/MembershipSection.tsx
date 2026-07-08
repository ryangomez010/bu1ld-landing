import { Link } from "@tanstack/react-router";

import { SectionShell } from "@/components/landing/Section";
import { MEMBERSHIP_PERKS, dotColor, hoverGlow, textAccent } from "@/data/landing";

export function MembershipSection() {
  return (
    <SectionShell
      id="membership"
      eyebrow="02"
      label="membership"
      title="Join the pool."
      subtitle="Free at launch. Create your profile, get matched to projects, and stay plugged into the ML ecosystem — papers, conferences, and builder community."
    >
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border/40 border border-border/40">
        {MEMBERSHIP_PERKS.map((perk) => (
          <div
            key={perk.id}
            className={`p-8 bg-background/75 backdrop-blur-md ${hoverGlow[perk.color]} transition group`}
          >
            <span
              className={`font-mono text-[10px] tracking-[0.3em] uppercase ${textAccent[perk.color]} flex items-center gap-2`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${dotColor(perk.color)}`} />
              perk / {perk.id}
            </span>
            <h3 className="font-display text-xl mt-6 text-bone tracking-tight">{perk.title}</h3>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{perk.desc}</p>
          </div>
        ))}
      </div>
      <div className="mt-10 flex flex-wrap gap-4">
        <Link
          to="/signup"
          className="group inline-flex items-center gap-3 px-7 py-3.5 rounded-sm bg-bone text-background font-mono text-[11px] tracking-[0.3em] uppercase hover:bg-accent-blue transition"
        >
          Create your account{" "}
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </Link>
        <Link
          to="/login"
          className="inline-flex items-center gap-3 px-7 py-3.5 rounded-sm border border-bone/25 font-mono text-[11px] tracking-[0.3em] uppercase hover:border-bone hover:bg-bone/5 transition"
        >
          Already a member? Log in
        </Link>
      </div>
    </SectionShell>
  );
}
