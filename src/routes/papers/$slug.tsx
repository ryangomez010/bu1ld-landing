import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { RequireMember } from "@/components/auth/RequireAuth";
import { PaperReader } from "@/components/member/PaperReader";
import { LoadingState } from "@/components/member/LoadingState";
import { MemberLayout } from "@/components/member/MemberLayout";
import { NotFoundResource } from "@/components/member/NotFoundResource";
import { PageBackLink } from "@/components/member/PageBackLink";
import { useAuth } from "@/lib/auth";
import { fetchPaperBySlug, fetchPapers } from "@/lib/content";
import { paperNeighbors } from "@/lib/paper-review";
import { pushRecentView } from "@/lib/recent-views";
import type { Paper } from "@/lib/types";

export const Route = createFileRoute("/papers/$slug")({
  component: PaperDetailPage,
});

function PaperDetailPage() {
  return (
    <RequireMember>
      <PaperDetail />
    </RequireMember>
  );
}

function PaperDetail() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const [paper, setPaper] = useState<Paper | null>(null);
  const [allPapers, setAllPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void Promise.all([fetchPaperBySlug(slug), fetchPapers()]).then(([p, all]) => {
      setPaper(p);
      setAllPapers(all);
      setLoading(false);
    });
  }, [slug]);

  useEffect(() => {
    if (!user || !paper) return;
    pushRecentView(user.id, {
      type: "paper",
      slug: paper.slug,
      title: paper.title,
      href: `/papers/${paper.slug}`,
    });
  }, [user, paper]);

  if (loading)
    return (
      <MemberLayout>
        <LoadingState />
      </MemberLayout>
    );
  if (!paper) {
    return (
      <MemberLayout>
        <NotFoundResource
          title="Review not found"
          body="This paper review may have moved or doesn't exist yet. Browse the library for available reviews."
          backTo="/papers"
          backLabel="Back to paper reviews"
        />
      </MemberLayout>
    );
  }

  const { prev, next } = paperNeighbors(allPapers, paper.slug);

  return (
    <MemberLayout>
      <PageBackLink to="/papers" label="Paper reviews" />
      {user ? <PaperReader paper={paper} userId={user.id} prev={prev} next={next} /> : null}
    </MemberLayout>
  );
}
