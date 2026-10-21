import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { InstitutionLayout } from "@/components/institution/InstitutionLayout";
import { PaperReader } from "@/components/member/PaperReader";
import { PaperReviewBody } from "@/components/member/PaperReviewMarkdown";
import { PaperLearningLinks } from "@/components/member/PaperLearningLinks";
import { publicPaperBySlug } from "@/lib/public-library";
import { publicHttpUrl } from "@/lib/event-state";
import { useAuth } from "@/lib/auth";
import { parseReviewSections } from "@/lib/paper-review";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/papers/$slug")({
  loader: async ({ params }) => {
    const catalog = await publicPaperBySlug(params.slug);
    const paper = catalog.records.find((record) => record.slug === params.slug);
    if (catalog.state === "ready" && !paper) throw notFound();
    return { state: catalog.state, paper };
  },
  component: PaperDetail,
  head: ({ loaderData, params }) =>
    pageHead({
      title: `${loaderData?.paper?.title ?? "Paper review"} — The BU1LD`,
      description: loaderData?.paper?.summary ?? "Source-linked ML research review.",
      path: `/papers/${params.slug}`,
      type: "article",
      robots: loaderData?.paper ? "index, follow" : "noindex, nofollow",
    }),
});
function PaperDetail() {
  const { paper } = Route.useLoaderData();
  const { user } = useAuth();
  const router = useRouter();
  if (!paper)
    return (
      <InstitutionLayout title="Review unavailable">
        <p role="status">
          The review catalog could not be reached. Its publication state cannot be confirmed.
        </p>
        <button
          className="mt-4 min-h-11 border border-border px-4"
          onClick={() => void router.invalidate()}
        >
          Retry
        </button>
        <Link to="/papers" className="ml-4 text-accent-blue">
          All reviews
        </Link>
      </InstitutionLayout>
    );
  const source = publicHttpUrl(paper.source_url ?? paper.arxiv_url);
  return (
    <InstitutionLayout
      title={paper.title}
      eyebrow="External paper review"
      description={paper.summary ?? undefined}
    >
      <Link to="/papers" className="text-accent-blue">
        ← Paper library
      </Link>
      <p className="mt-4 text-sm text-muted-foreground">
        Original paper: {paper.authors ?? "Authors not supplied"} ·{" "}
        {paper.year ?? "Year unverified"}
        {paper.venue ? ` · ${paper.venue}` : ""}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        Paper first release: {paper.firstReleaseAt?.slice(0, 10) ?? "unverified"}. Version reviewed:{" "}
        {paper.versionReviewed ?? "unverified"}. Review published {paper.published_at.slice(0, 10)}.
        Source reading does not establish independent reproduction or peer review.
      </p>
      {source && (
        <a
          href={source}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex min-h-11 items-center border border-border px-4"
        >
          Read original paper ↗
        </a>
      )}
      {user ? (
        <PaperReader embeddedHeading paper={paper} userId={user.id} prev={null} next={null} />
      ) : (
        <>
          <article className="mt-10 max-w-[72ch] text-base leading-[1.85] sm:text-lg">
            <PaperReviewBody sections={parseReviewSections(paper.review_body)} />
          </article>
          <PaperLearningLinks slugs={paper.relatedLessons} />
          <p className="mt-8 border-t border-border pt-6 text-sm text-muted-foreground">
            <Link
              to="/login"
              search={{ redirect: `/papers/${paper.slug}` }}
              className="text-accent-blue"
            >
              Sign in
            </Link>{" "}
            to save this paper and keep private notes. Reading never requires an account.
          </p>
        </>
      )}
      <nav
        aria-label="Related reading"
        className="mt-10 flex flex-wrap gap-5 border-t border-border pt-6"
      >
        <Link to="/guides" className="text-accent-blue">
          Learning library →
        </Link>
        <Link to="/research-atlas" className="text-accent-blue">
          Related research directions →
        </Link>
      </nav>
    </InstitutionLayout>
  );
}
