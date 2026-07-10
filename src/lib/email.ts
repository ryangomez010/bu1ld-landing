/**
 * Email layer — prefer a server/edge path in production.
 * Client Resend via VITE_RESEND_API_KEY is for local/dev only.
 */

import { getSupabase } from "@/lib/supabase";

export type EmailPayload = {
  to: string;
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
  const secret = import.meta.env.VITE_EMAIL_API_SECRET as string | undefined;
  if (secret) headers.Authorization = `Bearer ${secret}`;
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
      <p>You're in the membership pool. Complete your profile, browse open projects, and explore guides when you need context.</p>
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
      <p>You can now create projects and review applications from the member hub.</p>
      <p><a href="https://thebu1ld.com/projects/manage">My projects →</a></p>
    `.trim(),
  };
}

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
      if (!res.ok) return { sent: false, error: await res.text() };
      return { sent: true };
    } catch (e) {
      return { sent: false, error: e instanceof Error ? e.message : "Send failed" };
    }
  }

  if (import.meta.env.PROD) {
    return { sent: false, error: "Set VITE_EMAIL_ENDPOINT for production email" };
  }

  const apiKey = import.meta.env.VITE_RESEND_API_KEY as string | undefined;
  if (!apiKey) {
    if (import.meta.env.DEV) {
      console.info("[email:preview]", payload.subject, "→", payload.to);
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
      return { sent: false, error: await res.text() };
    }
    return { sent: true };
  } catch (e) {
    return { sent: false, error: e instanceof Error ? e.message : "Send failed" };
  }
}

async function sendViaEdge(
  userId: string,
  tpl: Pick<EmailPayload, "subject" | "html">,
): Promise<void> {
  const edgeUrl = resolveEmailEndpoint();
  if (!edgeUrl) return;
  await fetch(edgeUrl, {
    method: "POST",
    headers: emailHeaders(),
    body: JSON.stringify({ userId, ...tpl }),
  }).catch(() => undefined);
}

export async function notifyApplicationUpdate(
  userId: string,
  projectTitle: string,
  status: string,
): Promise<void> {
  const tpl = applicationUpdateEmail(projectTitle, status);
  const to = await resolveUserEmail(userId);
  if (!to) {
    if (import.meta.env.DEV) {
      console.info("[email:queued-needs-edge]", tpl.subject, "user:", userId);
    }
    await sendViaEdge(userId, tpl);
    return;
  }
  await sendEmail({ to, ...tpl });
}

export async function notifyLeadApproved(userId: string): Promise<void> {
  const tpl = leadApprovedEmail();
  const to = await resolveUserEmail(userId);
  if (!to) {
    if (import.meta.env.DEV) {
      console.info("[email:queued-needs-edge]", tpl.subject, "user:", userId);
    }
    await sendViaEdge(userId, tpl);
    return;
  }
  await sendEmail({ to, ...tpl });
}
