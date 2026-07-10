import { getSupabase } from "@/lib/supabase";
import type { SearchResult } from "@/lib/types";

type RemoteHit = {
  content_type: string;
  slug: string;
  title: string;
  summary: string;
  rank: number;
};

const TYPE_MAP: Record<string, SearchResult["type"] | undefined> = {
  paper: "paper",
  event: "event",
  project: "project",
  job: "job",
  newsletter: "newsletter",
};

function hrefFor(type: SearchResult["type"], slug: string): string {
  switch (type) {
    case "event":
      return `/events/${slug}`;
    case "paper":
      return `/papers/${slug}`;
    case "project":
      return `/projects/${slug}`;
    case "job":
      return `/jobs/${slug}`;
    case "newsletter":
      return `/newsletter/${slug}`;
    default:
      return `/search?q=${encodeURIComponent(slug)}`;
  }
}

export async function searchPortalRemote(query: string): Promise<SearchResult[] | null> {
  const q = query.trim();
  if (q.length < 2) return [];

  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase.rpc("search_portal_content", {
    search_query: q,
  });

  if (error) {
    if (error.code === "PGRST202" || error.message?.includes("search_portal_content")) {
      return null;
    }
    return null;
  }

  return (data as RemoteHit[])
    .map((row) => {
      const type = TYPE_MAP[row.content_type];
      if (!type) return null;
      return {
        type,
        slug: row.slug,
        title: row.title,
        summary: row.summary ?? "",
        href: hrefFor(type, row.slug),
        tags: [],
      } satisfies SearchResult;
    })
    .filter((x): x is SearchResult => x !== null);
}
