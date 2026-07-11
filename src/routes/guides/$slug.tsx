import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { RequireMember } from "@/components/auth/RequireAuth";
import { GuideReader } from "@/components/member/GuideReader";
import { LoadingState } from "@/components/member/LoadingState";
import { MemberLayout } from "@/components/member/MemberLayout";
import { NotFoundResource } from "@/components/member/NotFoundResource";
import { PageBackLink } from "@/components/member/PageBackLink";
import { ReportContentButton } from "@/components/member/ReportContentButton";
import { SaveToCollectionButton } from "@/components/member/SaveToCollectionButton";
import { ShareButton } from "@/components/member/ShareButton";
import { getGuide } from "@/content/guides";
import { useAuth } from "@/lib/auth";
import { getReadingProgress } from "@/lib/reading-progress";

export const Route = createFileRoute("/guides/$slug")({
  component: GuideDetailPage,
});

function GuideDetailPage() {
  return (
    <RequireMember>
      <GuideDetail />
    </RequireMember>
  );
}

function GuideDetail() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const guide = getGuide(slug);
  const [initialProgress, setInitialProgress] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!user) return;
    void getReadingProgress(user.id, slug).then((p) => {
      setInitialProgress(p);
      setReady(true);
    });
  }, [user, slug]);

  if (!guide) {
    return (
      <MemberLayout>
        <NotFoundResource
          title="Guide not found"
          body="This guide slug is not published — check Guides for the six available reference essays."
          backTo="/guides"
          backLabel="Back to guides"
        />
      </MemberLayout>
    );
  }

  if (!user || !ready) {
    return (
      <MemberLayout>
        <LoadingState />
      </MemberLayout>
    );
  }

  return (
    <MemberLayout>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <PageBackLink to="/guides" label="Guides" />
        <div className="flex flex-wrap items-center gap-2">
          <SaveToCollectionButton itemType="guide" itemSlug={guide.slug} itemTitle={guide.title} />
          <ShareButton title={guide.title} />
          <ReportContentButton contentType="guide" contentSlug={guide.slug} />
        </div>
      </div>
      <GuideReader guide={guide} userId={user.id} initialProgress={initialProgress} />
    </MemberLayout>
  );
}
