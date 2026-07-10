import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { relativeTime } from "@/lib/date";
import { fetchAllReports, updateReportStatus, type ContentReport } from "@/lib/content-reports";
import { fetchAdminFeedback, type MemberFeedback } from "@/lib/member-feedback";
import { useAuth } from "@/lib/auth";

export function AdminModerationTab() {
  const { user } = useAuth();
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [feedback, setFeedback] = useState<MemberFeedback[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = () => {
    void Promise.all([fetchAllReports(), fetchAdminFeedback()]).then(([r, f]) => {
      setReports(r);
      setFeedback(f);
      setLoading(false);
    });
  };

  useEffect(() => {
    reload();
  }, []);

  const onReview = async (reportId: string, status: "reviewed" | "dismissed") => {
    if (!user) return;
    const { error } = await updateReportStatus(reportId, user.id, status);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success(status === "reviewed" ? "Marked reviewed" : "Dismissed");
    reload();
  };

  if (loading) {
    return (
      <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground animate-pulse">
        Loading moderation queue…
      </p>
    );
  }

  const pending = reports.filter((r) => r.status === "pending");

  return (
    <div className="space-y-10">
      <section>
        <h3 className="font-mono text-[10px] tracking-[0.3em] uppercase text-accent-red mb-4">
          Content reports ({pending.length} pending)
        </h3>
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending reports.</p>
        ) : (
          <div className="grid gap-px border border-border/40 bg-border/40">
            {pending.map((r) => (
              <div key={r.id} className="bg-background/75 p-4 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-accent-blue">
                    {r.content_type}
                  </span>
                  <span className="text-bone text-sm">{r.content_slug}</span>
                  <span className="font-mono text-[8px] text-muted-foreground">
                    {relativeTime(r.created_at)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{r.reason}</p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void onReview(r.id, "reviewed")}
                    className="font-mono text-[9px] tracking-[0.15em] uppercase"
                  >
                    Reviewed
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void onReview(r.id, "dismissed")}
                    className="font-mono text-[9px] tracking-[0.15em] uppercase"
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="font-mono text-[10px] tracking-[0.3em] uppercase text-accent-violet mb-4">
          Member feedback
        </h3>
        {feedback.length === 0 ? (
          <p className="text-sm text-muted-foreground">No feedback yet.</p>
        ) : (
          <div className="grid gap-px border border-border/40 bg-border/40 max-h-[400px] overflow-y-auto">
            {feedback.slice(0, 30).map((f) => (
              <div key={f.id} className="bg-background/75 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-accent-violet">
                    {f.category}
                  </span>
                  <span className="font-mono text-[8px] text-muted-foreground">
                    {relativeTime(f.created_at)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{f.body}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
