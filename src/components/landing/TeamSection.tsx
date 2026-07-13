import { SectionShell } from "@/components/landing/Section";
import { TEAM, hoverGlow, textAccent } from "@/data/landing";

export function TeamSection() {
  return (
    <SectionShell
      id="team"
      eyebrow="06"
      label="people and practice"
      title="A small, accountable core."
      subtitle="The Bu1ld names people only when their role is confirmed. Project teams and program contributors are represented through their own records, with members controlling directory visibility."
    >
      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px bg-border/40 border border-border/40">
        {TEAM.map((m) => (
          <div
            key={m.name}
            className={`p-7 bg-background/75 backdrop-blur-md ${hoverGlow[m.color]} transition group`}
          >
            <div
              className={`h-14 w-14 rounded-sm grid place-items-center bg-background border font-display text-lg ${textAccent[m.color]} ${
                m.color === "red"
                  ? "border-accent-red/40"
                  : m.color === "green"
                    ? "border-accent-green/40"
                    : m.color === "blue"
                      ? "border-accent-blue/40"
                      : "border-bone/30"
              }`}
            >
              {m.initials}
            </div>
            <h3 className="mt-6 font-display text-lg text-bone tracking-tight">{m.name}</h3>
            <p className="mt-2 font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
              {m.role}
            </p>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
