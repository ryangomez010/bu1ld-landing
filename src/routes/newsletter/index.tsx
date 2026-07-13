import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { RequireMember } from "@/components/auth/RequireAuth";
import { ContentCard, EmptyState } from "@/components/member/ContentCard";
import { ListSkeleton } from "@/components/member/LoadingState";
import { MemberLayout } from "@/components/member/MemberLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { newsletterLink } from "@/lib/app-paths";
import { fetchNewsletters } from "@/lib/content";
import { formatDate } from "@/lib/date";
import { isNewsletterSubscribed, setNewsletterSubscribed } from "@/lib/newsletter-subscribe";
import type { NewsletterIssue } from "@/lib/types";

export const Route = createFileRoute("/newsletter/")({
  component: NewsletterPage,
});

function NewsletterPage() {
  return (
    <RequireMember>
      <NewsletterContent />
    </RequireMember>
  );
}

function NewsletterContent() {
  const { user } = useAuth();
  const [issues, setIssues] = useState<NewsletterIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribed, setSubscribed] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetchNewsletters().then((data) => {
      setIssues(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    void isNewsletterSubscribed(user.id).then(setSubscribed);
  }, [user]);

  const toggleSubscribe = () => {
    if (!user) return;
    setSaving(true);
    const next = !subscribed;
    void setNewsletterSubscribed(user.id, next).then(() => {
      setSubscribed(next);
      setSaving(false);
      toast.success(next ? "Subscribed to The Bu1ld digest" : "Unsubscribed from digest emails");
    });
  };

  return (
    <MemberLayout title="Newsletter" eyebrow="member digest">
      <p className="text-muted-foreground mb-6 max-w-2xl leading-relaxed -mt-4">
        Archived editorial notices about published papers, confirmed programs, project openings, and
        event deadlines. Issues are an archive, not a substitute for the live source record.
      </p>
      {user ? (
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-sm border border-border/50 px-5 py-4">
          <div>
            <p className="text-sm text-bone">Email digest</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {subscribed
                ? "New issues trigger an in-app notification. Digest emails (daily/weekly) are controlled separately in Account → Preferences."
                : "Issue announcement emails are off — you will still see new issues in-app when published."}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={saving}
            onClick={toggleSubscribe}
            className="font-mono text-[9px] uppercase"
          >
            {subscribed ? "Unsubscribe" : "Subscribe"}
          </Button>
        </div>
      ) : null}
      {loading ? (
        <ListSkeleton rows={4} />
      ) : issues.length === 0 ? (
        <EmptyState
          title="No issues yet"
          body="Issues publish from the admin panel — each includes a summary, body markdown, and issue number for the archive."
        />
      ) : (
        <div className="grid gap-px bg-border/40 border border-border/40">
          {issues.map((issue) => (
            <ContentCard
              key={issue.id}
              {...newsletterLink(issue.slug)}
              tag={issue.issue_number ? `issue / ${issue.issue_number}` : "digest"}
              title={issue.title}
              summary={issue.summary}
              meta={formatDate(issue.published_at)}
            />
          ))}
        </div>
      )}
    </MemberLayout>
  );
}
