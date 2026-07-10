import { Link, useRouterState } from "@tanstack/react-router";
import { FolderKanban, Home, Menu, Search, Users } from "lucide-react";

import { cn } from "@/lib/utils";

const TABS = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/members", label: "Members", icon: Users },
  { to: "/search", label: "Search", icon: Search },
] as const;

export function MobileTabBar({ onMenu }: { onMenu: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t border-border/60 bg-background/90 backdrop-blur-xl shadow-[0_-8px_32px_-8px_rgba(0,0,0,0.5)]"
      aria-label="Primary"
    >
      <ul className="flex items-stretch justify-around px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {TABS.map(({ to, label, icon: Icon }) => {
          const active = pathname === to || (to !== "/dashboard" && pathname.startsWith(to));
          return (
            <li key={to} className="flex-1 max-w-[5.5rem]">
              <Link
                to={to}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex flex-col items-center gap-1 rounded-md py-2 font-mono text-[8px] tracking-[0.1em] uppercase transition",
                  active ? "text-accent-blue" : "text-muted-foreground hover:text-bone",
                )}
              >
                {active ? (
                  <span className="absolute inset-x-1 top-0 h-0.5 rounded-full bg-accent-blue shadow-[0_0_8px_var(--accent-blue)]" />
                ) : null}
                <Icon
                  className={cn("h-5 w-5", active && "drop-shadow-[0_0_6px_var(--accent-blue)]")}
                  aria-hidden
                />
                {label}
              </Link>
            </li>
          );
        })}
        <li className="flex-1 max-w-[5.5rem]">
          <button
            type="button"
            onClick={onMenu}
            className="flex w-full flex-col items-center gap-1 rounded-md py-2 font-mono text-[8px] tracking-[0.1em] uppercase text-muted-foreground hover:text-bone transition"
          >
            <Menu className="h-5 w-5" aria-hidden />
            Menu
          </button>
        </li>
      </ul>
    </nav>
  );
}
