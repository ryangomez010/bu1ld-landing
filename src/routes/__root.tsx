import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Toaster } from "sonner";

import { AuthProvider } from "@/lib/auth";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-accent-blue/10 via-transparent to-accent-red/5" />
      <div className="relative max-w-md text-center">
        <p className="font-mono text-[10px] tracking-[0.35em] uppercase text-accent-blue">404</p>
        <h1 className="mt-4 font-display text-5xl text-bone tracking-tight">Page not found</h1>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          This route doesn&apos;t exist — or the link is outdated.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-sm bg-bone px-5 py-2.5 font-mono text-[10px] tracking-[0.25em] uppercase text-background hover:bg-accent-blue transition"
          >
            Home
          </Link>
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center rounded-sm border border-bone/25 px-5 py-2.5 font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground hover:text-bone hover:border-bone/50 transition"
          >
            Member hub
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
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-accent-red/10 via-transparent to-transparent" />
      <div className="relative max-w-md text-center">
        <p className="font-mono text-[10px] tracking-[0.35em] uppercase text-accent-red">error</p>
        <h1 className="mt-4 font-display text-3xl text-bone tracking-tight">This page didn&apos;t load</h1>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          Something went wrong on our end. Try again, or head back home.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
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
      { title: "The Bu1ld — A Machine Learning Institution" },
      {
        name: "description",
        content:
          "The Bu1ld is a machine learning institution — a hub for startups, research, and alternative intelligence. Join the membership pool.",
      },
      { property: "og:title", content: "The Bu1ld" },
      {
        property: "og:description",
        content:
          "Where alternative intelligence becomes real systems. Join projects, learn ML, and build.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@thebu1ld" },
      { name: "theme-color", content: "#0a0a0b" },
      { name: "robots", content: "index, follow" },
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

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
        <Toaster theme="dark" position="top-center" richColors />
      </AuthProvider>
    </QueryClientProvider>
  );
}
