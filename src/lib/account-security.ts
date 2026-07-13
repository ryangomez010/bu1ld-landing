import { isSensitiveAction, sanitizeText } from "@/lib/security";
import { getSupabase } from "@/lib/supabase";

export type SecurityEvent = {
  id: string;
  user_id: string | null;
  event_type: string;
  detail: Record<string, unknown> | null;
  created_at: string;
};

export type ConnectedIdentity = {
  provider: string;
  email?: string;
  created_at?: string;
};

export function getConnectedIdentities(
  identities:
    | { provider?: string; identity_data?: Record<string, unknown>; created_at?: string }[]
    | undefined,
): ConnectedIdentity[] {
  if (!identities?.length) return [];
  return identities.map((id) => ({
    provider: id.provider ?? "unknown",
    email: typeof id.identity_data?.email === "string" ? id.identity_data.email : undefined,
    created_at: id.created_at,
  }));
}

export async function logSecurityEvent(
  userId: string,
  eventType: string,
  detail?: Record<string, unknown>,
): Promise<void> {
  if (!isSensitiveAction(eventType)) {
    console.warn("[security] rejected unknown event type:", eventType);
    return;
  }

  const supabase = getSupabase();
  if (!supabase) return;

  await supabase.from("security_events").insert({
    user_id: userId,
    event_type: sanitizeText(eventType, 60),
    detail: detail ?? null,
  });
}

export async function fetchMySecurityEvents(userId: string, limit = 20): Promise<SecurityEvent[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("security_events")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as SecurityEvent[];
}

export async function fetchAdminSecurityEvents(limit = 100): Promise<SecurityEvent[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("security_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as SecurityEvent[];
}

export async function requestAccountDeletion(userId: string): Promise<{ error: string | null }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "Supabase is not configured." };

  const { error } = await supabase.rpc("request_account_deletion");
  if (error) return { error: error.message };

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  const endpoint =
    import.meta.env.VITE_ACCOUNT_DELETION_ENDPOINT?.trim() ||
    (typeof window !== "undefined" ? `${window.location.origin}/api/account-deletion` : null);

  if (token && endpoint) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) {
        console.warn("[account-deletion] auth user removal failed:", await res.text());
      }
    } catch (e) {
      console.warn("[account-deletion] finalize request failed:", e);
    }
  }

  await supabase.auth.signOut({ scope: "global" });
  await logSecurityEvent(userId, "account_deletion_completed");
  return { error: null };
}

export type SignInSession = {
  id: string;
  event_type: string;
  created_at: string;
  device: string;
  user_agent?: string;
};

const SIGN_IN_EVENTS = new Set(["sign_in", "password_changed", "global_sign_out"]);

/** Recent sign-in / security sessions derived from security_events. */
export async function fetchSignInSessions(userId: string, limit = 10): Promise<SignInSession[]> {
  const events = await fetchMySecurityEvents(userId, 50);
  return events
    .filter((e) => SIGN_IN_EVENTS.has(e.event_type) || e.event_type.includes("sign"))
    .slice(0, limit)
    .map((e) => {
      const detail = e.detail ?? {};
      const ua = typeof detail.user_agent === "string" ? detail.user_agent : undefined;
      return {
        id: e.id,
        event_type: e.event_type,
        created_at: e.created_at,
        device: typeof detail.device === "string" ? detail.device : parseDeviceLabel(ua),
        user_agent: ua,
      };
    });
}

function parseDeviceLabel(userAgent?: string): string {
  if (!userAgent) return "Unknown device";
  if (/iPhone|iPad/i.test(userAgent)) return "iOS device";
  if (/Android/i.test(userAgent)) return "Android device";
  if (/Mac OS/i.test(userAgent)) return "Mac";
  if (/Windows/i.test(userAgent)) return "Windows";
  if (/Linux/i.test(userAgent)) return "Linux";
  return "Web browser";
}

export function currentDeviceLabel(): string {
  if (typeof navigator === "undefined") return "This device";
  return parseDeviceLabel(navigator.userAgent);
}
