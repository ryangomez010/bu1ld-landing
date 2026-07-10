import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  BookOpen,
  Calendar,
  FolderKanban,
  GraduationCap,
  Home,
  Library,
  Search,
  Settings,
  Shield,
  Users,
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";

const NAV = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/research", label: "Research library", icon: Library },
  { to: "/papers", label: "Paper reviews", icon: BookOpen },
  { to: "/guides", label: "Guides", icon: GraduationCap },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/events", label: "Events", icon: Calendar },
  { to: "/members", label: "Member directory", icon: Users },
  { to: "/search", label: "Search", icon: Search },
  { to: "/profile", label: "Profile & export", icon: Settings },
  { to: "/account/security", label: "Account security", icon: Shield },
  { to: "/saved/collections", label: "Research collections", icon: BookOpen },
] as const;

export function MemberCommandPalette() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

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
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Jump to…" />
      <CommandList>
        <CommandEmpty>No matches.</CommandEmpty>
        <CommandGroup heading="Navigate">
          {NAV.map(({ to, label, icon: Icon }) => (
            <CommandItem
              key={to}
              value={label}
              onSelect={() => {
                setOpen(false);
                void navigate({ to });
              }}
            >
              <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
              {label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Search">
          <CommandItem
            value="search portal"
            onSelect={() => {
              setOpen(false);
              void navigate({ to: "/search" });
            }}
          >
            <Search className="mr-2 h-4 w-4 text-muted-foreground" />
            Open search
            <CommandShortcut>/</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
