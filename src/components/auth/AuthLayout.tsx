import { Link } from "@tanstack/react-router";

import { LiquidBackdrop } from "@/components/member/LiquidBackdrop";
import { Wordmark } from "@/components/Wordmark";

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
    <div className="relative min-h-screen bg-background text-foreground member-canvas">
      <LiquidBackdrop />
      <a
        href="#auth-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-sm focus:bg-bone focus:px-3 focus:py-2 focus:font-mono focus:text-[10px] focus:tracking-[0.2em] focus:uppercase focus:text-background"
      >
        Skip to content
      </a>
      <div
        id="auth-main"
        className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16 page-enter"
      >
        <Link to="/" className="mb-10 inline-flex transition-opacity hover:opacity-80">
          <Wordmark />
        </Link>
        <div
          className="panel glass rounded-2xl p-8 sm:p-10 relative overflow-hidden"
          aria-labelledby="auth-title"
        >
          <div className="divider-grad mb-7 relative z-[1]" />
          <h1
            id="auth-title"
            className="font-display text-3xl tracking-tight text-bone relative z-[1]"
          >
            {title}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed relative z-[1]">
            {subtitle}
          </p>
          <div className="mt-8 space-y-6 relative z-[1]">{children}</div>
        </div>
      </div>
    </div>
  );
}
