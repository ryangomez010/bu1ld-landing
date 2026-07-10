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
  Users,
} from "lucide-react";
import { useState } from "react";

import { NotificationBell } from "@/components/member/NotificationBell";
import { MobileTabBar } from "@/components/member/MobileTabBar";
import { RoleBadge } from "@/components/member/RoleBadge";
import { Wordmark } from "@/components/Wordmark";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const NAV_MAIN = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/applications", label: "Applications", icon: ClipboardList },
  { to: "/saved", label: "Saved", icon: Bookmark },
  { to: "/members", label: "Members", icon: Users },
] as const;

const NAV_CONTENT = [
  { to: "/events", label: "Events", icon: Calendar },
  { to: "/guides", label: "Guides", icon: BookOpen },
  { to: "/papers", label: "Papers", icon: FileText },
  { to: "/newsletter", label: "Newsletter", icon: Mail },
  { to: "/jobs", label: "Jobs", icon: Briefcase },
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

  const navClass = (active: boolean) =>
    cn(
      "flex items-center gap-3 rounded-sm pl-3 pr-3 py-2.5 font-mono text-[10px] tracking-[0.2em] uppercase transition",
      active
        ? "nav-active"
        : "text-muted-foreground hover:text-bone hover:bg-bone/5 border border-transparent",
    );

  const NavItem = ({
    to,
    label,
    icon: Icon,
    onNavigate,
  }: {
    to: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    onNavigate?: () => void;
  }) => {
    const active = pathname === to || (to !== "/dashboard" && pathname.startsWith(to));
    return (
      <Link
        to={to}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={navClass(active)}
      >
        <Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
        {label}
      </Link>
    );
  };

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      <p className="px-3 pt-1 pb-2 font-mono text-[8px] tracking-[0.28em] uppercase text-muted-foreground/70">
        Hub
      </p>
      {NAV_MAIN.map((item) => (
        <NavItem key={item.to} {...item} onNavigate={onNavigate} />
      ))}
      <p className="px-3 pt-4 pb-2 font-mono text-[8px] tracking-[0.28em] uppercase text-muted-foreground/70">
        Learn
      </p>
      {NAV_CONTENT.map((item) => (
        <NavItem key={item.to} {...item} onNavigate={onNavigate} />
      ))}
      {isLead ? (
        <NavItem
          to="/projects/manage"
          label="My projects"
          icon={FolderKanban}
          onNavigate={onNavigate}
        />
      ) : null}
      {isAdmin ? (
        <Link
          to="/admin"
          onClick={onNavigate}
          aria-current={pathname.startsWith("/admin") ? "page" : undefined}
          className={cn(
            navClass(pathname.startsWith("/admin")),
            pathname.startsWith("/admin") && "border-accent-red/30 bg-accent-red/10",
          )}
        >
          <Shield className="h-4 w-4 shrink-0" aria-hidden />
          Admin
        </Link>
      ) : null}
    </>
  );

  const UtilityLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="space-y-0.5">
      <Link
        to="/search"
        onClick={onNavigate}
        className="flex items-center gap-3 rounded-sm px-3 py-2 font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground hover:text-bone hover:bg-bone/5 transition"
      >
        <Search className="h-4 w-4" />
        Search
      </Link>
      <Link
        to="/profile"
        onClick={onNavigate}
        className="flex items-center gap-3 rounded-sm px-3 py-2 font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground hover:text-bone hover:bg-bone/5 transition"
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
        className="flex w-full items-center gap-3 rounded-sm px-3 py-2 font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground hover:text-bone hover:bg-bone/5 transition"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </div>
  );

  return (
    <div className="relative min-h-screen bg-background text-foreground member-canvas">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-sm focus:bg-bone focus:px-3 focus:py-2 focus:font-mono focus:text-[10px] focus:tracking-[0.2em] focus:uppercase focus:text-background"
      >
        Skip to content
      </a>
      <div className="relative z-10 flex min-h-screen">
        <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-border/60 bg-background/60 backdrop-blur-xl p-4">
          <Link to="/" className="px-3 py-2 mb-4">
            <Wordmark className="text-lg" />
          </Link>
          <nav className="flex flex-col gap-0.5 flex-1 overflow-y-auto">
            <NavLinks />
          </nav>
          <div className="mt-auto pt-4 border-t border-border/60">
            <UtilityLinks />
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
            <Link to="/dashboard" className="lg:hidden">
              <Wordmark />
            </Link>
            <div className="hidden lg:flex flex-1 items-center max-w-md ml-2">
              <Link
                to="/search"
                className="panel flex flex-1 items-center justify-between gap-2 rounded-sm px-3 py-2.5 font-mono text-[10px] tracking-[0.12em] uppercase text-muted-foreground hover:text-bone transition"
              >
                <span className="flex items-center gap-2">
                  <Search className="h-3.5 w-3.5" />
                  Search BUILD…
                </span>
                <kbd className="kbd hidden xl:inline">/</kbd>
              </Link>
            </div>
            <div className="flex items-center gap-1 ml-auto">
              {isSupabaseConfigured ? (
                <span
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-sm border border-accent-green/25 bg-accent-green/10 px-2 py-1 font-mono text-[8px] tracking-[0.2em] uppercase text-accent-green"
                  title="Connected to Supabase"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-accent-green animate-pulse" />
                  Live
                </span>
              ) : null}
              <NotificationBell />
              <div className="lg:hidden">
                <Sheet open={open} onOpenChange={setOpen}>
                  <SheetTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Open menu"
                      className="hover:bg-bone/5"
                    >
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-72 bg-background/95 border-border/60 p-0">
                    <SheetHeader className="border-b border-border/60 px-5 py-4">
                      <SheetTitle>
                        <Wordmark />
                      </SheetTitle>
                    </SheetHeader>
                    <nav className="flex flex-col gap-0.5 p-4 overflow-y-auto max-h-[calc(100vh-8rem)]">
                      <NavLinks onNavigate={() => setOpen(false)} />
                    </nav>
                    <div className="border-t border-border/60 p-4">
                      <UtilityLinks onNavigate={() => setOpen(false)} />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </header>

          <main
            id="main-content"
            className="flex-1 px-4 py-8 md:px-8 md:py-10 max-w-5xl w-full mx-auto pb-24 lg:pb-10"
          >
            {title ? (
              <header className="mb-8 pb-6 border-b border-border/40">
                {eyebrow ? (
                  <p className="font-mono text-[10px] tracking-[0.32em] uppercase text-accent-green">
                    {eyebrow}
                  </p>
                ) : null}
                <h1 className="font-display text-3xl md:text-4xl lg:text-[2.75rem] text-bone tracking-tight mt-2 leading-[1.1]">
                  {title}
                </h1>
              </header>
            ) : null}
            {children}
          </main>

          <footer className="border-t border-border/60 px-4 py-4 pb-20 lg:pb-4 flex flex-wrap items-center justify-center gap-3 text-center font-mono text-[9px] tracking-[0.25em] uppercase text-muted-foreground bg-background/40">
            <span className="truncate max-w-[200px]">{user?.email}</span>
            {profile?.role ? <RoleBadge role={profile.role} /> : null}
            <span className="text-bone/20">·</span>
            <span>BUILD member</span>
          </footer>
        </div>
      </div>
      <MobileTabBar onMenu={() => setOpen(true)} />
    </div>
  );
}
