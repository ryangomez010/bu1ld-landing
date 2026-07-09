import { Link, useRouterState } from "@tanstack/react-router";
import {
  BookOpen,
  Bookmark,
  Briefcase,
  Calendar,
  ClipboardList,
  FileText,
  FolderKanban,
  Home,
  LogOut,
  Mail,
  Menu,
  Search,
  Settings,
  Shield,
} from "lucide-react";
import { useState } from "react";

import { NotificationBell } from "@/components/member/NotificationBell";
import { RoleBadge } from "@/components/member/RoleBadge";
import { Wordmark } from "@/components/Wordmark";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/jobs", label: "Jobs", icon: Briefcase },
  { to: "/events", label: "Events", icon: Calendar },
  { to: "/guides", label: "Guides", icon: BookOpen },
  { to: "/papers", label: "Papers", icon: FileText },
  { to: "/newsletter", label: "Newsletter", icon: Mail },
  { to: "/applications", label: "Applications", icon: ClipboardList },
  { to: "/saved", label: "Saved", icon: Bookmark },
] as const;

export function MemberLayout({
  title,
  eyebrow,
  children,
}: {
  title?: string;
  eyebrow?: string;
  children: React.ReactNode;
}) {
  const { user, profile, signOut } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const isAdmin = profile?.role === "admin";
  const isLead = profile?.role === "project_lead" || isAdmin;

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      {NAV.map(({ to, label, icon: Icon }) => {
        const active = pathname === to || (to !== "/dashboard" && pathname.startsWith(to));
        return (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-sm px-3 py-2.5 font-mono text-[10px] tracking-[0.22em] uppercase transition",
              active
                ? "bg-accent-blue/10 text-bone border border-accent-blue/30"
                : "text-muted-foreground hover:text-bone hover:bg-bone/5",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        );
      })}
      {isLead ? (
        <Link
          to="/projects/manage"
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 rounded-sm px-3 py-2.5 font-mono text-[10px] tracking-[0.22em] uppercase transition",
            pathname.startsWith("/projects/manage")
              ? "bg-accent-green/10 text-bone border border-accent-green/30"
              : "text-muted-foreground hover:text-bone hover:bg-bone/5",
          )}
        >
          <FolderKanban className="h-4 w-4 shrink-0" />
          My projects
        </Link>
      ) : null}
      {isAdmin ? (
        <Link
          to="/admin"
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 rounded-sm px-3 py-2.5 font-mono text-[10px] tracking-[0.22em] uppercase transition",
            pathname.startsWith("/admin")
              ? "bg-accent-red/10 text-bone border border-accent-red/30"
              : "text-muted-foreground hover:text-bone hover:bg-bone/5",
          )}
        >
          <Shield className="h-4 w-4 shrink-0" />
          Admin
        </Link>
      ) : null}
    </>
  );

  const UtilityLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="space-y-1">
      <Link
        to="/search"
        onClick={onNavigate}
        className="flex items-center gap-3 rounded-sm px-3 py-2 font-mono text-[10px] tracking-[0.22em] uppercase text-muted-foreground hover:text-bone transition"
      >
        <Search className="h-4 w-4" />
        Search
      </Link>
      <Link
        to="/profile"
        onClick={onNavigate}
        className="flex items-center gap-3 rounded-sm px-3 py-2 font-mono text-[10px] tracking-[0.22em] uppercase text-muted-foreground hover:text-bone transition"
      >
        <Settings className="h-4 w-4" />
        Profile
      </Link>
      <button
        type="button"
        onClick={() => {
          onNavigate?.();
          void signOut();
        }}
        className="flex w-full items-center gap-3 rounded-sm px-3 py-2 font-mono text-[10px] tracking-[0.22em] uppercase text-muted-foreground hover:text-bone transition"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </div>
  );

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-sm focus:bg-bone focus:px-3 focus:py-2 focus:font-mono focus:text-[10px] focus:tracking-[0.2em] focus:uppercase focus:text-background"
      >
        Skip to content
      </a>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-accent-blue/10 via-accent-green/5 to-transparent" />
      <div className="relative z-10 flex min-h-screen">
        <aside className="hidden lg:flex w-56 shrink-0 flex-col border-r border-border/60 bg-background/80 backdrop-blur-xl p-4">
          <Link to="/" className="px-3 py-2 mb-6">
            <Wordmark className="text-lg" />
          </Link>
          <nav className="flex flex-col gap-1 flex-1">
            <NavLinks />
          </nav>
          <div className="mt-auto pt-4 border-t border-border/60">
            <UtilityLinks />
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3 bg-background/80 backdrop-blur-xl">
            <Link to="/dashboard" className="lg:hidden">
              <Wordmark />
            </Link>
            <div className="hidden lg:flex flex-1 items-center gap-2 max-w-md ml-2">
              <Link
                to="/search"
                className="flex flex-1 items-center gap-2 rounded-sm border border-border/60 px-3 py-2 font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground hover:text-bone hover:border-bone/20 transition"
              >
                <Search className="h-3.5 w-3.5" />
                Search BUILD…
              </Link>
            </div>
            <div className="flex items-center gap-1 ml-auto">
              <NotificationBell />
              <div className="lg:hidden">
                <Sheet open={open} onOpenChange={setOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Open menu">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-64 bg-background/95">
                    <SheetHeader>
                      <SheetTitle>
                        <Wordmark />
                      </SheetTitle>
                    </SheetHeader>
                    <nav className="mt-6 flex flex-col gap-1">
                      <NavLinks onNavigate={() => setOpen(false)} />
                    </nav>
                    <div className="mt-6 border-t border-border/60 pt-4">
                      <UtilityLinks onNavigate={() => setOpen(false)} />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </header>

          <main
            id="main-content"
            className="flex-1 px-4 py-8 md:px-8 md:py-10 max-w-5xl w-full mx-auto"
          >
            {title ? (
              <div className="mb-8">
                {eyebrow ? (
                  <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-accent-green">
                    {eyebrow}
                  </p>
                ) : null}
                <h1 className="font-display text-3xl md:text-4xl text-bone tracking-tight mt-2">
                  {title}
                </h1>
              </div>
            ) : null}
            {children}
          </main>

          <footer className="border-t border-border/60 px-4 py-4 flex flex-wrap items-center justify-center gap-3 text-center font-mono text-[9px] tracking-[0.25em] uppercase text-muted-foreground">
            <span>{user?.email}</span>
            {profile?.role ? <RoleBadge role={profile.role} /> : null}
            <span className="text-bone/20">·</span>
            <span>member</span>
          </footer>
        </div>
      </div>
    </div>
  );
}
