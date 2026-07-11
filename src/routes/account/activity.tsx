import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageSquarePlus, Flag } from "lucide-react";
import { useEffect, useState } from "react";

import { RequireMember } from "@/components/auth/RequireAuth";
import { EmptyState } from "@/components/member/ContentCard";
import { ListSkeleton } from "@/components/member/LoadingState";
import { MemberLayout } from "@/components/member/MemberLayout";
import { SectionHeader } from "@/components/member/SectionHeader";
import { useAuth } from "@/lib/auth";
import { contentReportHref, fetchMyReports, type ContentReport } from "@/lib/content-reports";
import { relativeTime } from "@/lib/date";
import { fetchMyFeedback, type MemberFeedback } from "@/lib/member-feedback";

export const Route = createFileRoute("/account/activity")({
  component: ActivityPage,
  head: () => ({
    meta: [{ title: "Your submissions — The Bu1ld" }],
  }),
});

function ActivityPage() {
  return (
    <RequireMember>
      <ActivityContent />
    </RequireMember>
  );
}

const STATUS_LABEL: Record<ContentReport["status"], string> = {
  pending: "Pending review",
  reviewed: "Reviewed",
  dismissed: "Dismissed",
};

function ActivityContent() {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState<MemberFeedback[]>([]);
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    void Promise.all([fetchMyFeedback(user.id), fetchMyReports(user.id)]).then(([f, r]) => {
      setFeedback(f);
      setReports(r);
      setLoading(false);
    });
  }, [user]);

  return (
    <MemberLayout title="Your submissions" eyebrow="account">
      <p className="text-sm text-muted-foreground mb-8 max-w-2xl -mt-4 leading-relaxed">
        Feedback and content flags you submitted — admins review reports asynchronously and may add
        notes visible to you when status changes from pending to reviewed or dismissed.
      </p>

      {loading ? (
        <ListSkeleton rows={4} />
      ) : (
        <div className="space-y-10 max-w-2xl">
          <section>
            <SectionHeader
              title="Feedback"
              accent="violet"
              description="Bug reports, feature ideas, and content notes submitted from anywhere in the member area."
            />
            {feedback.length === 0 ? (
              <EmptyState
                title="No feedback yet"
                body="Share bug reports, feature ideas, or content notes using the Feedback button in the header."
                icon={MessageSquarePlus}
                action={
                  <p className="text-xs text-muted-foreground">
                    Look for the <span className="text-bone">Feedback</span> button in the top bar.
                  </p>
                }
              />
            ) : (
              <ul className="grid gap-2">
                {feedback.map((f) => (
                  <li key={f.id} className="panel glass-subtle surface-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="label-xs text-accent-violet">{f.category}</span>
                      <span className="label-xs text-muted-foreground/80">
                        {relativeTime(f.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {f.body}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <SectionHeader
              title="Content reports"
              accent="blue"
              description="Flags you filed on papers, projects, events, and member profiles."
            />
            {reports.length === 0 ? (
              <EmptyState
                title="No reports filed"
                body="Use the report option on any paper, project, event, or profile if you see content that needs review."
                icon={Flag}
              />
            ) : (
              <ul className="grid gap-2">
                {reports.map((r) => (
                  <li key={r.id} className="panel glass-subtle surface-card p-4">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="label-xs text-accent-blue">{r.content_type}</span>
                      <Link
                        to={contentReportHref(r.content_type, r.content_slug)}
                        className="text-sm text-bone hover:text-accent-blue transition-colors"
                      >
                        {r.content_slug}
                      </Link>
                      <span
                        className={`label-xs ${
                          r.status === "pending"
                            ? "text-accent-red"
                            : r.status === "reviewed"
                              ? "text-accent-green"
                              : "text-muted-foreground"
                        }`}
                      >
                        {STATUS_LABEL[r.status]}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{r.reason}</p>
                    {r.admin_notes ? (
                      <p className="mt-2 text-xs text-muted-foreground border-l-2 border-border/50 pl-3 leading-relaxed">
                        Admin: {r.admin_notes}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <p className="text-xs text-muted-foreground">
            Security events and sign-in history live on{" "}
            <Link
              to="/account/security"
              className="text-accent-blue hover:text-bone transition-colors"
            >
              Account security
            </Link>
            .
          </p>
        </div>
      )}
    </MemberLayout>
  );
}
