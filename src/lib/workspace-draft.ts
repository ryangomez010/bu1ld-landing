import type { CollaborationVisibility, ContributionType } from "@/lib/types";

export type WorkspaceDraft = {
  title: string;
  summary: string;
  evidenceUrl: string;
  contributionType: ContributionType;
  visibility: CollaborationVisibility;
  milestoneId: string;
};

type DraftStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
const key = (userId: string, projectId: string) => `build:workspace-draft:${userId}:${projectId}`;
const types: ContributionType[] = [
  "research",
  "experiment",
  "code",
  "review",
  "design",
  "product",
  "operations",
];

export function emptyWorkspaceDraft(): WorkspaceDraft {
  return {
    title: "",
    summary: "",
    evidenceUrl: "",
    contributionType: "research",
    visibility: "team",
    milestoneId: "none",
  };
}

export function loadWorkspaceDraft(
  userId: string,
  projectId: string,
  storage?: DraftStorage,
): WorkspaceDraft {
  const draft = emptyWorkspaceDraft();
  if (!userId || !projectId || (!storage && typeof window === "undefined")) return draft;
  try {
    const raw = JSON.parse((storage ?? localStorage).getItem(key(userId, projectId)) ?? "null");
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return draft;
    for (const field of ["title", "summary", "evidenceUrl", "milestoneId"] as const) {
      if (typeof raw[field] === "string") draft[field] = raw[field];
    }
    if (types.includes(raw.contributionType)) draft.contributionType = raw.contributionType;
    if (["private", "team", "public"].includes(raw.visibility)) draft.visibility = raw.visibility;
  } catch {
    // Browser storage is optional; keep the editor usable.
  }
  return draft;
}

export function saveWorkspaceDraft(
  userId: string,
  projectId: string,
  draft: WorkspaceDraft,
  storage?: DraftStorage,
): boolean {
  if (!userId || !projectId || (!storage && typeof window === "undefined")) return false;
  try {
    const target = storage ?? localStorage;
    if (!draft.title.trim() && !draft.summary.trim() && !draft.evidenceUrl.trim()) {
      target.removeItem(key(userId, projectId));
    } else {
      target.setItem(key(userId, projectId), JSON.stringify(draft));
    }
    return true;
  } catch {
    return false;
  }
}
