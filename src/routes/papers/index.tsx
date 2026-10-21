import type { SearchSchemaInput } from "@tanstack/react-router";
import { createFileRoute, Link } from "@tanstack/react-router";
import { InstitutionLayout } from "@/components/institution/InstitutionLayout";
import { publicPapers, type PublicCatalog, type PublicPaper } from "@/lib/public-library";
import { pageHead } from "@/lib/seo";

type PublicPaperMetadata = Omit<PublicPaper, "review_body">;

async function loadPublicPaperMetadata(): Promise<PublicCatalog<PublicPaperMetadata>> {
  const catalog = await publicPapers();
  const records = catalog.records.map(({ review_body: _body, ...metadata }) => metadata);
  return { ...catalog, records };
}

export const Route = createFileRoute("/papers/")({
  validateSearch: (search: Record<string, unknown> & SearchSchemaInput) => ({
    q: typeof search.q === "string" ? search.q.slice(0, 120) : "",
    topic: typeof search.topic === "string" ? search.topic.slice(0, 80) : "",
    sort: search.sort === "updated" ? "updated" : "newest",
  }),
  loader: loadPublicPaperMetadata,
  head: () =>
    pageHead({
      title: "Paper reviews — The BU1LD",
      description:
        "Read critical ML paper reviews with source links, methods, evidence and limitations. Public reading needs no account.",
      path: "/papers",
    }),
  component: PapersPage,
});
function PapersPage() {
  const catalog: Awaited<ReturnType<typeof loadPublicPaperMetadata>> = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const retryHref = `/papers?${new URLSearchParams(search).toString()}`;
  const tags = [...new Set(catalog.records.flatMap((paper) => paper.tags))].sort();
  const papers = catalog.records
    .filter(
      (paper) =>
        (!search.topic || paper.tags.includes(search.topic)) &&
        [paper.title, paper.authors, paper.summary, ...paper.tags]
          .join(" ")
          .toLowerCase()
          .includes(search.q.toLowerCase()),
    )
    .sort((a, b) =>
      search.sort === "updated"
        ? b.updated_at.localeCompare(a.updated_at)
        : (b.firstReleaseAt ?? "").localeCompare(a.firstReleaseAt ?? ""),
    );
  return (
    <InstitutionLayout
      title="Read the method. Question the evidence."
      eyebrow="Papers"
      description="Critical reviews of external research, separate from BU1LD’s own publications. Reading is public; sign in only to save papers and personal notes."
    >
      <form
        key={JSON.stringify(search)}
        action="/papers"
        method="get"
        role="search"
        aria-label="Find paper reviews"
        onSubmit={(event) => {
          event.preventDefault();
          const values = new FormData(event.currentTarget);
          void navigate({
            search: {
              q: String(values.get("q") ?? ""),
              topic: String(values.get("topic") ?? ""),
              sort: String(values.get("sort") ?? "newest"),
            },
            resetScroll: false,
          });
        }}
        className="mb-8 flex flex-wrap gap-4"
      >
        <label className="min-w-0 flex-1">
          Search papers
          <input
            className="mt-2 w-full rounded-sm border border-border bg-background px-4 py-3"
            name="q"
            type="search"
            maxLength={120}
            defaultValue={search.q}
            placeholder="Title, author or topic"
          />
        </label>
        <label>
          Topic
          <select
            className="mt-2 block max-w-full rounded-sm border border-border bg-background px-4 py-3"
            name="topic"
            defaultValue={search.topic}
          >
            <option value="">All topics</option>
            {tags.map((tag) => (
              <option key={tag}>{tag}</option>
            ))}
          </select>
        </label>
        <label>
          Sort
          <select
            className="mt-2 block rounded-sm border border-border bg-background px-4 py-3"
            name="sort"
            defaultValue={search.sort}
          >
            <option value="newest">Newest papers</option>
            <option value="updated">Updated reviews</option>
          </select>
        </label>
        <div className="flex items-end gap-4">
          <button
            type="submit"
            className="min-h-12 rounded-sm border border-accent-blue px-4 text-accent-blue"
          >
            Apply filters
          </button>
          <a href="/papers" className="inline-flex min-h-12 items-center text-sm underline">
            Clear filters
          </a>
        </div>
      </form>
      {catalog.state === "unavailable" ? (
        <section role="status" className="border border-accent-blue/40 rounded-sm p-6">
          <h2 className="font-display text-2xl">Review catalog unavailable</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">{catalog.message}</p>
          <a
            href={retryHref}
            className="mt-4 inline-flex min-h-11 items-center border border-border px-4"
          >
            Retry reviews
          </a>
        </section>
      ) : (
        <>
          {catalog.state === "partial" && (
            <aside role="status" className="mb-6 border border-accent-blue/40 p-5">
              <p>{catalog.message}</p>
              <a
                href={retryHref}
                className="mt-3 inline-flex min-h-11 items-center border border-border px-4"
              >
                Retry live catalog
              </a>
            </aside>
          )}
          <p aria-live="polite" className="mb-5 text-sm text-muted-foreground">
            {papers.length} published reviews match. Newest sorts verified first-release dates;
            undated records follow. Review publication and revision dates do not make an older work
            recent.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {papers.map((paper) => (
              <Link
                key={paper.id}
                to="/papers/$slug"
                params={{ slug: paper.slug }}
                className="panel panel-interactive rounded-sm p-6"
              >
                <p className="text-xs uppercase tracking-wider text-accent-blue">
                  {paper.is_classic ? "Foundational reading" : "Paper review"}
                </p>
                <h2 className="mt-3 font-display text-2xl">{paper.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {paper.authors} · {paper.year ?? "Paper date unverified"}
                </p>
                <p className="mt-4 leading-relaxed text-muted-foreground">{paper.summary}</p>
                <p className="mt-4 text-xs text-muted-foreground">
                  Paper first release: {paper.firstReleaseAt?.slice(0, 10) ?? "not verified"} ·
                  Review published {paper.published_at.slice(0, 10)} · updated{" "}
                  {paper.updated_at.slice(0, 10)}
                </p>
              </Link>
            ))}
          </div>
          {!papers.length && (
            <p className="border border-border p-6">
              No published reviews match. Clear the filters or explore the learning library.
            </p>
          )}
        </>
      )}
      <section className="mt-12 border-t border-border pt-8">
        <h2 className="font-display text-2xl">How to read a review</h2>
        <p className="mt-3 max-w-3xl leading-relaxed text-muted-foreground">
          A source-linked review is an interpretation of a paper, not an independent reproduction.
          Look for the exact comparison, evaluation conditions, missing controls and evidence that
          might change the conclusion. Drafts awaiting editorial approval are excluded from this
          catalog.
        </p>
        <div className="mt-5 flex flex-wrap gap-5">
          <Link to="/guides" className="text-accent-blue">
            Build the prerequisites →
          </Link>
          <Link to="/publications" className="text-accent-blue">
            BU1LD publications →
          </Link>
          <Link to="/research-atlas" className="text-accent-blue">
            Research atlas →
          </Link>
        </div>
      </section>
    </InstitutionLayout>
  );
}
