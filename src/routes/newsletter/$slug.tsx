import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { RequireMember } from "@/components/auth/RequireAuth";
import { MarkdownBody } from "@/components/member/ContentCard";
import { MemberLayout } from "@/components/member/MemberLayout";
import { ReportContentButton } from "@/components/member/ReportContentButton";
import { SaveToCollectionButton } from "@/components/member/SaveToCollectionButton";
import { fetchNewsletterBySlug, fetchNewsletters } from "@/lib/content";
import { formatDate } from "@/lib/date";
import type { NewsletterIssue } from "@/lib/types";

export const Route = createFileRoute("/newsletter/$slug")({
  component: NewsletterDetailPage,
});

function NewsletterDetailPage() {
  return (
    <RequireMember>
      <NewsletterDetail />
    </RequireMember>
  );
}

function NewsletterDetail() {
  const { slug } = Route.useParams();
  const [issue, setIssue] = useState<NewsletterIssue | null>(null);
  const [siblings, setSiblings] = useState<NewsletterIssue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void Promise.all([fetchNewsletterBySlug(slug), fetchNewsletters()]).then(([n, all]) => {
      setIssue(n);
      setSiblings(all);
      setLoading(false);
    });
  }, [slug]);

  if (loading) {
    return (
      <MemberLayout>
        <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground animate-pulse">
          Loading…
        </p>
      </MemberLayout>
    );
  }

  if (!issue) {
    return (
      <MemberLayout title="Issue not found">
        <p className="text-muted-foreground mb-4 max-w-xl leading-relaxed">
          This digest issue may have been removed or the URL is outdated. Browse past issues on the
          newsletter archive.
        </p>
        <Link to="/newsletter" className="text-accent-blue text-sm">
          ← Back to newsletter
        </Link>
      </MemberLayout>
    );
  }

  const idx = siblings.findIndex((n) => n.slug === issue.slug);
  const prev = idx > 0 ? siblings[idx - 1] : null;
  const next = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;

  return (
    <MemberLayout>
      <Link
        to="/newsletter"
        className="font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground hover:text-bone"
      >
        ← Newsletter
      </Link>
      <article className="mt-6 max-w-2xl">
        <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
          {formatDate(issue.published_at)}
          {issue.issue_number ? ` · issue ${issue.issue_number}` : ""}
        </p>
        <h1 className="font-display text-4xl text-bone mt-3 tracking-tight">{issue.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <SaveToCollectionButton
            itemType="newsletter"
            itemSlug={issue.slug}
            itemTitle={issue.title}
          />
          <ReportContentButton contentType="newsletter" contentSlug={issue.slug} />
        </div>
        {issue.summary ? (
          <p className="mt-4 text-lg text-muted-foreground">{issue.summary}</p>
        ) : null}
        <div className="divider-grad my-8" />
        <MarkdownBody body={issue.body} />
        <div className="mt-12 flex flex-wrap justify-between gap-4 border-t border-border/60 pt-6">
          {prev ? (
            <Link
              to={`/newsletter/${prev.slug}`}
              className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground hover:text-bone"
            >
              ← {prev.title}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              to={`/newsletter/${next.slug}`}
              className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground hover:text-bone"
            >
              {next.title} →
            </Link>
          ) : null}
        </div>
      </article>
    </MemberLayout>
  );
}
