/**
 * Email layer — prefer a server/edge path in production.
 * Client Resend via VITE_RESEND_API_KEY is for local/dev only.
 */

import { logClientError } from "@/lib/client-log";
import { getSupabase } from "@/lib/supabase";

export type EmailPayload = {
  to?: string;
  userId?: string;
  subject: string;
  html: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function emailHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  // Never ship API secrets in the client bundle for production builds.
  if (!import.meta.env.PROD) {
    const secret = import.meta.env.VITE_EMAIL_API_SECRET as string | undefined;
    if (secret) headers.Authorization = `Bearer ${secret}`;
  }
  return headers;
}

function resolveEmailEndpoint(): string | undefined {
  const edgeUrl = import.meta.env.VITE_EMAIL_ENDPOINT as string | undefined;
  if (!edgeUrl?.trim()) return undefined;
  try {
    const parsed = new URL(edgeUrl.trim());
    if (parsed.protocol !== "https:" && import.meta.env.PROD) return undefined;
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return undefined;
    return parsed.toString();
  } catch {
    return undefined;
  }
}

export function welcomeEmail(name: string): Pick<EmailPayload, "subject" | "html"> {
  const display = escapeHtml(name || "Builder");
  return {
    subject: "Welcome to The Bu1ld",
    html: `
      <h1>Welcome, ${display}</h1>
      <p>Your account is active. Finish your profile at the link below, then browse open projects and start a reading path when you need context on a thread.</p>
      <p><a href="https://thebu1ld.com/onboarding">Complete your profile →</a></p>
      <p>— The Bu1ld</p>
    `.trim(),
  };
}

export function applicationUpdateEmail(
  projectTitle: string,
  status: string,
): Pick<EmailPayload, "subject" | "html"> {
  const title = escapeHtml(projectTitle);
  const statusLabel = escapeHtml(status);
  return {
    subject: `Application update: ${projectTitle}`,
    html: `
      <h1>Application ${statusLabel}</h1>
      <p>Your application to <strong>${title}</strong> is now <strong>${statusLabel}</strong>.</p>
      <p><a href="https://thebu1ld.com/applications">View applications →</a></p>
    `.trim(),
  };
}

export function leadApprovedEmail(): Pick<EmailPayload, "subject" | "html"> {
  return {
    subject: "Project lead status approved",
    html: `
      <h1>You're a verified project lead</h1>
      <p>You can now create projects, review applications, and post updates from the project management area.</p>
      <p><a href="https://thebu1ld.com/projects/manage">My projects →</a></p>
    `.trim(),
  };
}

/** Resolve the signed-in user's email only — cross-user delivery uses the edge endpoint. */
export async function resolveUserEmail(userId: string): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  if (data.user?.id === userId) return data.user.email ?? null;
  return null;
}

export async function sendEmail(payload: EmailPayload): Promise<{ sent: boolean; error?: string }> {
  const edgeUrl = resolveEmailEndpoint();
  if (edgeUrl) {
    try {
      const res = await fetch(edgeUrl, {
        method: "POST",
        headers: emailHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const detail = await res.text();
        logClientError("email:edge", detail, { subject: payload.subject });
        return { sent: false, error: detail };
      }
      return { sent: true };
    } catch (e) {
      const message = e instanceof Error ? e.message : "Send failed";
      logClientError("email:edge", e, { subject: payload.subject });
      return { sent: false, error: message };
    }
  }

  if (import.meta.env.PROD) {
    return { sent: false, error: "Set VITE_EMAIL_ENDPOINT for production email" };
  }

  if (!payload.to) {
    return { sent: false, error: "Recipient email required without edge endpoint" };
  }

  const apiKey = import.meta.env.VITE_RESEND_API_KEY as string | undefined;
  if (!apiKey) {
    if (import.meta.env.DEV) {
      console.info("[email:preview]", payload.subject, "→", payload.to ?? payload.userId);
    }
    return { sent: false, error: "Email not configured" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "The Bu1ld <hello@thebu1ld.com>",
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      }),
    });
    if (!res.ok) {
      const detail = await res.text();
      logClientError("email:resend", detail, { subject: payload.subject });
      return { sent: false, error: detail };
    }
    return { sent: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Send failed";
    logClientError("email:resend", e, { subject: payload.subject });
    return { sent: false, error: message };
  }
}

/** Send email to another user via the edge endpoint (service-role lookup). */
async function sendToUser(
  userId: string,
  tpl: Pick<EmailPayload, "subject" | "html">,
): Promise<{ sent: boolean; error?: string }> {
  const edgeUrl = resolveEmailEndpoint();
  if (edgeUrl) {
    return sendEmail({ userId, ...tpl });
  }

  const to = await resolveUserEmail(userId);
  if (to) {
    return sendEmail({ to, ...tpl });
  }

  if (import.meta.env.DEV) {
    console.info("[email:queued-needs-edge]", tpl.subject, "user:", userId);
  }
  return { sent: false, error: "Edge endpoint required for cross-user email" };
}

export async function notifyApplicationUpdate(
  userId: string,
  projectTitle: string,
  status: string,
): Promise<void> {
  const tpl = applicationUpdateEmail(projectTitle, status);
  const result = await sendToUser(userId, tpl);
  if (!result.sent && result.error) {
    logClientError("email:notify-application", result.error, { userId, status });
  }
}

export async function notifyLeadApproved(userId: string): Promise<void> {
  const tpl = leadApprovedEmail();
  const result = await sendToUser(userId, tpl);
  if (!result.sent && result.error) {
    logClientError("email:notify-lead", result.error, { userId });
  }
}
