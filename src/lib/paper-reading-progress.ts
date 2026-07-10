const key = (userId: string, paperSlug: string) => `build:paper-progress:${userId}:${paperSlug}`;

export function getPaperScrollProgress(userId: string, paperSlug: string): number {
  if (typeof window === "undefined") return 0;
  const raw = localStorage.getItem(key(userId, paperSlug));
  return raw ? Math.min(100, Math.max(0, Number(raw))) : 0;
}

export function setPaperScrollProgress(userId: string, paperSlug: string, percent: number): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key(userId, paperSlug), String(Math.round(percent)));
}

export function getAllPaperScrollProgress(userId: string): Record<string, number> {
  if (typeof window === "undefined") return {};
  const result: Record<string, number> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k?.startsWith(`build:paper-progress:${userId}:`)) continue;
    const slug = k.slice(`build:paper-progress:${userId}:`.length);
    result[slug] = getPaperScrollProgress(userId, slug);
  }
  return result;
}
