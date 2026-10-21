import { Link } from "@tanstack/react-router";
import { BookOpen, CalendarDays, Library, ArrowUpRight } from "lucide-react";
import { getAllGuides } from "@/content/guides";
import { getResearchAtlasCounts } from "@/data/research-portfolio";
import type { PublicCatalog } from "@/lib/public-library";
import type { HomeEvent, HomePaper } from "@/lib/home-library";

export function LibraryEntrySection({
  papers,
  events,
}: {
  papers: PublicCatalog<HomePaper>;
  events: PublicCatalog<HomeEvent>;
}) {
  const lessons = getAllGuides();
  const research = getResearchAtlasCounts();
  const reviews = papers.records;
  return (
    <section
      id="library"
      className="border-t border-border/60 bg-background/75 py-20 md:py-28"
      aria-labelledby="library-heading"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent-green">
          Read · investigate · participate
        </p>
        <h2
          id="library-heading"
          className="mt-6 max-w-3xl font-display text-4xl tracking-tight md:text-6xl"
        >
          A useful next step,
          <br />
          wherever you begin.
        </h2>
        <p className="mt-5 max-w-2xl leading-relaxed text-muted-foreground">
          Explore {research.projects} canonical projects across {research.records} public research
          pages, including subprojects, collections and unresolved directions. Build your
          understanding with {lessons.length} learning articles and reference essays. All are
          readable without an account.
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            {
              to: "/guides",
              title: "Learn by working it through.",
              body: "Follow a path, inspect a worked example, and test your understanding with an exercise.",
              Icon: BookOpen,
              label: "Explore learning",
            },
            {
              to: "/papers",
              title: "Read with a critical eye.",
              body: "Examine the method, its comparisons and what remains uncertain. External reviews are distinct from BU1LD publications.",
              Icon: Library,
              label: "Browse paper reviews",
            },
            {
              to: "/events",
              title: "Find a shared question.",
              body: "Check the published calendar and organizer’s registration details. Explore preparation paths while dates are confirmed.",
              Icon: CalendarDays,
              label: "Explore events",
            },
          ].map(({ to, title, body, Icon, label }) => (
            <Link
              key={to}
              to={to}
              className="group rounded-sm border border-border/60 p-6 transition hover:border-accent-blue/50"
            >
              <Icon aria-hidden="true" className="h-6 w-6 text-accent-blue" />
              <h3 className="mt-6 font-display text-2xl">{title}</h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">{body}</p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm text-accent-blue">
                {label}
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
        <div className="mt-12 grid gap-10 md:grid-cols-2">
          <section>
            <h3 className="font-display text-2xl">Latest published reviews</h3>
            {papers.state !== "ready" && (
              <p role="status" className="mt-4 text-sm text-muted-foreground">
                {papers.message}
              </p>
            )}
            {papers.state === "ready" && !reviews.length && (
              <p className="mt-4 text-muted-foreground">
                No reviews are published in the current catalog. Explore the learning library while
                reviews await publication.
              </p>
            )}
            <ul className="mt-5 divide-y divide-border">
              {reviews.map((review) => (
                <li key={review.id}>
                  <Link to="/papers/$slug" params={{ slug: review.slug }} className="block py-5">
                    <span className="text-xs text-muted-foreground">
                      {Number.isFinite(Date.parse(review.published_at))
                        ? `Review published ${review.published_at.slice(0, 10)}`
                        : "Publication date unavailable"}
                    </span>
                    <p className="mt-2 text-xl">{review.title}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h3 className="font-display text-2xl">Confirmed upcoming events</h3>
            {events.state !== "ready" && (
              <p role="status" className="mt-4 text-sm text-muted-foreground">
                {events.message}
              </p>
            )}
            {events.state === "ready" && !events.records.length && (
              <p className="mt-4 text-muted-foreground">
                No upcoming events with confirmed times are listed. The calendar also includes
                archives and schedules awaiting confirmation.
              </p>
            )}
            <ul className="mt-5 divide-y divide-border">
              {events.records.map((event) => (
                <li key={event.id}>
                  <Link to="/events/$slug" params={{ slug: event.slug }} className="block py-5">
                    <span className="text-xs text-muted-foreground">{event.when}</span>
                    <p className="mt-2 text-xl">{event.title}</p>
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              to="/events"
              className="mt-4 inline-flex min-h-11 items-center text-sm text-accent-blue"
            >
              Browse the full calendar →
            </Link>
          </section>
        </div>
        <p className="mt-8 text-sm text-muted-foreground">
          <Link to="/forms" className="text-accent-blue">
            Explore participation paths →
          </Link>{" "}
          Read the requirements and current status before applying. An application is a request for
          review, not a confirmed placement.
        </p>
      </div>
    </section>
  );
}
