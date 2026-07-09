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

export function relativeTime(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (Number.isNaN(diff)) return "";
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}
