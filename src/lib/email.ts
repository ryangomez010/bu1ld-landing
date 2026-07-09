/**
 * Email layer — prefer a server/edge path in production.
 * Client Resend via VITE_RESEND_API_KEY is for local/dev only.
 * Prefer RESEND_API_KEY on a Cloudflare/Vercel function and call that instead.
 */

import { getSupabase } from "@/lib/supabase";

export type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

export function welcomeEmail(name: string): Pick<EmailPayload, "subject" | "html"> {
  const display = name || "Builder";
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
  return {
    subject: `Application update: ${projectTitle}`,
    html: `
      <h1>Application ${status}</h1>
      <p>Your application to <strong>${projectTitle}</strong> is now <strong>${status}</strong>.</p>
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
  // Cross-user email requires a server/edge function with the service role.
  return null;
}

export async function sendEmail(payload: EmailPayload): Promise<{ sent: boolean; error?: string }> {
  const edgeUrl = import.meta.env.VITE_EMAIL_ENDPOINT as string | undefined;
  if (edgeUrl) {
    try {
      const res = await fetch(edgeUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) return { sent: false, error: await res.text() };
      return { sent: true };
    } catch (e) {
      return { sent: false, error: e instanceof Error ? e.message : "Send failed" };
    }
  }

  const apiKey = import.meta.env.VITE_RESEND_API_KEY as string | undefined;

  if (!apiKey) {
    if (import.meta.env.DEV) {
      console.info("[email:preview]", payload.subject, "→", payload.to);
    }
    return { sent: false, error: "Email not configured (set VITE_EMAIL_ENDPOINT or VITE_RESEND_API_KEY)" };
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
      const text = await res.text();
      return { sent: false, error: text };
    }
    return { sent: true };
  } catch (e) {
    return { sent: false, error: e instanceof Error ? e.message : "Send failed" };
  }
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
    // Prefer VITE_EMAIL_ENDPOINT — server looks up the recipient by userId.
    const edgeUrl = import.meta.env.VITE_EMAIL_ENDPOINT as string | undefined;
    if (edgeUrl) {
      await fetch(edgeUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...tpl }),
      }).catch(() => undefined);
    }
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
    const edgeUrl = import.meta.env.VITE_EMAIL_ENDPOINT as string | undefined;
    if (edgeUrl) {
      await fetch(edgeUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...tpl }),
      }).catch(() => undefined);
    }
    return;
  }
  await sendEmail({ to, ...tpl });
}
