import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { RequireMember } from "@/components/auth/RequireAuth";
import { EmptyState } from "@/components/member/ContentCard";
import { ListSkeleton } from "@/components/member/LoadingState";
import { MemberLayout } from "@/components/member/MemberLayout";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { relativeTime } from "@/lib/date";
import {
  fetchMyJobApplications,
  upsertJobApplication,
  type JobApplication,
  type JobApplicationStatus,
} from "@/lib/job-applications";

export const Route = createFileRoute("/jobs/tracker")({
  component: JobTrackerPage,
  head: () => ({
    meta: [{ title: "Job tracker — The Bu1ld" }],
  }),
});

const STATUS_LABELS: Record<JobApplicationStatus, string> = {
  saved: "Saved",
  applied: "Applied",
  interviewing: "Interviewing",
  offered: "Offered",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

function JobTrackerPage() {
  return (
    <RequireMember>
      <JobTrackerContent />
    </RequireMember>
  );
}

function JobTrackerContent() {
  const { user } = useAuth();
  const [apps, setApps] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    if (!user) return;
    void fetchMyJobApplications(user.id).then((data) => {
      setApps(data);
      setLoading(false);
    });
  }, [user]);

  useEffect(() => {
    reload();
  }, [reload]);

  const onStatusChange = async (app: JobApplication, status: JobApplicationStatus) => {
    if (!user) return;
    const { error } = await upsertJobApplication(
      user.id,
      app.job_slug,
      app.job_title,
      status,
      app.notes ?? undefined,
    );
    if (error) toast.error(error);
    else reload();
  };

  const onNotesChange = async (app: JobApplication, notes: string) => {
    if (!user) return;
    await upsertJobApplication(user.id, app.job_slug, app.job_title, app.status, notes);
    reload();
  };

  return (
    <MemberLayout title="Job tracker" eyebrow="applications">
      <p className="text-sm text-muted-foreground mb-8 max-w-xl -mt-4">
        Track roles you've saved or applied to — status is private to your account.
      </p>

      {loading ? (
        <ListSkeleton rows={4} />
      ) : apps.length === 0 ? (
        <EmptyState
          title="No tracked jobs"
          body="Open a job listing and mark it as applied to start tracking."
          action={
            <Link
              to="/jobs"
              className="font-mono text-[10px] tracking-[0.22em] uppercase text-accent-blue hover:text-bone"
            >
              Browse jobs →
            </Link>
          }
        />
      ) : (
        <div className="grid gap-px border border-border/40 bg-border/40">
          {apps.map((app) => (
            <div key={app.id} className="bg-background/75 p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Link
                  to={`/jobs/${app.job_slug}`}
                  className="font-display text-xl text-bone hover:text-accent-blue transition"
                >
                  {app.job_title}
                </Link>
                <Select
                  value={app.status}
                  onValueChange={(v) => void onStatusChange(app, v as JobApplicationStatus)}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Textarea
                defaultValue={app.notes ?? ""}
                rows={2}
                placeholder="Notes (interview dates, contacts…)"
                className="text-sm"
                onBlur={(e) => void onNotesChange(app, e.target.value)}
              />
              <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground">
                Updated {relativeTime(app.updated_at)}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="font-mono text-[9px] tracking-[0.15em] uppercase"
        >
          <Link to="/jobs">Browse job board →</Link>
        </Button>
      </div>
    </MemberLayout>
  );
}
