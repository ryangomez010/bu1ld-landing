import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronDown, LogOut, Menu, Moon, Sun, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { FeedbackButton } from "@/components/member/FeedbackButton";
import { KeyboardShortcutsDialog } from "@/components/member/KeyboardShortcutsDialog";
import { MemberCommandPalette } from "@/components/member/MemberCommandPalette";
import { LiquidBackdrop } from "@/components/member/LiquidBackdrop";
import { NotificationBell } from "@/components/member/NotificationBell";
import { MobileTabBar } from "@/components/member/MobileTabBar";
import { PageTransition } from "@/components/member/PageTransition";
import { RoleBadge } from "@/components/member/RoleBadge";
import { Wordmark } from "@/components/Wordmark";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import { useAuth } from "@/lib/auth";
import {
  activeMemberDestination,
  MEMBER_ACCOUNT_NAV,
  MEMBER_NAV_GROUPS,
  memberRoleNavigation,
} from "@/lib/member-navigation";
import {
  densityClass,
  fetchMemberPreferences,
  MEMBER_PREFS_CHANGED,
} from "@/lib/member-preferences";
import type { ContentDensity, MemberPreferences } from "@/lib/types";
import { getStoredTheme, toggleTheme, type ThemePreference } from "@/lib/theme";
import { cn } from "@/lib/utils";

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
  const [contentDensity, setContentDensity] = useState<ContentDensity>("comfortable");
  const [theme, setTheme] = useState<ThemePreference>(() => getStoredTheme());
  const roleLinks = memberRoleNavigation(profile);
  const destinations = [
    ...MEMBER_NAV_GROUPS.flatMap((group) => group.items.map((item) => item.to)),
    ...MEMBER_ACCOUNT_NAV.map((item) => item.to),
    ...roleLinks.map((item) => item.to),
  ];
  const activeDestination = activeMemberDestination(pathname, destinations);
  const name = profile?.full_name || "Your account";
  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) toast.error(error);
  };

  useEffect(() => {
    let current = true;
    if (user)
      void fetchMemberPreferences(user.id).then((p) => {
        if (current) setContentDensity(p.content_density);
      });
    return () => {
      current = false;
    };
  }, [user]);

  useEffect(() => {
    const onPrefs = (event: Event) => {
      const detail = (event as CustomEvent<MemberPreferences>).detail;
      if (detail?.content_density) setContentDensity(detail.content_density);
    };
    window.addEventListener(MEMBER_PREFS_CHANGED, onPrefs);
    return () => window.removeEventListener(MEMBER_PREFS_CHANGED, onPrefs);
  }, []);

  const navItem = (
    {
      to,
      label,
      icon: Icon,
    }: {
      to: string;
      label: string;
      icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
    },
    onNavigate?: () => void,
  ) => (
    <Link
      key={to}
      to={to}
      onClick={onNavigate}
      aria-current={activeDestination === to ? "page" : undefined}
      className={cn(
        "flex min-h-11 items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors",
        activeDestination === to
          ? "nav-active font-medium"
          : "border-transparent text-muted-foreground hover:bg-bone/5 hover:text-bone",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      {label}
    </Link>
  );

  const navigation = (onNavigate?: () => void) => (
    <>
      {MEMBER_NAV_GROUPS.map((group) => (
        <div key={group.label} className="mb-5 space-y-0.5">
          <p className="px-3 pb-2 pt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            {group.label}
          </p>
          {group.items.map((item) => navItem(item, onNavigate))}
        </div>
      ))}
      {roleLinks.length > 0 ? (
        <div className="mb-5 space-y-0.5">
          <p className="px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Manage
          </p>
          {roleLinks.map((item) => navItem(item, onNavigate))}
        </div>
      ) : null}
    </>
  );

  return (
    <div
      className={cn(
        "relative min-h-screen bg-background text-foreground member-canvas",
        densityClass(contentDensity),
      )}
    >
      <LiquidBackdrop />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-bone focus:px-4 focus:py-3 focus:text-background"
      >
        Skip to content
      </a>
      <div className="relative z-10 flex min-h-screen">
        <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-border/40 glass-strong lg:flex">
          <Link
            to="/"
            className="mx-4 mb-2 mt-5 rounded-lg px-3 py-3"
            aria-label="The Bu1ld public site"
          >
            <Wordmark className="text-lg" />
            <span className="mt-2 block font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
              Member portal
            </span>
          </Link>
          <nav
            aria-label="Member navigation"
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3"
          >
            {navigation()}
          </nav>
          <Link
            to="/profile"
            className="m-3 flex min-h-14 items-center gap-3 rounded-xl border border-border/50 bg-bone/5 p-3 hover:bg-bone/10"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-blue/10 text-accent-blue">
              <UserRound className="h-4 w-4" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm text-bone">{name}</span>
              <span className="text-xs text-muted-foreground">View your profile</span>
            </span>
          </Link>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 flex min-h-16 items-center gap-3 border-b border-border/40 px-4 py-2.5 glass-strong md:px-6">
            <div className="lg:hidden">
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Open navigation menu">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="flex h-dvh w-80 max-w-[90vw] flex-col gap-0 border-border/40 p-0"
                >
                  <SheetHeader className="shrink-0 border-b border-border/50 px-6 py-5 text-left">
                    <SheetTitle>
                      <Wordmark />
                    </SheetTitle>
                    <SheetDescription>Find your work, library, and account.</SheetDescription>
                  </SheetHeader>
                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                    <nav aria-label="Mobile member navigation">
                      {navigation(() => setOpen(false))}
                    </nav>
                    <nav aria-label="Account navigation" className="border-t border-border/50 pt-4">
                      <p className="px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                        Account
                      </p>
                      {MEMBER_ACCOUNT_NAV.map((item) => navItem(item, () => setOpen(false)))}
                    </nav>
                    <button
                      type="button"
                      onClick={() => setTheme(toggleTheme())}
                      className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground hover:bg-bone/5 hover:text-bone"
                    >
                      {theme === "dark" ? (
                        <Sun className="h-4 w-4" />
                      ) : (
                        <Moon className="h-4 w-4" />
                      )}
                      {theme === "dark" ? "Light mode" : "Dark mode"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        void handleSignOut();
                      }}
                      className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground hover:bg-bone/5 hover:text-bone"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            <div className="min-w-0 max-w-md flex-1">
              <MemberCommandPalette />
            </div>
            <div className="ml-auto flex shrink-0 items-center gap-1">
              <div className="hidden sm:block">
                <FeedbackButton />
              </div>
              <NotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="min-h-11 gap-2 px-2.5"
                    aria-label="Open account menu"
                  >
                    <UserRound className="h-4 w-4" aria-hidden />
                    <span className="hidden max-w-28 truncate text-sm xl:inline">{name}</span>
                    <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuLabel className="truncate">{name}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {MEMBER_ACCOUNT_NAV.map(({ to, label, icon: Icon }) => (
                    <DropdownMenuItem key={to} asChild>
                      <Link to={to}>
                        <Icon className="mr-2 h-4 w-4" aria-hidden />
                        {label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => setTheme(toggleTheme())}>
                    {theme === "dark" ? (
                      <Sun className="mr-2 h-4 w-4" />
                    ) : (
                      <Moon className="mr-2 h-4 w-4" />
                    )}
                    {theme === "dark" ? "Light mode" : "Dark mode"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => void handleSignOut()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main
            id="main-content"
            tabIndex={-1}
            className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-28 outline-none md:px-8 md:py-8 lg:pb-10"
          >
            {title ? (
              <header className="mb-8 border-b border-border/40 pb-6">
                {eyebrow ? (
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent-green">
                    {eyebrow}
                  </p>
                ) : null}
                <h1 className="mt-2 font-display text-3xl leading-tight tracking-tight text-bone md:text-4xl">
                  {title}
                </h1>
              </header>
            ) : null}
            <PageTransition>{children}</PageTransition>
          </main>
          <footer className="flex flex-wrap items-center justify-center gap-3 border-t border-border/40 px-4 py-4 pb-28 text-xs text-muted-foreground lg:pb-4">
            <span>The Bu1ld · member portal</span>
            {profile?.role ? <RoleBadge role={profile.role} /> : null}
            <Link to="/" className="underline-offset-4 hover:underline">
              Public site ↗
            </Link>
          </footer>
        </div>
      </div>
      <MobileTabBar onMenu={() => setOpen(true)} menuOpen={open} />
      <KeyboardShortcutsDialog />
    </div>
  );
}
