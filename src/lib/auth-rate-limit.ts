import { checkFormRateLimit } from "@/lib/security";

/** Client-side throttle for auth forms — keyed by normalized email. */
export function guardAuthAttempt(formId: string, email: string): string | null {
  const key = email.trim().toLowerCase();
  if (!key) return "Email is required.";
  const result = checkFormRateLimit(key, formId, 60_000, 8);
  if (!result.allowed) {
    const secs = Math.max(1, Math.ceil(result.retryAfterMs / 1000));
    return `Too many attempts. Please wait ${secs} second${secs === 1 ? "" : "s"} and try again.`;
  }
  return null;
}
