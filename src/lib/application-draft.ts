const key = (userId: string, projectId: string) => `build:pitch-draft:${userId}:${projectId}`;
type DraftStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export type ApplicationDraft = { pitch: string; answers: Record<string, string> };

export function loadApplicationDraft(
  userId: string,
  projectId: string,
  storage?: DraftStorage,
): ApplicationDraft {
  const draft: ApplicationDraft = { pitch: "", answers: {} };
  if (!userId || !projectId || (!storage && typeof window === "undefined")) return draft;
  try {
    const target = storage ?? localStorage;
    draft.pitch = target.getItem(key(userId, projectId)) ?? "";
    const answers = JSON.parse(target.getItem(`${key(userId, projectId)}:answers`) ?? "{}");
    if (answers && typeof answers === "object" && !Array.isArray(answers)) {
      draft.answers = Object.fromEntries(
        Object.entries(answers).filter(
          (entry): entry is [string, string] => typeof entry[1] === "string",
        ),
      );
    }
  } catch {
    // Preserve a readable legacy pitch even when the answer record is malformed.
  }
  return draft;
}

export function saveApplicationDraft(
  userId: string,
  projectId: string,
  draft: ApplicationDraft,
  storage?: DraftStorage,
): boolean {
  if (!userId || !projectId || (!storage && typeof window === "undefined")) return false;
  try {
    const target = storage ?? localStorage;
    if (draft.pitch.trim()) target.setItem(key(userId, projectId), draft.pitch);
    else target.removeItem(key(userId, projectId));
    if (Object.values(draft.answers).some((answer) => answer.trim()))
      target.setItem(`${key(userId, projectId)}:answers`, JSON.stringify(draft.answers));
    else target.removeItem(`${key(userId, projectId)}:answers`);
    return true;
  } catch {
    return false;
  }
}

export function loadPitchDraft(userId: string, projectId: string): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(key(userId, projectId)) ?? "";
  } catch {
    return "";
  }
}

export function savePitchDraft(userId: string, projectId: string, pitch: string): void {
  if (typeof window === "undefined") return;
  try {
    if (!pitch.trim()) {
      localStorage.removeItem(key(userId, projectId));
      return;
    }
    localStorage.setItem(key(userId, projectId), pitch);
  } catch {
    // A browser storage failure must not prevent an application submission.
  }
}

export function clearPitchDraft(userId: string, projectId: string, storage?: DraftStorage): void {
  if (!storage && typeof window === "undefined") return;
  try {
    const target = storage ?? localStorage;
    target.removeItem(key(userId, projectId));
    target.removeItem(`${key(userId, projectId)}:answers`);
  } catch {
    // The remote application has already been saved.
  }
}
