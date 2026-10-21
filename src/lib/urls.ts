export function isSafeUrl(url: string | null | undefined): boolean {
  if (!url?.trim()) return false;
  try {
    const parsed = new URL(url.trim());
    return (
      (parsed.protocol === "http:" || parsed.protocol === "https:") &&
      !parsed.username &&
      !parsed.password
    );
  } catch {
    return false;
  }
}

export function safeHref(url: string | null | undefined): string | undefined {
  return isSafeUrl(url) ? url!.trim() : undefined;
}
