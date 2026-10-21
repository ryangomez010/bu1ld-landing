/** Keep network failures recoverable in forms instead of leaving a pending button. */
export function authErrorMessage(error: unknown): string {
  return error instanceof Error && error.message
    ? error.message
    : "Account access could not be completed. Check your connection and try again.";
}

export async function runAuthRequest(
  request: () => Promise<{ error: { message: string } | null }>,
): Promise<{ error: string | null }> {
  try {
    const { error } = await request();
    return { error: error?.message ?? null };
  } catch (error) {
    return { error: authErrorMessage(error) };
  }
}

/** URLSearchParams has already decoded percent escapes; decoding twice can throw. */
export function authCallbackError(search: string, hash: string): string | null {
  const query = new URLSearchParams(search);
  const fragment = new URLSearchParams(hash.replace(/^#/, ""));
  return (
    query.get("error_description") ??
    fragment.get("error_description") ??
    query.get("error") ??
    fragment.get("error")
  );
}
