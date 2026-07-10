function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function formatIcsDate(dateStr: string): string {
  const d = new Date(dateStr.includes("T") ? dateStr : `${dateStr}T09:00:00`);
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

export function buildIcsEvent(opts: {
  title: string;
  startDate: string;
  endDate?: string | null;
  description?: string;
  location?: string | null;
  url?: string | null;
}): string {
  const uid = `${Date.now()}@thebu1ld.com`;
  const start = formatIcsDate(opts.startDate);
  const end = formatIcsDate(opts.endDate ?? opts.startDate);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//The Bu1ld//EN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatIcsDate(new Date().toISOString())}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${opts.title.replace(/[,;\\]/g, "")}`,
  ];
  if (opts.description)
    lines.push(`DESCRIPTION:${opts.description.slice(0, 500).replace(/\n/g, "\\n")}`);
  if (opts.location) lines.push(`LOCATION:${opts.location.replace(/[,;\\]/g, "")}`);
  if (opts.url) lines.push(`URL:${opts.url}`);
  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadIcs(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
