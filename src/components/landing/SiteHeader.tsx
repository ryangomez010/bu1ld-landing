import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useEffect, useState } from "react";

import { Wordmark } from "@/components/Wordmark";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DISCORD_URL, NAV_ITEMS } from "@/data/landing";
import { useAuth } from "@/lib/auth";

export function SiteHeader() {
  const { user } = useAuth();
  const [time, setTime] = useState("");
  const [open, setOpen] = useState(false);

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
    <header className="fixed top-[2px] left-0 right-0 z-50 backdrop-blur-xl bg-background/30 border-b border-border/60">
      <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between gap-4">
        <a href="#top" className="text-xl tracking-tight shrink-0 flex items-center gap-3">
          <Wordmark />
          <span className="hidden sm:inline-block h-4 w-px bg-bone/20" />
          <span className="hidden sm:inline font-mono text-[9px] tracking-[0.3em] uppercase text-muted-foreground">
            ml institution
          </span>
        </a>

        <nav className="hidden lg:flex items-center gap-7 font-mono text-[10px] tracking-[0.28em] uppercase text-muted-foreground">
          {NAV_ITEMS.map(([label, href]) => (
            <a key={href} href={`#${href}`} className="group relative hover:text-bone transition">
              <span className="text-bone/40 mr-1">·</span>
              {label}
              <span className="absolute -bottom-1 left-0 right-0 h-px bg-bone scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 md:gap-3">
          <span className="hidden md:flex items-center gap-2 font-mono text-[9px] tracking-[0.28em] uppercase text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-green animate-pulse" />
            {time}
          </span>

          {user ? (
            <Link
              to="/dashboard"
              className="hidden sm:inline-flex font-mono text-[10px] tracking-[0.28em] uppercase px-3.5 py-2 border border-bone/25 text-bone hover:bg-bone/5 transition rounded-sm"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden sm:inline-flex font-mono text-[10px] tracking-[0.28em] uppercase px-3.5 py-2 text-muted-foreground hover:text-bone transition"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="font-mono text-[10px] tracking-[0.28em] uppercase px-3.5 py-2 border border-accent-blue/40 text-bone hover:bg-accent-blue/10 hover:border-accent-blue transition rounded-sm"
              >
                Join →
              </Link>
            </>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-bone"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="border-border/60 bg-background/95 backdrop-blur-xl"
            >
              <SheetHeader>
                <SheetTitle className="font-display text-left">
                  <Wordmark />
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-8 flex flex-col gap-4 font-mono text-[11px] tracking-[0.28em] uppercase">
                {NAV_ITEMS.map(([label, href]) => (
                  <a
                    key={href}
                    href={`#${href}`}
                    onClick={() => setOpen(false)}
                    className="text-muted-foreground hover:text-bone transition py-1"
                  >
                    {label}
                  </a>
                ))}
                <div className="h-px bg-border/60 my-2" />
                {user ? (
                  <Link to="/dashboard" onClick={() => setOpen(false)} className="text-bone py-1">
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setOpen(false)}
                      className="text-muted-foreground py-1"
                    >
                      Log in
                    </Link>
                    <Link
                      to="/signup"
                      onClick={() => setOpen(false)}
                      className="text-accent-blue py-1"
                    >
                      Become a member
                    </Link>
                  </>
                )}
                <a
                  href={DISCORD_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:text-bone py-1"
                >
                  Discord
                </a>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
