import { clampText } from "@/lib/security";

const KEY = (userId: string, slug: string) => `build:paper-notes:${userId}:${slug}`;

export function getPaperNotes(userId: string, paperSlug: string): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(KEY(userId, paperSlug)) ?? "";
}

export function savePaperNotes(userId: string, paperSlug: string, notes: string): void {
  if (typeof window === "undefined") return;
  const safe = clampText(notes, 4000);
  if (!safe.trim()) {
    localStorage.removeItem(KEY(userId, paperSlug));
    return;
  }
  localStorage.setItem(KEY(userId, paperSlug), safe);
}

export function hasPaperNotes(userId: string, paperSlug: string): boolean {
  return getPaperNotes(userId, paperSlug).trim().length > 0;
}
