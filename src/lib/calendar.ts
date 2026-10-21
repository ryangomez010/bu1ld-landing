import { eventDate, publicHttpUrl } from "@/lib/event-state";

function escapeIcs(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r/g, "");
}
function utc(value: string): string {
  const parsed = eventDate(value);
  if (parsed == null) throw new Error("Calendar timestamps require an explicit UTC offset.");
  return new Date(parsed)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}
function fold(line: string): string {
  const encoder = new TextEncoder();
  let width = 0,
    output = "";
  for (const char of line) {
    const size = encoder.encode(char).length;
    if (width + size > 75) {
      output += "\r\n ";
      width = 1;
    }
    output += char;
    width += size;
  }
  return output;
}
export function buildIcsEvent(opts: {
  id?: string;
  title: string;
  startDate: string;
  endDate?: string | null;
  description?: string;
  location?: string | null;
  url?: string | null;
  updatedAt?: string;
}): string {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(opts.startDate);
  const endValue = opts.endDate ?? (dateOnly ? opts.startDate : null);
  if (!endValue || dateOnly !== /^\d{4}-\d{2}-\d{2}$/.test(endValue))
    throw new Error("A confirmed end of the same date type is required.");
  const start = eventDate(opts.startDate);
  const end = eventDate(endValue, dateOnly);
  if (start == null || end == null || end <= start) throw new Error("Invalid calendar interval.");
  // A stable record identity prevents duplicate imports. Date-only DTEND is exclusive.
  const id = opts.id ?? `${opts.title}-${opts.startDate}`;
  const uid = encodeURIComponent(id).slice(0, 220);
  const stamp =
    opts.updatedAt && eventDate(opts.updatedAt) != null ? utc(opts.updatedAt) : utc(opts.startDate);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//The BU1LD//Events//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}@thebu1ld.com`,
    `DTSTAMP:${stamp}`,
    dateOnly
      ? `DTSTART;VALUE=DATE:${opts.startDate.replaceAll("-", "")}`
      : `DTSTART:${utc(opts.startDate)}`,
    dateOnly
      ? `DTEND;VALUE=DATE:${new Date(end).toISOString().slice(0, 10).replaceAll("-", "")}`
      : `DTEND:${utc(endValue)}`,
    `SUMMARY:${escapeIcs(opts.title)}`,
  ];
  if (opts.description) lines.push(`DESCRIPTION:${escapeIcs(opts.description)}`);
  if (opts.location) lines.push(`LOCATION:${escapeIcs(opts.location)}`);
  const url = publicHttpUrl(opts.url);
  if (url) lines.push(`URL:${url}`);
  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
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
