import { Link } from "@tanstack/react-router";

import { SectionShell } from "@/components/landing/Section";
import { TEAM, hoverGlow, textAccent } from "@/data/landing";

export function TeamSection() {
  return (
    <SectionShell
      id="team"
      eyebrow="06"
      label="people and practice"
      title="A small, accountable core."
      subtitle="The Bu1ld names people only when their role is confirmed. Project teams and program contributors appear through their own records, with members controlling directory visibility."
    >
      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px bg-border/40 border border-border/40">
        {TEAM.map((m) => (
          <div
            key={m.name}
            className={`p-7 bg-background/75 backdrop-blur-md ${hoverGlow[m.color]} transition group`}
          >
            <div
              className={`h-14 w-14 rounded-sm grid place-items-center bg-background border border-accent-blue/40 font-display text-lg ${textAccent[m.color]}`}
            >
              {m.initials}
            </div>
            <h3 className="mt-6 font-display text-lg text-bone tracking-tight">{m.name}</h3>
            <p className="mt-2 font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
              {m.role}
            </p>
          </div>
        ))}
        <Link
          to="/people"
          className="p-7 bg-background/75 backdrop-blur-md hover:bg-background/40 transition group block"
        >
          <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-accent-blue">
            Directory
          </p>
          <h3 className="mt-6 font-display text-lg text-bone tracking-tight">Member people</h3>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Confirmed members control visibility. Browse the directory after you join.
          </p>
          <span className="mt-6 inline-block font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground group-hover:text-bone">
            Open people →
          </span>
        </Link>
      </div>
    </SectionShell>
  );
}
