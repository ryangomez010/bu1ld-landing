export function Wordmark({ className = "" }: { className?: string }) {
  // BU1LD with logo accent colors per glyph
  const letters: { ch: string; cls: string }[] = [
    { ch: "B", cls: "text-bone text-glow-bone" },
    { ch: "U", cls: "text-accent-red text-glow-red" },
    { ch: "1", cls: "text-accent-green text-glow-green" },
    { ch: "L", cls: "text-accent-blue text-glow-blue" },
    { ch: "D", cls: "text-bone text-glow-bone" },
  ];
  return (
    <span className={`font-display font-bold inline-flex ${className}`} aria-label="BU1LD">
      {letters.map((l, i) => (
        <span
          key={i}
          className={`${l.cls} transition-transform duration-500 hover:-translate-y-1`}
          style={{ display: "inline-block" }}
        >
          {l.ch}
        </span>
      ))}
    </span>
  );
}
