export const PUBLIC_NAV = [
  { label: "Research", to: "/research-atlas" },
  { label: "Learn", to: "/guides" },
  { label: "Papers", to: "/papers" },
  { label: "Events", to: "/events" },
  { label: "Participate", to: "/forms" },
] as const;

export const PUBLIC_MORE_NAV = [
  { label: "Projects", to: "/projects" },
  { label: "Labs", to: "/labs" },
  { label: "Programs", to: "/programs-public" },
  { label: "Publications", to: "/publications" },
  { label: "Evidence register", to: "/evidence" },
  { label: "Competitions", to: "/competitions" },
  { label: "People", to: "/people" },
  { label: "Partnerships", to: "/partnerships" },
  { label: "Portfolio network", to: "/network" },
  { label: "How to apply", to: "/apply" },
] as const;

export function publicNavActive(pathname: string, destination: string): boolean {
  const path = pathname.replace(/\/$/, "") || "/";
  return path === destination || path.startsWith(`${destination}/`);
}
