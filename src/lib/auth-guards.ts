/** Pure redirect helpers for auth guard components (unit-testable). */

export function authedRedirectPath(
  user: { id: string } | null | undefined,
  profile: { onboarding_completed?: boolean } | null | undefined,
  destination: string,
): string | null {
  if (!user) return null;
  if (profile && !profile.onboarding_completed) return "/onboarding";
  return destination;
}

export function memberGatePath(
  user: { id: string } | null | undefined,
  profile: { onboarding_completed?: boolean } | null | undefined,
): "/login" | "/onboarding" | null {
  if (!user) return "/login";
  if (profile && !profile.onboarding_completed) return "/onboarding";
  return null;
}

/** Whether createNotification should use direct insert vs notify_users RPC. */
export function shouldUseNotifyUsersRpc(
  sessionUserId: string | undefined,
  targetUserId: string,
): boolean {
  return Boolean(sessionUserId && sessionUserId !== targetUserId);
}
