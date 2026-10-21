import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { MemberLayout } from "@/components/member/MemberLayout";
import { useAuth } from "@/lib/auth";

export function GuideLayout({
  title,
  eyebrow,
  children,
}: {
  title?: string;
  eyebrow?: string;
  children: ReactNode;
}) {
  const { user } = useAuth();
  if (user)
    return (
      <MemberLayout title={title} eyebrow={eyebrow}>
        {children}
      </MemberLayout>
    );
  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-bone focus:p-3 focus:text-background"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main
        id="main"
        tabIndex={-1}
        className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-6 md:py-14"
      >
        {title ? (
          <header className="mb-8">
            <p className="font-mono text-xs uppercase tracking-widest text-accent-blue">
              {eyebrow}
            </p>
            <h1 className="mt-3 font-display text-3xl text-bone sm:text-4xl">{title}</h1>
          </header>
        ) : null}
        <p className="mb-6 text-sm text-muted-foreground">
          Read freely. Progress stays on this browser; signing in keeps account progress separate.{" "}
          <Link to="/login" search={{ redirect: "/guides" }} className="text-accent-blue underline">
            Sign in to save to your account
          </Link>
          .
        </p>
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
