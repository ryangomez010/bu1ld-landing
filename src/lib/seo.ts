export const SITE_URL = "https://thebu1ld.com";
export const SITE_NAME = "The Bu1ld";
export const DEFAULT_SOCIAL_IMAGE = `${SITE_URL}/og.svg`;

type PageHeadOptions = {
  title: string;
  description: string;
  path: string;
  image?: string;
  robots?: "index, follow" | "noindex, nofollow";
  type?: "website" | "article";
};

export function absoluteSiteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalized, SITE_URL).toString();
}

export function pageHead({
  title,
  description,
  path,
  image = DEFAULT_SOCIAL_IMAGE,
  robots = "index, follow",
  type = "website",
}: PageHeadOptions) {
  const canonical = absoluteSiteUrl(path);
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { name: "robots", content: robots },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: type },
      { property: "og:url", content: canonical },
      { property: "og:image", content: image },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: image },
    ],
    links: [{ rel: "canonical", href: canonical }],
  };
}

export function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function privatePageHead(title: string) {
  return {
    meta: [{ title }, { name: "robots", content: "noindex, nofollow" }],
  };
}

export const ORGANIZATION_STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  description:
    "An independent machine-learning research and builder institution for scoped projects, reviewed contributions, and evidence-backed technical work.",
};
