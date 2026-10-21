import { pageHead } from "@/lib/seo";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { GuideLayout } from "./-layout";
import { GuideReader } from "@/components/member/GuideReader";

import { NotFoundResource } from "@/components/member/NotFoundResource";
import { PageBackLink } from "@/components/member/PageBackLink";
import { ReportContentButton } from "@/components/member/ReportContentButton";
import { SaveToCollectionButton } from "@/components/member/SaveToCollectionButton";
import { ShareButton } from "@/components/member/ShareButton";

import { getAllGuides, getGuide, getGuideSummary } from "@/content/guides";
import { useAuth } from "@/lib/auth";
import { ANONYMOUS_READER, loadPublicGuideProgress } from "@/lib/guide-catalog-progress";
import { parseGuideSearch, type GuideSearch } from "@/lib/guide-catalog";
import type { ProgressSource } from "@/lib/reading-progress-store";
import type { Guide } from "@/lib/types";

export const Route = createFileRoute("/guides/$slug")({
  component: GuideDetailPage,
  loader: async ({ params }) => {
    const guide = await getGuide(params.slug);
    if (!guide) throw notFound();
    return { guide };
  },
  notFoundComponent: () => (
    <GuideLayout>
      <NotFoundResource
        title="Guide not found"
        body="This lesson is not in the public library."
        backTo="/guides"
        backLabel="Back to guides"
      />
    </GuideLayout>
  ),
  validateSearch: (search: Record<string, unknown>) => parseGuideSearch(search, getAllGuides()),
  head: ({ params }) => {
    const summary = getGuideSummary(params.slug);
    return pageHead({
      title: `${summary?.title ?? "Guide not found"} — The BU1LD`,
      description: summary?.description ?? "This lesson is not in the public library.",
      path: `/guides/${params.slug}`,
      type: "article",
      robots: summary ? "index, follow" : "noindex, nofollow",
    });
  },
});

function GuideDetailPage() {
  const { slug } = Route.useParams();
  const { guide } = Route.useLoaderData();
  const librarySearch = Route.useSearch();
  const { user } = useAuth();
  const userId = user?.id ?? ANONYMOUS_READER;
  return (
    <LoadedGuide
      key={`${userId}:${slug}`}
      slug={slug}
      guide={guide}
      userId={userId}
      librarySearch={librarySearch}
    />
  );
}

function LoadedGuide({
  slug,
  guide,
  userId,
  librarySearch,
}: {
  slug: string;
  guide: Guide | undefined;
  userId: string;
  librarySearch: GuideSearch;
}) {
  const summary = getGuideSummary(slug);
  const [initialProgress, setInitialProgress] = useState(0);
  const [initialSource, setInitialSource] = useState<ProgressSource | "loading">("loading");
  const [progressUnavailable, setProgressUnavailable] = useState(false);

  useEffect(() => {
    if (!summary) return;
    let active = true;
    setProgressUnavailable(false);
    // Reading content must not wait for the account's progress request.
    void loadPublicGuideProgress(userId, slug)
      .then((snapshot) => {
        if (!active) return;
        setInitialProgress(snapshot.values[slug] ?? 0);
        setInitialSource(snapshot.source);
      })
      .catch(() => {
        if (!active) return;
        setProgressUnavailable(true);
        setInitialSource("unavailable");
      });
    return () => {
      active = false;
    };
  }, [userId, slug, summary]);

  if (!summary || !guide) {
    return (
      <GuideLayout>
        <NotFoundResource
          title="Guide not found"
          body="This article is not in the library. Browse Guides to find an available article or reference essay."
          backTo="/guides"
          backLabel="Back to guides"
        />
      </GuideLayout>
    );
  }

  return (
    <GuideLayout>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <PageBackLink to="/guides" label="Guides" search={librarySearch} />
        <div className="flex flex-wrap items-center gap-2">
          <SaveToCollectionButton itemType="guide" itemSlug={guide.slug} itemTitle={guide.title} />
          <ShareButton title={guide.title} />
          <ReportContentButton contentType="guide" contentSlug={guide.slug} />
        </div>
      </div>
      {progressUnavailable ? (
        <p role="status" className="mb-4 text-sm text-muted-foreground">
          Your previous reading progress could not be loaded.
        </p>
      ) : null}
      <GuideReader
        guide={guide}
        userId={userId}
        initialProgress={initialProgress}
        initialSource={initialSource}
        librarySearch={librarySearch}
      />
    </GuideLayout>
  );
}
