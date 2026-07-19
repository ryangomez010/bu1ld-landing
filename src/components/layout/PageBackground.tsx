import { useEffect, useState } from "react";

import { NeuralField } from "@/components/NeuralField";

export function PageBackground({ density = 140 }: { density?: number }) {
  const [effectiveDensity, setEffectiveDensity] = useState(density);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px), (prefers-reduced-motion: reduce)");
    const sync = () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setEffectiveDensity(Math.min(density, 24));
        return;
      }
      if (window.matchMedia("(max-width: 768px)").matches) {
        setEffectiveDensity(Math.min(density, 48));
        return;
      }
      setEffectiveDensity(density);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [density]);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <NeuralField density={effectiveDensity} fixed />
      <div className="absolute inset-0 noise opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/45 to-background/90" />
    </div>
  );
}
