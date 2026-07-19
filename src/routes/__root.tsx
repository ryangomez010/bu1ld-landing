import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { Toaster } from "sonner";

import { trackPageView } from "@/lib/analytics";
import { AuthProvider } from "@/lib/auth";
import { ORGANIZATION_STRUCTURED_DATA } from "@/lib/seo";
import { initTheme } from "@/lib/theme";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 overflow-hidden member-canvas">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-accent-blue/10 via-transparent to-accent-red/5" />
      <div className="relative panel glass rounded-2xl p-10 md:p-12 max-w-md text-center">
        <p className="font-mono text-[10px] tracking-[0.35em] uppercase text-accent-blue relative z-[1]">
          404
        </p>
        <h1 className="mt-4 font-display text-4xl md:text-5xl text-bone tracking-tight relative z-[1]">
          Page not found
        </h1>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed relative z-[1]">
          This route doesn&apos;t exist — the link may be outdated or mistyped.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3 relative z-[1]">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-sm bg-bone px-5 py-2.5 font-mono text-[10px] tracking-[0.25em] uppercase text-background hover:bg-accent-blue transition"
          >
            Home
          </Link>
          <Link
            to="/projects"
            className="inline-flex items-center justify-center rounded-sm border border-bone/25 px-5 py-2.5 font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground hover:text-bone hover:border-bone/50 transition"
          >
            Find a project
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 overflow-hidden member-canvas">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-accent-red/10 via-transparent to-transparent" />
      <div className="relative panel glass rounded-2xl p-10 md:p-12 max-w-md text-center">
        <p className="font-mono text-[10px] tracking-[0.35em] uppercase text-accent-red relative z-[1]">
          error
        </p>
        <h1 className="mt-4 font-display text-3xl text-bone tracking-tight relative z-[1]">
          This page didn&apos;t load
        </h1>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed relative z-[1]">
          Something went wrong on our end. Refresh the page or head back home.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3 relative z-[1]">
          <button
            type="button"
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-sm bg-bone px-5 py-2.5 font-mono text-[10px] tracking-[0.25em] uppercase text-background hover:bg-accent-blue transition"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-sm border border-bone/25 px-5 py-2.5 font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground hover:text-bone transition"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "The Bu1ld — Machine Learning Research and Building" },
      {
        name: "description",
        content:
          "The Bu1ld is a machine-learning research and building platform for paper reviews, scoped projects, contribution records, confirmed events, and technical profiles.",
      },
      { property: "og:title", content: "The Bu1ld" },
      {
        property: "og:description",
        content:
          "Read closely, apply to scoped work, record what you contribute, and build an evidence-backed technical practice.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://thebu1ld.com/" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@thebu1ld" },
      { property: "og:image", content: "https://thebu1ld.com/og.svg" },
      { name: "twitter:image", content: "https://thebu1ld.com/og.svg" },
      { name: "theme-color", content: "#0a0a0b" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "sitemap", type: "application/xml", href: "/sitemap.xml" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Familjen+Grotesk:wght@400;500;600;700&family=Inter+Tight:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script src="/runtime-env.js" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_STRUCTURED_DATA) }}
        />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const location = useRouterState({ select: (s) => s.location });

  useEffect(() => {
    initTheme();
  }, []);

  useEffect(() => {
    trackPageView(`${window.location.pathname}${window.location.search}`);
  }, [location.pathname, location.search]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
        <Toaster theme="dark" position="top-center" richColors />
      </AuthProvider>
    </QueryClientProvider>
  );
}
