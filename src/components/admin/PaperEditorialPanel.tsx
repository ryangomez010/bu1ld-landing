import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  loadPaperEditorial,
  paperQualityIssues,
  paperWordCount,
  parsePaperSourceEvidence,
  transitionPaperEditorial,
  type EditorialAction,
  type PaperEditorial,
} from "@/lib/paper-editor";

export function PaperEditorialPanel({
  paperId,
  onSaved,
}: {
  paperId: string;
  onSaved: () => void;
}) {
  const [snapshot, setSnapshot] = useState<PaperEditorial | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    setSnapshot(null);
    setError("");
    loadPaperEditorial(paperId)
      .then((data) => {
        if (active) setSnapshot(data);
      })
      .catch((e) => {
        if (active) setError(e instanceof Error ? e.message : "Editorial workflow unavailable.");
      });
    return () => {
      active = false;
    };
  }, [paperId, reload]);
  async function decide(action: EditorialAction, evidence: Record<string, unknown> = {}) {
    if (!snapshot || busy) return;
    setBusy(true);
    setError("");
    try {
      await transitionPaperEditorial(
        paperId,
        action,
        snapshot.revision_hash,
        snapshot.decision_token,
        evidence,
      );
      setReload((value) => value + 1);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save the editorial decision.");
    } finally {
      setBusy(false);
    }
  }
  const issues = snapshot ? paperQualityIssues(snapshot.paper) : [];
  return (
    <section
      className="my-4 space-y-3 rounded-sm border border-border/60 p-4"
      aria-label="Paper editorial workflow"
    >
      <h3 className="font-display text-base">Editorial checks</h3>
      <p className="text-xs text-muted-foreground">
        Platform administrators act as editors. Source checking, human approval and publication are
        separate recorded actions. Editing the text or metadata revokes checks and unpublishes that
        revision.
      </p>
      {error && (
        <p role="alert" className="text-sm text-accent-red">
          {error}{" "}
          <button
            type="button"
            onClick={() => setReload((value) => value + 1)}
            className="underline"
          >
            Reload
          </button>
        </p>
      )}
      {!snapshot && !error && <p role="status">Loading current revision…</p>}
      {snapshot && (
        <>
          <p className="text-sm">
            State: <strong>{snapshot.state.replaceAll("_", " ")}</strong> ·{" "}
            {paperWordCount(snapshot.paper.review_body)} words
          </p>
          {snapshot.state === "legacy_published" && (
            <p className="text-sm">
              Published before this workflow. Historical source checks and human approval have not
              been verified. Editing or withdrawing requires a fresh review before republication.
            </p>
          )}
          <details>
            <summary className="cursor-pointer text-sm">
              Read the exact revision being reviewed
            </summary>
            <h4 className="my-2 font-medium">{snapshot.paper.title}</h4>
            <pre className="max-h-96 overflow-auto whitespace-pre-wrap text-sm">
              {snapshot.paper.review_body}
            </pre>
          </details>
          <p className="break-all font-mono text-[10px]">Revision {snapshot.revision_hash}</p>
          {issues.length ? (
            <ul className="list-disc pl-5 text-sm">
              {issues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm">
              Structural checks pass. An editor must still verify the research claims and evidence.
            </p>
          )}
          {snapshot.checked_at && (
            <p className="text-xs">
              Source check recorded {new Date(snapshot.checked_at).toLocaleString()}
            </p>
          )}
          {snapshot.approved_at && (
            <p className="text-xs">
              Human approval recorded {new Date(snapshot.approved_at).toLocaleString()}:{" "}
              {snapshot.approval_note}
            </p>
          )}
          {Object.keys(snapshot.source_evidence).length > 0 && (
            <details>
              <summary className="cursor-pointer text-sm">Recorded source evidence</summary>
              <pre className="max-h-60 overflow-auto whitespace-pre-wrap text-xs">
                {JSON.stringify(snapshot.source_evidence, null, 2)}
              </pre>
            </details>
          )}
          {snapshot.state === "draft" && (
            <form
              key={snapshot.revision_hash}
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                try {
                  void decide(
                    "source_check",
                    parsePaperSourceEvidence(new FormData(event.currentTarget)),
                  );
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Check the evidence fields.");
                }
              }}
            >
              <label className="block text-xs">
                Full-text URL
                <Input name="full_text_url" type="url" required />
              </label>
              <label className="block text-xs">
                Source version
                <Input
                  name="source_version"
                  placeholder="arXiv v1 / dated journal version"
                  required
                />
              </label>
              <label className="block text-xs">
                Source license
                <Input name="license" required />
              </label>
              <label className="block text-xs">
                Source file SHA256
                <Input name="source_sha256" pattern="[a-f0-9]{64}" required />
              </label>
              <label className="block text-xs">
                Claim-level citations (JSON)
                <Textarea
                  name="citations"
                  rows={5}
                  placeholder={
                    '[{"url":"https://…","locator":"Section 4, Table 2","claim":"The measured result supported here…"}]'
                  }
                  required
                />
              </label>
              <label className="block text-xs">
                Source-check notes
                <Textarea name="notes" minLength={40} required />
              </label>
              <label className="block text-xs">
                AI assistance disclosure
                <Textarea name="ai_disclosure" minLength={10} required />
              </label>
              {[
                ["human_attestation", "I am the human editor recording this check."],
                [
                  "full_text_read",
                  "I read the complete paper and checked the review's claims against it.",
                ],
                [
                  "appendices_inspected",
                  "I inspected the appendices, or confirmed the source has none.",
                ],
                [
                  "figures_inspected",
                  "I inspected the figures and tables, or confirmed the source has none.",
                ],
              ].map(([name, label]) => (
                <label key={name} className="flex items-start gap-2 text-xs">
                  <input type="checkbox" name={name} required />
                  {label}
                </label>
              ))}
              <Button type="submit" disabled={busy || issues.length > 0}>
                Record source check
              </Button>
            </form>
          )}
          {snapshot.state === "source_checked" && (
            <Button disabled={busy || issues.length > 0} onClick={() => void decide("submit")}>
              Submit for editorial review
            </Button>
          )}
          {snapshot.state === "editorial_pending" && (
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                void decide("approve", {
                  human_attestation: form.get("human_approval") === "on",
                  note: String(form.get("note") ?? ""),
                });
              }}
            >
              <label className="block text-xs">
                Editorial decision rationale
                <Textarea name="note" minLength={40} required />
              </label>
              <label className="flex items-start gap-2 text-xs">
                <input type="checkbox" name="human_approval" required />I am a human editor, have
                reviewed this revision and its evidence, and approve it for publication.
              </label>
              <Button disabled={busy || issues.length > 0}>Record human approval</Button>
            </form>
          )}
          {snapshot.state === "approved" && (
            <Button disabled={busy || issues.length > 0} onClick={() => void decide("publish")}>
              Publish approved revision
            </Button>
          )}
          <form
            className="space-y-2 border-t border-border/40 pt-3"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              void decide(
                snapshot.state === "published" || snapshot.state === "legacy_published"
                  ? "withdraw"
                  : "request_changes",
                { note: String(form.get("note") ?? "") },
              );
            }}
          >
            <label className="block text-xs">
              Reason for withdrawal or requested changes
              <Input name="note" minLength={10} required />
            </label>
            <Button variant="outline" disabled={busy}>
              {snapshot.state === "published" || snapshot.state === "legacy_published"
                ? "Withdraw publication"
                : "Return to draft for changes"}
            </Button>
          </form>
        </>
      )}
    </section>
  );
}
