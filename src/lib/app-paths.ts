/** Typed TanStack Router link targets — avoids template-literal `to` type errors. */

export function paperLink(slug: string) {
  return { to: "/papers/$slug" as const, params: { slug } };
}

export function projectLink(slug: string) {
  return { to: "/projects/$slug" as const, params: { slug } };
}

export function projectManageLink(slug: string) {
  return { to: "/projects/manage/$slug" as const, params: { slug } };
}

export function projectEditLink(slug: string) {
  return { to: "/projects/edit/$slug" as const, params: { slug } };
}

export function eventLink(slug: string) {
  return { to: "/events/$slug" as const, params: { slug } };
}

export function jobLink(slug: string) {
  return { to: "/jobs/$slug" as const, params: { slug } };
}

export function memberLink(id: string) {
  return { to: "/members/$id" as const, params: { id } };
}

export function newsletterLink(slug: string) {
  return { to: "/newsletter/$slug" as const, params: { slug } };
}

export function guideLink(slug: string) {
  return { to: "/guides/$slug" as const, params: { slug } };
}

export function searchLink(query = "") {
  return { to: "/search" as const, search: { q: query.trim() } };
}
