import { getSupabase } from "@/lib/supabase";
import type { Paper } from "@/lib/types";

export type EditorialState =
  | "draft"
  | "source_checked"
  | "editorial_pending"
  | "approved"
  | "published"
  | "legacy_published"
  | "withdrawn";
export type EditorialAction =
  | "source_check"
  | "submit"
  | "approve"
  | "publish"
  | "withdraw"
  | "request_changes";
export type PaperEditorial = {
  paper_id: string;
  state: EditorialState;
  revision_hash: string;
  decision_token: string;
  source_evidence: Record<string, unknown>;
  checked_at: string | null;
  approved_at: string | null;
  approval_note: string | null;
  published_at: string | null;
  paper: Paper;
};
export function paperWordCount(body: string): number {
  return body.trim() ? body.trim().split(/\s+/).length : 0;
}
export function safePaperSource(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      !!url.hostname &&
      !url.username &&
      !url.password &&
      !/\s/.test(value)
    );
  } catch {
    return false;
  }
}
export function paperQualityIssues(paper: Paper): string[] {
  const issues: string[] = [];
  if (paper.title.trim().length < 5) issues.push("Add a descriptive title.");
  if ((paper.authors ?? "").trim().length < 3) issues.push("Identify the paper authors.");
  if (!safePaperSource(paper.source_url ?? paper.arxiv_url ?? ""))
    issues.push("Add an HTTPS primary source.");
  if ((paper.editorial_summary ?? paper.summary ?? "").trim().length < 40)
    issues.push("Add an editorial summary of at least 40 characters.");
  const count = paperWordCount(paper.review_body);
  if (count < 700 || count > 1200) issues.push("The review must contain 700–1200 words.");
  if ((paper.review_body.match(/^##\s+[^#]/gm) ?? []).length < 8)
    issues.push("Use eight clearly headed review sections.");
  return issues;
}
export function parsePaperSourceEvidence(form: FormData): Record<string, unknown> {
  const text = (key: string) => String(form.get(key) ?? "").trim();
  for (const key of [
    "human_attestation",
    "full_text_read",
    "appendices_inspected",
    "figures_inspected",
  ]) {
    if (form.get(key) !== "on") throw new Error("Complete every human source-reading attestation.");
  }
  if (!safePaperSource(text("full_text_url")))
    throw new Error("Use an HTTPS full-text URL without credentials.");
  if (!/^[a-f0-9]{64}$/.test(text("source_sha256")))
    throw new Error("Enter the source file's SHA256 checksum.");
  if (
    !text("source_version") ||
    text("license").length < 3 ||
    text("notes").length < 40 ||
    text("ai_disclosure").length < 10
  )
    throw new Error("Add source version, license, detailed checking notes and AI disclosure.");
  let citations: unknown;
  try {
    citations = JSON.parse(text("citations"));
  } catch {
    throw new Error("Citations must be a JSON list of URL, locator and claim records.");
  }
  if (
    !Array.isArray(citations) ||
    citations.length < 3 ||
    citations.some(
      (c) =>
        !c ||
        !safePaperSource(c.url ?? "") ||
        typeof c.locator !== "string" ||
        c.locator.trim().length < 3 ||
        typeof c.claim !== "string" ||
        c.claim.trim().length < 10,
    )
  )
    throw new Error(
      "Provide at least three citations with HTTPS sources, locators and supported claims.",
    );
  return {
    full_text_url: text("full_text_url"),
    source_sha256: text("source_sha256"),
    source_version: text("source_version"),
    license: text("license"),
    notes: text("notes"),
    ai_disclosure: text("ai_disclosure"),
    citations,
    human_attestation: true,
    full_text_read: true,
    appendices_inspected: true,
    figures_inspected: true,
  };
}
export async function loadPaperEditorial(paperId: string): Promise<PaperEditorial> {
  const client = getSupabase();
  if (!client) throw new Error("Editorial workflow unavailable.");
  // Related paper and revision come from one statement, so the editor sees the attested snapshot.
  const { data, error } = await client
    .from("paper_editorial_workflows")
    .select("*, paper:papers(*)")
    .eq("paper_id", paperId)
    .abortSignal(AbortSignal.timeout(8_000))
    .maybeSingle();
  if (
    error ||
    !data?.paper ||
    !/^[a-f0-9]{64}$/.test(data.revision_hash ?? "") ||
    !/^[a-f0-9-]{36}$/i.test(data.decision_token ?? "")
  )
    throw new Error(
      "Editorial workflow unavailable. Verify editor access and the phase36 migration.",
    );
  return data as unknown as PaperEditorial;
}
export async function transitionPaperEditorial(
  paperId: string,
  action: EditorialAction,
  revision: string,
  decisionToken: string,
  evidence: Record<string, unknown> = {},
): Promise<void> {
  const client = getSupabase();
  if (!client) throw new Error("Editorial workflow unavailable.");
  if (!/^[a-f0-9]{64}$/.test(revision))
    throw new Error("Reload the current paper revision before recording a decision.");
  if (!/^[a-f0-9-]{36}$/i.test(decisionToken))
    throw new Error("Reload the current editorial evidence before recording a decision.");
  const { data, error } = await client
    .rpc("transition_paper_editorial", {
      p_paper_id: paperId,
      p_action: action,
      p_revision_hash: revision,
      p_decision_token: decisionToken,
      p_evidence: evidence,
    })
    .abortSignal(AbortSignal.timeout(8_000));
  if (error)
    throw new Error(
      error.code === "P0001"
        ? error.message
        : "The editorial decision could not be saved. Reload and verify editor access.",
    );
  const expected: Record<EditorialAction, EditorialState> = {
    source_check: "source_checked",
    submit: "editorial_pending",
    approve: "approved",
    publish: "published",
    withdraw: "withdrawn",
    request_changes: "draft",
  };
  if (
    !data ||
    data.paper_id !== paperId ||
    data.revision_hash !== revision ||
    data.state !== expected[action] ||
    !/^[a-f0-9-]{36}$/i.test(data.decision_token ?? "") ||
    data.decision_token === decisionToken
  )
    throw new Error(
      "The editorial decision was not confirmed. Reload its recorded state before retrying.",
    );
}
