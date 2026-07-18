import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Bell,
  BookOpen,
  Calendar,
  ClipboardList,
  FolderKanban,
  GraduationCap,
  Home,
  Library,
  Search,
  Settings,
  Shield,
  SlidersHorizontal,
  Users,
} from "lucide-react";

import { searchLink } from "@/lib/app-paths";
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
  { to: "/programs", label: "Programs", icon: GraduationCap },
  { to: "/events", label: "Events", icon: Calendar },
  { to: "/announcements", label: "Announcements", icon: Bell },
  { to: "/members", label: "Member directory", icon: Users },
  { to: "/search", label: "Search", icon: Search },
  { to: "/profile", label: "Profile & export", icon: Settings },
  { to: "/account/security", label: "Account security", icon: Shield },
  { to: "/account/notifications", label: "Notification prefs", icon: Bell },
  { to: "/account/preferences", label: "Preferences", icon: SlidersHorizontal },
  { to: "/account/activity", label: "Your submissions", icon: ClipboardList },
  { to: "/jobs/tracker", label: "Job tracker", icon: FolderKanban },
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
      <CommandInput placeholder="Go to dashboard, papers, profile, job tracker…" />
      <CommandList>
        <CommandEmpty>No matches.</CommandEmpty>
        <CommandGroup heading="Navigate">
          {NAV.map(({ to, label, icon: Icon }) => (
            <CommandItem
              key={to}
              value={label}
              onSelect={() => {
                setOpen(false);
                void navigate(to === "/search" ? searchLink() : { to });
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
              void navigate(searchLink());
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
