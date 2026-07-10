/** Ambient liquid-glass orbs — fixed behind member hub content. */
export function LiquidBackdrop() {
  return (
    <div className="liquid-bg" aria-hidden>
      <div className="liquid-orb liquid-orb-a" />
      <div className="liquid-orb liquid-orb-b" />
      <div className="liquid-orb liquid-orb-c" />
      <div className="liquid-sheen" />
    </div>
  );
}
