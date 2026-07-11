import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/member/ContentCard";
import { ListSkeleton } from "@/components/member/LoadingState";
import { SectionHeader } from "@/components/member/SectionHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { relativeTime } from "@/lib/date";
import {
  contentReportHref,
  fetchAllReports,
  updateReportStatus,
  type ContentReport,
} from "@/lib/content-reports";
import { fetchAdminFeedback, type MemberFeedback } from "@/lib/member-feedback";
import { useAuth } from "@/lib/auth";

export function AdminModerationTab() {
  const { user } = useAuth();
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [feedback, setFeedback] = useState<MemberFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});

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
    const { error } = await updateReportStatus(reportId, user.id, status, notes[reportId]);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success(status === "reviewed" ? "Marked reviewed" : "Dismissed");
    reload();
  };

  if (loading) {
    return <ListSkeleton rows={4} />;
  }

  const pending = reports.filter((r) => r.status === "pending");

  return (
    <div className="space-y-10">
      <section>
        <SectionHeader title={`Content reports (${pending.length} pending)`} accent="red" />
        {pending.length === 0 ? (
          <EmptyState
            title="Queue clear"
            body="No pending content reports — new flags from members will appear here."
          />
        ) : (
          <div className="grid gap-px border border-border/40 bg-border/40 surface-card overflow-hidden">
            {pending.map((r) => (
              <div key={r.id} className="bg-background/75 p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="label-xs text-accent-blue">{r.content_type}</span>
                  <Link
                    to={contentReportHref(r.content_type, r.content_slug)}
                    className="text-bone text-sm hover:text-accent-blue transition-colors"
                  >
                    {r.content_slug}
                  </Link>
                  <span className="label-xs text-muted-foreground/80">
                    {relativeTime(r.created_at)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{r.reason}</p>
                <Textarea
                  value={notes[r.id] ?? ""}
                  onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))}
                  rows={2}
                  placeholder="Admin notes (optional, visible to reporter when reviewed)"
                  className="text-sm resize-none"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void onReview(r.id, "reviewed")}
                    className="label-xs"
                  >
                    Reviewed
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void onReview(r.id, "dismissed")}
                    className="label-xs"
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
        <SectionHeader title="Member feedback" accent="violet" />
        {feedback.length === 0 ? (
          <EmptyState
            title="No feedback yet"
            body="Member bug reports, feature ideas, and content notes will appear here."
          />
        ) : (
          <div className="grid gap-px border border-border/40 bg-border/40 max-h-[400px] overflow-y-auto surface-card">
            {feedback.slice(0, 30).map((f) => (
              <div key={f.id} className="bg-background/75 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="label-xs text-accent-violet">{f.category}</span>
                  <span className="label-xs text-muted-foreground/80">
                    {relativeTime(f.created_at)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
