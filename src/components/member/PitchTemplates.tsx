import { PITCH_TEMPLATES } from "@/data/seed/announcements";

export function PitchTemplates({ onSelect }: { onSelect: (text: string) => void }) {
  return (
    <div className="space-y-2">
      <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground">
        Pitch templates
      </p>
      <div className="flex flex-wrap gap-2">
        {PITCH_TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelect(t.prompt)}
            className="rounded-sm border border-border/60 px-3 py-1.5 font-mono text-[9px] tracking-[0.15em] uppercase text-muted-foreground hover:text-bone hover:border-bone/30 transition"
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
