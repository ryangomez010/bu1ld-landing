import { readUserJson, writeUserJson } from "@/lib/storage";

export type RecentViewType = "project" | "paper" | "guide";

export type RecentView = {
  type: RecentViewType;
  slug: string;
  title: string;
  href: string;
  viewedAt: string;
};

const STORAGE_BASE = "build:recent-views";
const MAX_VIEWS = 12;

export function pushRecentView(
  userId: string,
  view: Pick<RecentView, "type" | "slug" | "title" | "href">,
): void {
  const items = readUserJson<RecentView[]>(STORAGE_BASE, userId, []);
  const key = `${view.type}:${view.slug}`;
  const filtered = items.filter((v) => `${v.type}:${v.slug}` !== key);
  const next: RecentView = { ...view, viewedAt: new Date().toISOString() };
  writeUserJson(STORAGE_BASE, userId, [next, ...filtered].slice(0, MAX_VIEWS));
}

export function getRecentViews(userId: string): RecentView[] {
  return readUserJson<RecentView[]>(STORAGE_BASE, userId, []);
}

export function getLastRecentView(userId: string, types?: RecentViewType[]): RecentView | null {
  const items = getRecentViews(userId);
  if (!types?.length) return items[0] ?? null;
  return items.find((v) => types.includes(v.type)) ?? null;
}
