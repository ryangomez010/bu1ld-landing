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
      className="lg:hidden fixed bottom-0 inset-x-0 z-50 px-1 pt-2 pointer-events-none"
      aria-label="Primary"
    >
      <div className="glass-dock pointer-events-auto">
      <ul className="flex items-stretch justify-around px-2 pt-1 pb-2">
        {TABS.map(({ to, label, icon: Icon }) => {
          const active = pathname === to || (to !== "/dashboard" && pathname.startsWith(to));
          return (
            <li key={to} className="flex-1 max-w-[5.5rem]">
              <Link
                to={to}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex flex-col items-center gap-1 rounded-xl py-2 font-mono text-[8px] tracking-[0.1em] uppercase transition-all duration-300",
                  active ? "text-accent-blue" : "text-muted-foreground hover:text-bone",
                )}
              >
                {active ? (
                  <span className="absolute inset-x-3 -top-px h-[2px] rounded-full bg-accent-blue shadow-[0_0_14px_var(--accent-blue)]" />
                ) : null}
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-300",
                    active && "bg-accent-blue/15 shadow-[0_0_20px_-6px_color-mix(in_oklab,var(--accent-blue)_60%,transparent)]",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5",
                      active &&
                        "drop-shadow-[0_0_8px_color-mix(in_oklab,var(--accent-blue)_70%,transparent)]",
                    )}
                    aria-hidden
                  />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
        <li className="flex-1 max-w-[5.5rem]">
          <button
            type="button"
            onClick={onMenu}
            className="flex w-full flex-col items-center gap-1 rounded-md py-2 font-mono text-[8px] tracking-[0.1em] uppercase text-muted-foreground hover:text-bone transition-colors duration-200"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-md">
              <Menu className="h-5 w-5" aria-hidden />
            </span>
            Menu
          </button>
        </li>
      </ul>
      </div>
    </nav>
  );
}
