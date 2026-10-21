export type AccountDeletionResult = {
  error: string | null;
  status: "not_started" | "partial" | "unknown" | "complete";
};

/** Success requires the service's explicit Auth deletion receipt, not just HTTP 200. */
export async function finalizeAccountDeletion(
  endpoint: string,
  token: string,
  request: typeof fetch = fetch,
): Promise<AccountDeletionResult> {
  try {
    const response = await request(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(30000),
    });
    const body = (await response.json()) as {
      deleted?: boolean;
      dataRemoved?: boolean;
      status?: string;
      error?: string;
    };
    if (response.ok && body?.deleted === true) return { error: null, status: "complete" };
    if (body?.dataRemoved === true || body?.status === "partial") {
      return {
        status: "partial",
        error:
          "Your member data was removed, but sign-in credential deletion is not confirmed. Retry deletion or contact hello@thebu1ld.com. Keep this session open to retry.",
      };
    }
    if (body?.status === "not_started" || [401, 403, 503].includes(response.status)) {
      return {
        status: "not_started",
        error:
          "Account deletion could not start. Check your session and try again, or contact hello@thebu1ld.com.",
      };
    }
  } catch {
    // A lost response cannot tell us whether either irreversible step completed.
  }
  return {
    status: "unknown",
    error:
      "Account deletion could not be confirmed. Some data may already have been removed. Keep this session open and retry, or contact hello@thebu1ld.com.",
  };
}
