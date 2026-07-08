import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { Wordmark } from "@/components/Wordmark";

export function SiteFooter() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setTime(
        `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}:${String(
          d.getUTCSeconds(),
        ).padStart(2, "0")} UTC`,
      );
    };
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, []);

  return (
    <footer className="relative border-t border-border/60 py-10 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-6 flex flex-wrap items-center justify-between gap-4 font-mono text-[10px] tracking-[0.28em] uppercase text-muted-foreground">
        <div className="flex items-center gap-3">
          <Wordmark className="text-sm" />
          <span className="text-bone/30">·</span>
          <span>© 2026 the bu1ld</span>
          <span className="text-bone/30">·</span>
          <span>alternative intelligence</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/privacy" className="hover:text-bone transition">
            Privacy
          </Link>
          <Link to="/terms" className="hover:text-bone transition">
            Terms
          </Link>
          <span>{time}</span>
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-green animate-pulse" />
            live
          </span>
        </div>
      </div>
    </footer>
  );
}
