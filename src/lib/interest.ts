/** Match content tags/topics against member interests. */
export function matchingTags(contentTags: string[], interests: string[]): string[] {
  if (!interests.length || !contentTags.length) return [];
  const normalized = interests.map((i) => i.toLowerCase());
  return contentTags.filter((tag) => {
    const t = tag.toLowerCase();
    return normalized.some((i) => t.includes(i) || i.includes(t));
  });
}
