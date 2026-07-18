import { Link, useRouterState } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useState, type ReactNode } from "react";

import { SiteFooter } from "@/components/landing/SiteFooter";
import { PageBackground } from "@/components/layout/PageBackground";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Wordmark } from "@/components/Wordmark";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const PUBLIC_NAV = [
  { label: "Labs", to: "/labs" },
  { label: "Projects", to: "/projects" },
  { label: "Programs", to: "/programs-public" },
  { label: "Competitions", to: "/competitions" },
  { label: "People", to: "/people" },
  { label: "Partnerships", to: "/partnerships" },
  { label: "Publications", to: "/publications" },
  { label: "Apply", to: "/apply" },
] as const;

type InstitutionLayoutProps = {
  children: ReactNode;
  title: string;
  eyebrow?: string;
  description?: string;
  className?: string;
};

function navActive(pathname: string, to: string): boolean {
  if (pathname === to) return true;
  if (to === "/labs") return pathname.startsWith("/labs/");
  if (to === "/projects") return pathname.startsWith("/projects/");
  if (to === "/competitions") return pathname.startsWith("/competitions/");
  return false;
}

export function InstitutionLayout({
  children,
  title,
  eyebrow,
  description,
  className,
}: InstitutionLayoutProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-sm focus:bg-bone focus:px-3 focus:py-2 focus:font-mono focus:text-[10px] focus:tracking-[0.2em] focus:uppercase focus:text-background"
      >
        Skip to content
      </a>
      <PageBackground density={80} />
      <header className="relative z-20 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <Wordmark />
            <span className="hidden font-mono text-[9px] uppercase tracking-[0.28em] text-muted-foreground sm:inline">
              Institution
            </span>
          </Link>
          <nav className="hidden items-center gap-5 lg:flex" aria-label="Institution">
            {PUBLIC_NAV.map((item) => {
              const active = navActive(pathname, item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "font-mono text-[10px] uppercase tracking-[0.18em] transition hover:text-bone",
                    active ? "text-bone" : "text-muted-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <Link
                to="/dashboard"
                className="rounded-sm border border-bone/25 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-bone transition hover:bg-bone/5"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground transition hover:text-bone sm:inline"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="rounded-sm border border-accent-blue/40 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-bone transition hover:border-accent-blue hover:bg-accent-blue/10"
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
                <nav className="mt-8 flex flex-col gap-4" aria-label="Mobile institution">
                  {PUBLIC_NAV.map((item) => {
                    const active = navActive(pathname, item.to);
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        aria-current={active ? "page" : undefined}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "font-mono text-sm uppercase tracking-[0.18em] transition hover:text-bone",
                          active ? "text-bone" : "text-muted-foreground",
                        )}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main
        id="main"
        className={cn("relative z-10 mx-auto max-w-6xl px-6 py-14 md:py-20", className)}
      >
        {eyebrow ? (
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-accent-blue">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-3 max-w-3xl font-display text-4xl tracking-tight text-bone md:text-5xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            {description}
          </p>
        ) : null}
        <div className="mt-12">{children}</div>
      </main>
      <div className="relative z-10">
        <SiteFooter />
      </div>
    </div>
  );
}
