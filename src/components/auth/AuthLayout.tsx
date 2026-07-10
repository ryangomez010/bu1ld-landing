import { Link } from "@tanstack/react-router";

import { Wordmark } from "@/components/Wordmark";
import { PageBackground } from "@/components/layout/PageBackground";

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <a
        href="#auth-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-sm focus:bg-bone focus:px-3 focus:py-2 focus:font-mono focus:text-[10px] focus:tracking-[0.2em] focus:uppercase focus:text-background"
      >
        Skip to content
      </a>
      <PageBackground density={100} />
      <div
        id="auth-main"
        className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16 page-enter"
      >
        <Link to="/" className="mb-10 inline-flex transition-opacity hover:opacity-80">
          <Wordmark />
        </Link>
        <div className="bracket rounded-sm border border-border/60 bg-background/88 p-8 sm:p-10 backdrop-blur-xl shadow-[0_24px_80px_-40px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(242,235,221,0.06)]">
          <div className="divider-grad mb-7" />
          <h1 className="font-display text-3xl tracking-tight text-bone">{title}</h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{subtitle}</p>
          <div className="mt-8 space-y-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
