import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";

import { searchLink } from "@/lib/app-paths";
import { useAuth } from "@/lib/auth";
import {
  MEMBER_ACCOUNT_NAV,
  MEMBER_NAV_GROUPS,
  MEMBER_SHORTCUT_NAV,
  memberRoleNavigation,
} from "@/lib/member-navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";

export function MemberCommandPalette() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const groups = [
    ...MEMBER_NAV_GROUPS,
    { label: "Updates & tracking", items: MEMBER_SHORTCUT_NAV },
    { label: "Account", items: MEMBER_ACCOUNT_NAV },
    { label: "Manage", items: memberRoleNavigation(profile) },
  ];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <CommandDialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) setQuery("");
      }}
      trigger={
        <button
          type="button"
          className="flex min-h-11 w-full items-center gap-2 rounded-xl border border-border/50 bg-bone/5 px-3 text-left text-sm text-muted-foreground transition hover:border-bone/30 hover:text-bone"
          aria-label="Jump to a page or search"
        >
          <Search className="h-4 w-4 shrink-0" aria-hidden />
          <span className="flex-1 truncate">Jump to…</span>
          <kbd className="kbd hidden sm:inline">⌘ / Ctrl K</kbd>
        </button>
      }
    >
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder="Find a page, or search the portal…"
      />
      <CommandList>
        <CommandEmpty>No pages match. Try searching the portal below.</CommandEmpty>
        {groups
          .filter((group) => group.items.length)
          .map((group) => (
            <CommandGroup key={group.label} heading={group.label}>
              {group.items.map(({ to, label, icon: Icon }) => (
                <CommandItem
                  key={to}
                  value={`${label} ${to}`}
                  onSelect={() => {
                    setOpen(false);
                    setQuery("");
                    void navigate({ to });
                  }}
                >
                  <Icon className="mr-2 h-4 w-4 text-muted-foreground" aria-hidden />
                  {label}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        <CommandGroup heading="Search the portal" forceMount>
          <CommandItem
            forceMount
            value="search portal"
            onSelect={() => {
              setOpen(false);
              void navigate(searchLink(query.trim()));
              setQuery("");
            }}
          >
            <Search className="mr-2 h-4 w-4 text-muted-foreground" aria-hidden />
            <span className="min-w-0 truncate">
              {query.trim()
                ? `Search for “${query.trim()}”`
                : "Search projects, papers, and people"}
            </span>
            <CommandShortcut>↵</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
