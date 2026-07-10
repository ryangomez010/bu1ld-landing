const key = (userId: string, projectId: string) => `build:pitch-draft:${userId}:${projectId}`;

export function loadPitchDraft(userId: string, projectId: string): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(key(userId, projectId)) ?? "";
}

export function savePitchDraft(userId: string, projectId: string, pitch: string): void {
  if (typeof window === "undefined") return;
  if (!pitch.trim()) {
    localStorage.removeItem(key(userId, projectId));
    return;
  }
  localStorage.setItem(key(userId, projectId), pitch);
}

export function clearPitchDraft(userId: string, projectId: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(key(userId, projectId));
}
