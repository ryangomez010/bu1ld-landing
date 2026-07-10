import { readUserJson, writeUserJson } from "@/lib/storage";

const STORAGE_BASE = "build:papers-read";

function readLocal(userId: string): string[] {
  return readUserJson<string[]>(STORAGE_BASE, userId, []);
}

function writeLocal(userId: string, slugs: string[]) {
  writeUserJson(STORAGE_BASE, userId, slugs);
}

export async function getReadPaperSlugs(userId: string): Promise<Set<string>> {
  return new Set(readLocal(userId));
}

export async function isPaperRead(userId: string, slug: string): Promise<boolean> {
  return readLocal(userId).includes(slug);
}

export async function markPaperRead(userId: string, slug: string): Promise<void> {
  const slugs = readLocal(userId);
  if (!slugs.includes(slug)) writeLocal(userId, [slug, ...slugs]);
}

export async function unmarkPaperRead(userId: string, slug: string): Promise<void> {
  writeLocal(
    userId,
    readLocal(userId).filter((s) => s !== slug),
  );
}
