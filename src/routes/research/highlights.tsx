import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { RequireMember } from "@/components/auth/RequireAuth";
import { CtaLink, EmptyState } from "@/components/member/ContentCard";
import { ListSkeleton } from "@/components/member/LoadingState";
import { MemberLayout } from "@/components/member/MemberLayout";
import { PageBackLink } from "@/components/member/PageBackLink";
import { SectionHeader } from "@/components/member/SectionHeader";
import { useAuth } from "@/lib/auth";
import { relativeTime } from "@/lib/date";
import { fetchAllPaperHighlights, type PaperHighlight } from "@/lib/paper-highlights";
import { paperLink } from "@/lib/app-paths";

export const Route = createFileRoute("/research/highlights")({
  component: HighlightsPage,
  head: () => ({
    meta: [{ title: "Highlight notebook — The Bu1ld" }],
  }),
});

function HighlightsPage() {
  return (
    <RequireMember>
      <HighlightsContent />
    </RequireMember>
  );
}

function HighlightsContent() {
  const { user } = useAuth();
  const [highlights, setHighlights] = useState<PaperHighlight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    void fetchAllPaperHighlights(user.id).then((h) => {
      setHighlights(h);
      setLoading(false);
    });
  }, [user]);

  return (
    <MemberLayout title="Highlight notebook" eyebrow="research">
      <PageBackLink to="/research" label="Research library" />
      <p className="text-sm text-muted-foreground mb-8 max-w-2xl -mt-4 leading-relaxed">
        Text you highlighted while reading member paper reviews — stored per paper slug with a
        timestamp. Select passage → Save selection in the reader sidebar (desktop) or Highlights
        sheet (mobile). Syncs to your account when signed in.
      </p>

      {loading ? (
        <ListSkeleton rows={4} />
      ) : highlights.length === 0 ? (
        <EmptyState
          title="No highlights yet"
          body="Open a paper review, drag to select a passage, then click Save selection. Highlights appear here with a link back to the source review."
          action={<CtaLink to="/papers">Browse papers →</CtaLink>}
        />
      ) : (
        <section>
          <SectionHeader
            title={`${highlights.length} saved passage${highlights.length === 1 ? "" : "s"}`}
            description="Each entry links to the paper review at the scroll position where you saved the passage."
          />
          <ul className="grid gap-2">
            {highlights.map((h) => (
              <li key={h.id} className="panel glass-subtle surface-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <Link
                    {...paperLink(h.paper_slug)}
                    className="label-xs text-accent-blue hover:text-bone transition-colors"
                  >
                    {h.paper_slug.replace(/-/g, " ")}
                  </Link>
                  <span className="label-xs text-muted-foreground/80">
                    {relativeTime(h.created_at)}
                  </span>
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed border-l-2 border-accent-green/40 pl-4">
                  {h.highlighted_text}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </MemberLayout>
  );
}
