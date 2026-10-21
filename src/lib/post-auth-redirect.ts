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
  | { href: string }
  | { to: "/dashboard" }
  | { to: "/programs" }
  | { to: "/competitions" }
  | { to: "/projects" }
  | { to: "/research" }
  | { to: "/events" }
  | { to: "/applications" }
  | { to: "/workspace" }
  | { to: "/papers" }
  | { to: "/publications" }
  | { to: "/labs" }
  | { to: "/apply" }
  | { to: "/announcements" }
  | { to: "/guides" }
  | { to: "/saved" }
  | { to: "/saved/collections" }
  | { to: "/jobs" }
  | { to: "/jobs/tracker" }
  | { to: "/members" }
  | { to: "/profile" }
  | { to: "/search" }
  | { to: "/notifications" }
  | { to: "/newsletter" }
  | { to: "/invitations" }
  | { to: "/account/security" }
  | { to: "/account/preferences" }
  | { to: "/account/notifications" }
  | { to: "/account/activity" }
  | { to: "/research/submit" }
  | { to: "/research/analyze" }
  | { to: "/research/highlights" }
  | { to: "/lead/apply" }
  | { to: "/admin" }
  | { to: "/programs/$slug"; params: { slug: string } }
  | { to: "/projects/$slug"; params: { slug: string } }
  | { to: "/papers/$slug"; params: { slug: string } }
  | { to: "/labs/$slug"; params: { slug: string } }
  | { to: "/guides/$slug"; params: { slug: string } }
  | { to: "/events/$slug"; params: { slug: string } }
  | { to: "/competitions/$slug"; params: { slug: string } }
  | { to: "/jobs/$slug"; params: { slug: string } }
  | { to: "/newsletter/$slug"; params: { slug: string } }
  | { to: "/members/$id"; params: { id: string } };

function slugAfter(prefix: string, dest: string): string | null {
  if (!dest.startsWith(prefix)) return null;
  const rest = dest.slice(prefix.length).split(/[?#]/)[0];
  return rest && !rest.includes("/") ? rest : null;
}

/** Typed TanStack navigate target for a sanitized redirect path. */
export function postAuthNavigateTarget(redirect?: string | null): PostAuthNav {
  const dest = postAuthDestination(redirect);
  // href preserves filters and anchors after auth. Restrict it to known local routes;
  // controls/backslashes and normalized dot segments must never become destinations.
  if (
    [...dest].some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)
  ) {
    return { to: "/dashboard" };
  }
  const pathname = dest.split(/[?#]/)[0].replace(/\/$/, "");
  const withLocation = (target: PostAuthNav): PostAuthNav =>
    dest.includes("?") || dest.includes("#") ? { href: dest } : target;
  const exact: Record<string, PostAuthNav> = {
    "/dashboard": { to: "/dashboard" },
    "/competitions": { to: "/competitions" },
    "/programs": { to: "/programs" },
    "/projects": { to: "/projects" },
    "/research": { to: "/research" },
    "/events": { to: "/events" },
    "/applications": { to: "/applications" },
    "/workspace": { to: "/workspace" },
    "/papers": { to: "/papers" },
    "/publications": { to: "/publications" },
    "/labs": { to: "/labs" },
    "/apply": { to: "/apply" },
    "/announcements": { to: "/announcements" },
    "/guides": { to: "/guides" },
    "/saved": { to: "/saved" },
    "/saved/collections": { to: "/saved/collections" },
    "/jobs": { to: "/jobs" },
    "/jobs/tracker": { to: "/jobs/tracker" },
    "/members": { to: "/members" },
    "/profile": { to: "/profile" },
    "/search": { to: "/search" },
    "/notifications": { to: "/notifications" },
    "/newsletter": { to: "/newsletter" },
    "/invitations": { to: "/invitations" },
    "/account/security": { to: "/account/security" },
    "/account/preferences": { to: "/account/preferences" },
    "/account/notifications": { to: "/account/notifications" },
    "/account/activity": { to: "/account/activity" },
    "/research/submit": { to: "/research/submit" },
    "/research/analyze": { to: "/research/analyze" },
    "/research/highlights": { to: "/research/highlights" },
    "/lead/apply": { to: "/lead/apply" },
    "/admin": { to: "/admin" },
  };
  if (Object.hasOwn(exact, pathname)) return withLocation(exact[pathname]!);

  const patterns: Array<[string, (slug: string) => PostAuthNav]> = [
    ["/programs/", (slug) => ({ to: "/programs/$slug", params: { slug } })],
    ["/projects/", (slug) => ({ to: "/projects/$slug", params: { slug } })],
    ["/papers/", (slug) => ({ to: "/papers/$slug", params: { slug } })],
    ["/labs/", (slug) => ({ to: "/labs/$slug", params: { slug } })],
    ["/guides/", (slug) => ({ to: "/guides/$slug", params: { slug } })],
    ["/events/", (slug) => ({ to: "/events/$slug", params: { slug } })],
    ["/competitions/", (slug) => ({ to: "/competitions/$slug", params: { slug } })],
    ["/jobs/", (slug) => ({ to: "/jobs/$slug", params: { slug } })],
    ["/newsletter/", (slug) => ({ to: "/newsletter/$slug", params: { slug } })],
    ["/members/", (id) => ({ to: "/members/$id", params: { id } })],
  ];
  for (const [prefix, build] of patterns) {
    const slug = slugAfter(prefix, pathname);
    if (slug && !/^\.{1,2}$|%2e|%2f|%5c/i.test(slug)) return withLocation(build(slug));
  }
  return { to: "/dashboard" };
}
