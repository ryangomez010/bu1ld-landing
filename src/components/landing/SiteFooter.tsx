import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { Wordmark } from "@/components/Wordmark";
import { LINKEDIN_URL } from "@/data/landing";

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
          <span>ml research + building</span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href={LINKEDIN_URL}
            target="_blank"
            rel="noreferrer"
            className="hover:text-bone transition"
          >
            LinkedIn
          </a>
          <Link to="/privacy" className="hover:text-bone transition">
            Privacy
          </Link>
          <Link to="/terms" className="hover:text-bone transition">
            Terms
          </Link>
          <Link to="/evidence" className="hover:text-bone transition">
            Evidence
          </Link>
          <span>{time}</span>
        </div>
      </div>
    </footer>
  );
}
