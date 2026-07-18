import { sanitizeAppPath } from "@/lib/security";

const REDIRECT_STORAGE_KEY = "bu1ld:post-auth-redirect";

/** Safe in-app destination after login / signup / onboarding. */
export function postAuthDestination(
  redirect: string | null | undefined,
  fallback = "/dashboard",
): string {
  return sanitizeAppPath(redirect) ?? fallback;
}

/** Map public institution program slug to the authenticated apply destination. */
export function programApplyPath(slug: string): string {
  if (slug === "open-competitions") return "/competitions";
  return `/programs/${slug}`;
}

export function signupPathWithRedirect(destination: string): string {
  const safe = sanitizeAppPath(destination) ?? "/dashboard";
  return `/signup?redirect=${encodeURIComponent(safe)}`;
}

export function loginPathWithRedirect(destination: string): string {
  const safe = sanitizeAppPath(destination) ?? "/dashboard";
  return `/login?redirect=${encodeURIComponent(safe)}`;
}

export function rememberPostAuthRedirect(redirect: string | null | undefined): void {
  const safe = sanitizeAppPath(redirect);
  if (typeof window === "undefined") return;
  try {
    if (safe) sessionStorage.setItem(REDIRECT_STORAGE_KEY, safe);
    else sessionStorage.removeItem(REDIRECT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function consumePostAuthRedirect(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const value = sessionStorage.getItem(REDIRECT_STORAGE_KEY);
    sessionStorage.removeItem(REDIRECT_STORAGE_KEY);
    return sanitizeAppPath(value ?? undefined);
  } catch {
    return undefined;
  }
}

export type PostAuthNav =
  | { to: "/dashboard" }
  | { to: "/programs" }
  | { to: "/competitions" }
  | { to: "/projects" }
  | { to: "/research" }
  | { to: "/events" }
  | { to: "/applications" }
  | { to: "/papers" }
  | { to: "/publications" }
  | { to: "/labs" }
  | { to: "/apply" }
  | { to: "/announcements" }
  | { to: "/programs/$slug"; params: { slug: string } }
  | { to: "/projects/$slug"; params: { slug: string } }
  | { to: "/papers/$slug"; params: { slug: string } }
  | { to: "/labs/$slug"; params: { slug: string } }
  | { to: "/guides/$slug"; params: { slug: string } }
  | { to: "/events/$slug"; params: { slug: string } }
  | { to: "/competitions/$slug"; params: { slug: string } };

function slugAfter(prefix: string, dest: string): string | null {
  if (!dest.startsWith(prefix)) return null;
  const rest = dest.slice(prefix.length).split(/[?#]/)[0];
  return rest || null;
}

/** Typed TanStack navigate target for a sanitized redirect path. */
export function postAuthNavigateTarget(redirect?: string | null): PostAuthNav {
  const dest = postAuthDestination(redirect);
  const exact: Record<string, PostAuthNav> = {
    "/competitions": { to: "/competitions" },
    "/programs": { to: "/programs" },
    "/projects": { to: "/projects" },
    "/research": { to: "/research" },
    "/events": { to: "/events" },
    "/applications": { to: "/applications" },
    "/papers": { to: "/papers" },
    "/publications": { to: "/publications" },
    "/labs": { to: "/labs" },
    "/apply": { to: "/apply" },
    "/announcements": { to: "/announcements" },
  };
  if (exact[dest]) return exact[dest]!;

  const patterns: Array<[string, (slug: string) => PostAuthNav]> = [
    ["/programs/", (slug) => ({ to: "/programs/$slug", params: { slug } })],
    ["/projects/", (slug) => ({ to: "/projects/$slug", params: { slug } })],
    ["/papers/", (slug) => ({ to: "/papers/$slug", params: { slug } })],
    ["/labs/", (slug) => ({ to: "/labs/$slug", params: { slug } })],
    ["/guides/", (slug) => ({ to: "/guides/$slug", params: { slug } })],
    ["/events/", (slug) => ({ to: "/events/$slug", params: { slug } })],
    ["/competitions/", (slug) => ({ to: "/competitions/$slug", params: { slug } })],
  ];
  for (const [prefix, build] of patterns) {
    const slug = slugAfter(prefix, dest);
    if (slug) return build(slug);
  }
  return { to: "/dashboard" };
}
