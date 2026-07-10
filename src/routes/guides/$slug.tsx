import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { RequireMember } from "@/components/auth/RequireAuth";
import { GuideReader } from "@/components/member/GuideReader";
import { MemberLayout } from "@/components/member/MemberLayout";
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
      <MemberLayout title="Guide not found">
        <Link to="/guides" className="text-accent-blue text-sm">
          ← Back to guides
        </Link>
      </MemberLayout>
    );
  }

  if (!user || !ready) {
    return (
      <MemberLayout>
        <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground animate-pulse">
          Loading…
        </p>
      </MemberLayout>
    );
  }

  return (
    <MemberLayout>
      <Link
        to="/guides"
        className="font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground hover:text-bone mb-6 inline-block"
      >
        ← Guides
      </Link>
      <GuideReader guide={guide} userId={user.id} initialProgress={initialProgress} />
    </MemberLayout>
  );
}
