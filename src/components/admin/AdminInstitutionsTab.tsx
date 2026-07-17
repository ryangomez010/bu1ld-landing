import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { reviewCompetitionSubmission, type CompetitionSubmission } from "@/lib/competitions";

type Props = {
  submissions: (CompetitionSubmission & { competition_title?: string })[];
  onReload: () => void;
};

export function AdminInstitutionsTab({ submissions, onReload }: Props) {
  const [busyId, setBusyId] = useState<string | null>(null);

  const review = async (id: string, status: "accepted" | "rejected") => {
    setBusyId(id);
    const { error } = await reviewCompetitionSubmission(id, status);
    setBusyId(null);
    if (error) return toast.error(error);
    toast.success(status === "accepted" ? "Submission accepted." : "Submission rejected.");
    onReload();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl text-bone">Institution operations</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Review competition entries. Labs and partnerships are seeded via{" "}
          <code className="font-mono text-[10px]">phase25.sql</code>; publish status is controlled
          in SQL or future CMS tabs.
        </p>
      </div>

      {submissions.length === 0 ? (
        <p className="rounded-sm border border-border/50 p-5 text-sm text-muted-foreground">
          No competition submissions yet. When a challenge is{" "}
          <span className="text-bone">open</span>, members submit from the competition detail page.
        </p>
      ) : (
        <ul className="space-y-3">
          {submissions.map((row) => (
            <li key={row.id} className="rounded-sm border border-border/50 bg-bone/[0.02] p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-accent-blue">
                  {row.competition_title ?? row.competition_id.slice(0, 8)}
                </span>
                <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                  {row.status}
                </span>
              </div>
              <p className="mt-2 font-display text-lg text-bone">{row.title}</p>
              <p className="mt-2 text-sm text-muted-foreground">{row.summary}</p>
              {row.evidence_url ? (
                <a
                  href={row.evidence_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-sm text-accent-blue hover:text-bone"
                >
                  Evidence →
                </a>
              ) : null}
              {row.status === "submitted" ? (
                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    disabled={busyId === row.id}
                    onClick={() => void review(row.id, "accepted")}
                    className="font-mono text-[9px] uppercase"
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyId === row.id}
                    onClick={() => void review(row.id, "rejected")}
                    className="font-mono text-[9px] uppercase"
                  >
                    Reject
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
