export function guideHeadingId(text: string, index: number): string {
  return `guide-section-${index}-${text.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}
