import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { ContentCard, EmptyState } from "@/components/member/ContentCard";
import { MemberLayout } from "@/components/member/MemberLayout";
import { fetchNewsletters } from "@/lib/content";
import { formatDate } from "@/lib/date";
import type { NewsletterIssue } from "@/lib/types";

export const Route = createFileRoute("/newsletter/")({
  component: NewsletterPage,
});

function NewsletterPage() {
  return (
    <RequireAuth>
      <NewsletterContent />
    </RequireAuth>
  );
}

function NewsletterContent() {
  const [issues, setIssues] = useState<NewsletterIssue[]>([]);

  useEffect(() => {
    void fetchNewsletters().then(setIssues);
  }, []);

  return (
    <MemberLayout title="Newsletter" eyebrow="build digest">
      <p className="text-muted-foreground mb-8 max-w-2xl leading-relaxed -mt-4">
        Archived BUILD digests — community updates, paper picks, event reminders, and startup
        spotlights.
      </p>
      {issues.length === 0 ? (
        <EmptyState
          title="No issues yet"
          body="Newsletter digests will appear here once an issue is published."
        />
      ) : (
        <div className="grid gap-px bg-border/40 border border-border/40">
          {issues.map((issue) => (
            <ContentCard
              key={issue.id}
              to={`/newsletter/${issue.slug}`}
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
