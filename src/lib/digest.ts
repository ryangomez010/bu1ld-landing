/** Server-side digest email builder and HTML templates. */

import type { ForYouItem } from "@/lib/personalization";

export type DigestRecipient = {
  userId: string;
  email: string;
  fullName: string | null;
  interests: string[];
  frequency: "daily" | "weekly";
};

export type DigestContent = {
  subject: string;
  html: string;
  itemCount: number;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildDigestEmail(
  recipient: Pick<DigestRecipient, "fullName" | "frequency">,
  items: ForYouItem[],
): DigestContent {
  const name = escapeHtml(recipient.fullName?.trim() || "Builder");
  const cadence = recipient.frequency === "daily" ? "today" : "this week";
  const subject =
    recipient.frequency === "daily"
      ? "Your Bu1ld digest — today"
      : "Your Bu1ld digest — weekly highlights";

  const rows =
    items.length === 0
      ? `<p>No new highlights matched your interests ${cadence}. <a href="https://thebu1ld.com/research">Browse research →</a></p>`
      : `<ul>${items
          .map(
            (item) =>
              `<li><strong>${escapeHtml(item.type)}</strong> — <a href="https://thebu1ld.com${escapeHtml(item.href)}">${escapeHtml(item.title)}</a><br/><span style="color:#666;font-size:13px;">${escapeHtml(item.reason)}</span></li>`,
          )
          .join("")}</ul>`;

  const html = `
    <h1>Hi ${name},</h1>
    <p>Here is your ${cadence === "today" ? "daily" : "weekly"} digest from The Bu1ld — paper reviews, open projects, and deadlines ranked by your interest tags.</p>
    ${rows}
    <p><a href="https://thebu1ld.com/dashboard">Open dashboard →</a> · <a href="https://thebu1ld.com/account/preferences">Digest settings</a></p>
    <p>— The Bu1ld</p>
  `.trim();

  return { subject, html, itemCount: items.length };
}

/** Whether a weekly digest should run (Mondays UTC, unless forced). */
export function shouldRunWeeklyDigest(now = new Date(), force = false): boolean {
  if (force) return true;
  return now.getUTCDay() === 1;
}

/** Minimum hours between digest sends for a given frequency. */
export function digestCooldownHours(frequency: "daily" | "weekly"): number {
  return frequency === "daily" ? 20 : 144;
}

export function isDigestDue(
  frequency: "daily" | "weekly",
  lastSentAt: string | null | undefined,
  now = new Date(),
): boolean {
  if (!lastSentAt) return true;
  const last = new Date(lastSentAt).getTime();
  if (Number.isNaN(last)) return true;
  const elapsedHours = (now.getTime() - last) / (1000 * 60 * 60);
  return elapsedHours >= digestCooldownHours(frequency);
}
