import type { MemberWorkspaceContribution } from "@/lib/project-collaboration";

export const EVIDENCE_FILTERS = [
  { value: "all", label: "All evidence" },
  { value: "needs_changes", label: "Needs changes" },
  { value: "submitted", label: "Awaiting review" },
  { value: "verified", label: "Verified" },
] as const;

export type EvidenceFilter = (typeof EVIDENCE_FILTERS)[number]["value"];

export function filterWorkspaceEvidence<
  T extends Pick<
    MemberWorkspaceContribution,
    | "project_id"
    | "verification_status"
    | "title"
    | "summary"
    | "milestone_title"
    | "contribution_type"
    | "verification_note"
  >,
>(contributions: readonly T[], projectId: string, status: EvidenceFilter, query: string): T[] {
  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return contributions.filter((entry) => {
    if (entry.project_id !== projectId) return false;
    if (status !== "all" && entry.verification_status !== status) return false;
    const text = [
      entry.title,
      entry.summary,
      entry.milestone_title,
      entry.contribution_type,
      entry.verification_note,
    ]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase();
    return words.every((word) => text.includes(word));
  });
}
