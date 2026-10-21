import { type ReactNode } from "react";

import { SiteFooter } from "@/components/landing/SiteFooter";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { cn } from "@/lib/utils";

type InstitutionLayoutProps = {
  children: ReactNode;
  title: string;
  eyebrow?: string;
  description?: string;
  className?: string;
};

export function InstitutionLayout({
  children,
  title,
  eyebrow,
  description,
  className,
}: InstitutionLayoutProps) {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-sm focus:bg-bone focus:px-4 focus:py-3 focus:text-sm focus:text-background"
      >
        Skip to content
      </a>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-accent-blue/[0.035] via-transparent to-background"
      />
      <SiteHeader />
      <main
        id="main"
        tabIndex={-1}
        className={cn("relative z-10 mx-auto max-w-6xl px-5 py-10 sm:px-6 md:py-16", className)}
      >
        {eyebrow ? (
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent-blue">{eyebrow}</p>
        ) : null}
        <h1 className="mt-3 max-w-3xl font-display text-4xl tracking-tight text-bone md:text-5xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            {description}
          </p>
        ) : null}
        <div className="mt-8 md:mt-10">{children}</div>
      </main>
      <div className="relative z-10">
        <SiteFooter />
      </div>
    </div>
  );
}
