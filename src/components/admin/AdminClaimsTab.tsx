import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createInstitutionalClaim,
  deleteInstitutionalClaim,
  reviewInstitutionalClaim,
} from "@/lib/institutional-claims";
import { isSafeUrl } from "@/lib/urls";
import type { InstitutionalClaim, InstitutionalClaimType } from "@/lib/types";

const CLAIM_TYPES: InstitutionalClaimType[] = [
  "affiliation",
  "publication",
  "project_outcome",
  "member_stat",
  "program_outcome",
  "other",
];

export function AdminClaimsTab({
  claims,
  actorId,
  onSaved,
}: {
  claims: InstitutionalClaim[];
  actorId: string;
  onSaved: () => void;
}) {
  const [claimType, setClaimType] = useState<InstitutionalClaimType>("project_outcome");
  const [statement, setStatement] = useState("");
  const [context, setContext] = useState("");
  const [evidenceLabel, setEvidenceLabel] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const { error } = await createInstitutionalClaim(actorId, {
      claimType,
      statement,
      context,
      evidenceLabel,
      evidenceUrl,
      validUntil,
    });
    setSaving(false);
    if (error) return toast.error(error);
    setStatement("");
    setContext("");
    setEvidenceLabel("");
    setEvidenceUrl("");
    setValidUntil("");
    toast.success("Claim saved as a private draft.");
    onSaved();
  };

  return (
    <div className="grid gap-10 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
      <form onSubmit={submit} className="h-fit space-y-4 rounded-sm border border-border/60 p-6">
        <div>
          <h2 className="font-display text-xl text-bone">Register a claim</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Record the exact statement and its primary source. Saving never publishes; a separate
            verification decision is required.
          </p>
        </div>
        <div className="space-y-2">
          <Label>Claim type</Label>
          <Select
            value={claimType}
            onValueChange={(value) => setClaimType(value as InstitutionalClaimType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CLAIM_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type.replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="claim-statement">Exact public statement</Label>
          <Textarea
            id="claim-statement"
            rows={4}
            value={statement}
            onChange={(event) => setStatement(event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="claim-context">Qualification and context</Label>
          <Textarea
            id="claim-context"
            rows={4}
            value={context}
            onChange={(event) => setContext(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="claim-source-label">Primary source label</Label>
          <Input
            id="claim-source-label"
            value={evidenceLabel}
            onChange={(event) => setEvidenceLabel(event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="claim-source-url">Primary source URL</Label>
          <Input
            id="claim-source-url"
            type="url"
            value={evidenceUrl}
            onChange={(event) => setEvidenceUrl(event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="claim-valid-until">Review again by (optional)</Label>
          <Input
            id="claim-valid-until"
            type="date"
            value={validUntil}
            onChange={(event) => setValidUntil(event.target.value)}
          />
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save private draft"}
        </Button>
      </form>

      <section>
        <div className="mb-5">
          <h2 className="font-display text-xl text-bone">Evidence register</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Only verified, unexpired records appear on the public transparency page.
          </p>
        </div>
        <div className="space-y-3">
          {claims.map((claim) => (
            <article key={claim.id} className="rounded-sm border border-border/60 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent-green">
                  {claim.claim_type.replace("_", " ")} · {claim.status}
                </p>
                {claim.valid_until ? (
                  <p className="font-mono text-[8px] uppercase text-muted-foreground">
                    Review by {new Date(`${claim.valid_until}T00:00:00`).toLocaleDateString()}
                  </p>
                ) : null}
              </div>
              <h3 className="mt-3 text-base leading-relaxed text-bone">{claim.statement}</h3>
              {claim.context ? (
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {claim.context}
                </p>
              ) : null}
              <a
                href={claim.evidence_url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-sm text-accent-blue hover:text-bone"
              >
                {claim.evidence_label}
                <ExternalLink className="h-3 w-3" />
              </a>
              <div className="mt-4 flex flex-wrap gap-2">
                {claim.status !== "verified" ? (
                  <Button
                    size="sm"
                    disabled={!claim.evidence_url || !isSafeUrl(claim.evidence_url)}
                    title={
                      !claim.evidence_url ? "Add a primary source URL before verifying" : undefined
                    }
                    onClick={() =>
                      void reviewInstitutionalClaim(claim.id, "verified", claim).then(
                        ({ error }) => {
                          if (error) toast.error(error);
                          else {
                            toast.success("Claim verified and published.");
                            onSaved();
                          }
                        },
                      )
                    }
                  >
                    Verify and publish
                  </Button>
                ) : null}
                {claim.status !== "retired" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      void reviewInstitutionalClaim(claim.id, "retired").then(({ error }) => {
                        if (error) toast.error(error);
                        else {
                          toast.success("Claim retired.");
                          onSaved();
                        }
                      })
                    }
                  >
                    Retire
                  </Button>
                ) : null}
                {claim.status === "draft" ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-accent-red"
                    onClick={() =>
                      void deleteInstitutionalClaim(claim.id).then(({ error }) => {
                        if (error) toast.error(error);
                        else {
                          toast.success("Draft deleted.");
                          onSaved();
                        }
                      })
                    }
                  >
                    Delete draft
                  </Button>
                ) : null}
              </div>
            </article>
          ))}
          {claims.length === 0 ? (
            <p className="text-sm text-muted-foreground">No claims have been registered.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
