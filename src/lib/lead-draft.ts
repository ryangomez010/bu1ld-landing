const key = (userId: string) => `build:lead-draft:${userId}`;

export function loadLeadDraft(userId: string): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(key(userId)) ?? "";
}

export function saveLeadDraft(userId: string, message: string): void {
  if (typeof window === "undefined") return;
  if (!message.trim()) {
    localStorage.removeItem(key(userId));
    return;
  }
  localStorage.setItem(key(userId), message);
}

export function clearLeadDraft(userId: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(key(userId));
}
