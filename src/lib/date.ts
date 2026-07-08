export function formatDate(dateStr: string | null): string {
  if (!dateStr) return "TBD";
  return new Date(dateStr + (dateStr.includes("T") ? "" : "T00:00:00")).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    },
  );
}

export function daysUntil(dateStr: string): number | null {
  const target = new Date(dateStr + (dateStr.includes("T") ? "" : "T00:00:00"));
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

export function nearestDeadline(
  deadlines: { label: string; date: string }[],
): { label: string; date: string; days: number } | null {
  const upcoming = deadlines
    .map((d) => ({ ...d, days: daysUntil(d.date) ?? 9999 }))
    .filter((d) => d.days >= 0)
    .sort((a, b) => a.days - b.days);
  return upcoming[0] ?? null;
}
