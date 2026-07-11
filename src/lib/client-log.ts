/** Lightweight client-side error logging for non-fatal failures. */

export function logClientError(scope: string, error: unknown, context?: Record<string, unknown>) {
  if (import.meta.env.DEV) {
    console.error(`[${scope}]`, error, context ?? "");
    return;
  }
  console.error(`[${scope}]`, error instanceof Error ? error.message : String(error));
}
