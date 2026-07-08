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
      <PageBackground density={100} />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
        <Link to="/" className="mb-10 inline-flex">
          <Wordmark />
        </Link>
        <div className="rounded-sm border border-border/60 bg-background/80 p-8 backdrop-blur-xl">
          <h1 className="font-display text-3xl tracking-tight text-bone">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
