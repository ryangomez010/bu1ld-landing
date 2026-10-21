import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowUpRight, ChevronDown, Menu, Search } from "lucide-react";
import { useState } from "react";

import { Wordmark } from "@/components/Wordmark";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { DISCORD_URL } from "@/data/landing";
import { useAuth } from "@/lib/auth";
import { PUBLIC_NAV, PUBLIC_MORE_NAV, publicNavActive } from "@/lib/public-navigation";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const moreActive = PUBLIC_MORE_NAV.some((item) => publicNavActive(pathname, item.to));

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur-xl">
      <div className="mx-auto flex min-h-18 max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link
          to="/"
          aria-label="BU1LD home"
          className="flex min-h-11 shrink-0 items-center gap-3 rounded-sm"
        >
          <Wordmark className="text-2xl" />
          <span className="hidden border-l border-bone/20 pl-3 text-xs leading-snug text-muted-foreground xl:block">
            Research.
            <br />
            Build. Contribute.
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
          {PUBLIC_NAV.map((item) => {
            const active = publicNavActive(pathname, item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-sm px-3 text-sm transition hover:bg-bone/5 hover:text-bone",
                  active ? "bg-bone/5 text-bone" : "text-muted-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "inline-flex min-h-11 items-center gap-1.5 rounded-sm px-3 text-sm transition hover:bg-bone/5 hover:text-bone",
                  moreActive ? "bg-bone/5 text-bone" : "text-muted-foreground",
                )}
              >
                More <ChevronDown className="h-4 w-4" aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="z-[60] w-60 border-border/60 bg-background p-2"
            >
              {PUBLIC_MORE_NAV.map((item) => (
                <DropdownMenuItem key={item.to} asChild>
                  <Link
                    to={item.to}
                    aria-current={publicNavActive(pathname, item.to) ? "page" : undefined}
                    className="min-h-11 cursor-pointer px-3"
                  >
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Link
            to="/search"
            search={{ q: "" }}
            aria-label="Search BU1LD"
            className="inline-flex h-11 w-11 items-center justify-center rounded-sm hover:bg-bone/5"
          >
            <Search className="h-5 w-5" aria-hidden="true" />
          </Link>
          {user ? (
            <Link
              to="/dashboard"
              className="inline-flex min-h-11 items-center rounded-sm border border-bone/25 px-3 text-sm text-bone transition hover:bg-bone/5 sm:px-4"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden min-h-11 items-center rounded-sm px-3 text-sm text-muted-foreground transition hover:text-bone sm:inline-flex"
              >
                Log in
              </Link>
              <Link
                to="/apply"
                className="inline-flex min-h-11 items-center rounded-sm bg-bone px-3 text-sm font-medium text-background transition hover:bg-accent-blue sm:px-4"
              >
                Apply{" "}
                <span className="ml-2 hidden sm:inline" aria-hidden="true">
                  →
                </span>
              </Link>
            </>
          )}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 text-bone lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="z-[70] flex w-[min(90vw,24rem)] flex-col overflow-y-auto border-border/60 bg-background pb-[max(1.5rem,env(safe-area-inset-bottom))] [&>button]:h-11 [&>button]:w-11 [&>button]:flex [&>button]:items-center [&>button]:justify-center"
            >
              <SheetHeader className="pr-12 text-left">
                <SheetTitle>
                  <Wordmark className="text-2xl" />
                </SheetTitle>
                <SheetDescription>Find your next step.</SheetDescription>
              </SheetHeader>
              <nav className="mt-5" aria-label="Mobile navigation">
                <div className="space-y-1">
                  {PUBLIC_NAV.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      aria-current={publicNavActive(pathname, item.to) ? "page" : undefined}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex min-h-12 items-center justify-between rounded-sm px-3 text-base transition hover:bg-bone/5",
                        publicNavActive(pathname, item.to)
                          ? "bg-bone/5 text-bone"
                          : "text-muted-foreground",
                      )}
                    >
                      {item.label}
                      <span aria-hidden="true">→</span>
                    </Link>
                  ))}
                </div>
                <p className="mb-2 mt-6 px-3 text-xs font-medium text-muted-foreground">
                  More from BU1LD
                </p>
                {PUBLIC_MORE_NAV.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    aria-current={publicNavActive(pathname, item.to) ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex min-h-11 items-center rounded-sm px-3 text-sm transition hover:bg-bone/5",
                      publicNavActive(pathname, item.to)
                        ? "bg-bone/5 text-bone"
                        : "text-muted-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-auto space-y-2 border-t border-border/60 pt-5">
                {user ? (
                  <Link
                    to="/dashboard"
                    onClick={() => setOpen(false)}
                    className="flex min-h-12 items-center justify-center rounded-sm bg-bone px-4 text-sm font-medium text-background"
                  >
                    Back to dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setOpen(false)}
                      className="flex min-h-12 items-center justify-center rounded-sm bg-bone px-4 text-sm font-medium text-background"
                    >
                      Log in
                    </Link>
                    <Link
                      to="/signup"
                      search={{ redirect: "/projects" }}
                      onClick={() => setOpen(false)}
                      className="flex min-h-12 items-center justify-center rounded-sm border border-bone/25 px-4 text-sm text-bone"
                    >
                      Create an account
                    </Link>
                  </>
                )}
                <a
                  href={DISCORD_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-h-11 items-center justify-center gap-2 rounded-sm text-sm text-muted-foreground hover:text-bone"
                >
                  Join the conversation <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
