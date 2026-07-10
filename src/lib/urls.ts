/** Allow only safe http(s) URLs for user-supplied links. */
const SAFE_URL = /^https?:\/\//i;

export function isSafeUrl(url: string | null | undefined): boolean {
  if (!url?.trim()) return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return SAFE_URL.test(url.trim());
  }
}

export function safeHref(url: string | null | undefined): string | undefined {
  return isSafeUrl(url) ? url!.trim() : undefined;
}
