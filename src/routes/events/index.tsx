import type { SearchSchemaInput } from "@tanstack/react-router";
import { createFileRoute, Link } from "@tanstack/react-router";
import { InstitutionLayout } from "@/components/institution/InstitutionLayout";
import { publicEvents } from "@/lib/public-library";
import { eventState } from "@/lib/event-state";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/events/")({
  validateSearch: (search: Record<string, unknown> & SearchSchemaInput) => ({
    q: typeof search.q === "string" ? search.q.slice(0, 120) : "",
    state: [
      "all",
      "upcoming",
      "ongoing",
      "completed",
      "cancelled",
      "postponed",
      "unconfirmed",
    ].includes(String(search.state))
      ? String(search.state)
      : "all",
  }),
  loader: () => publicEvents(),
  component: EventsPage,
  head: () =>
    pageHead({
      title: "Events — The BU1LD",
      description:
        "Explore public events, dates, preparation and organizer registration information.",
      path: "/events",
    }),
});

function EventsPage() {
  const catalog: Awaited<ReturnType<typeof publicEvents>> = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const retryHref = `/events?${new URLSearchParams(search).toString()}`;
  const visible = catalog.records.filter(
    (event) =>
      (search.state === "all" || eventState(event) === search.state) &&
      [event.title, event.summary, ...event.topics]
        .join(" ")
        .toLowerCase()
        .includes(search.q.toLowerCase()),
  );
  return (
    <InstitutionLayout
      title="Meet around a useful question."
      eyebrow="Events & reading groups"
      description="Find scheduled events and useful archives. Organizer confirmation is required for registration; saving an event does not reserve a place."
    >
      <form
        key={JSON.stringify(search)}
        action="/events"
        method="get"
        role="search"
        aria-label="Find events"
        onSubmit={(event) => {
          event.preventDefault();
          const values = new FormData(event.currentTarget);
          void navigate({
            search: {
              q: String(values.get("q") ?? ""),
              state: String(values.get("state") ?? "all"),
            },
            resetScroll: false,
          });
        }}
        className="mb-8 flex flex-wrap gap-3"
      >
        <label className="flex-1 min-w-0">
          Search events
          <input
            className="mt-2 w-full rounded-sm border border-border bg-background px-4 py-3"
            name="q"
            type="search"
            maxLength={120}
            defaultValue={search.q}
            placeholder="Topic or event title"
          />
        </label>
        <label>
          Schedule
          <select
            className="mt-2 block rounded-sm border border-border bg-background px-4 py-3"
            name="state"
            defaultValue={search.state}
          >
            {[
              "all",
              "upcoming",
              "ongoing",
              "completed",
              "cancelled",
              "postponed",
              "unconfirmed",
            ].map((state) => (
              <option key={state} value={state}>
                {state === "unconfirmed" ? "Dates unconfirmed" : state}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end gap-4">
          <button
            type="submit"
            className="min-h-12 rounded-sm border border-accent-blue px-4 text-accent-blue"
          >
            Apply filters
          </button>
          <a href="/events" className="inline-flex min-h-12 items-center text-sm underline">
            Clear filters
          </a>
        </div>
      </form>
      {catalog.state === "unavailable" ? (
        <div role="status" className="rounded-sm border border-accent-blue/40 p-6">
          <h2 className="font-display text-2xl">Calendar temporarily unavailable</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">{catalog.message}</p>
          <a
            href={retryHref}
            className="mt-4 inline-flex min-h-11 items-center rounded-sm border border-border px-4"
          >
            Retry calendar
          </a>
        </div>
      ) : (
        <>
          <p aria-live="polite" className="mb-5 text-sm text-muted-foreground">
            {visible.length} matching published records · dates describe the listed schedule;
            operational status requires organizer verification.
          </p>
          {visible.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {visible.map((event) => (
                <Link
                  key={event.id}
                  to="/events/$slug"
                  params={{ slug: event.slug }}
                  className="panel panel-interactive rounded-sm p-6"
                >
                  <p className="text-xs uppercase tracking-widest text-accent-blue">
                    {eventState(event)}
                  </p>
                  <h2 className="mt-3 font-display text-2xl">{event.title}</h2>
                  <p className="mt-3 text-muted-foreground leading-relaxed">{event.summary}</p>
                  <p className="mt-4 text-sm">
                    {(event.starts_at ?? event.start_date)
                      ? (event.starts_at ?? event.start_date)!.slice(0, 10)
                      : "Dates to be confirmed"}{" "}
                    · {event.location ?? "Location unconfirmed"}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="rounded-sm border border-border p-6">
              {catalog.records.length
                ? "No matches. Try All or another topic."
                : "No published events were returned by the calendar. Explore the participation paths while new dates are confirmed."}
            </p>
          )}
        </>
      )}
      <section className="mt-12 border-t border-border pt-8">
        <h2 className="font-display text-2xl">Prepare before dates are announced</h2>
        <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
          Research lanes and program descriptions are available year-round. They do not establish an
          upcoming event, an open cohort, or a reserved place.
        </p>
        <div className="mt-5 flex flex-wrap gap-5">
          <Link to="/guides" className="text-accent-blue">
            Learning library →
          </Link>
          <Link to="/programs-public" className="text-accent-blue">
            Program descriptions →
          </Link>
          <Link to="/apply" className="text-accent-blue">
            How participation works →
          </Link>
        </div>
      </section>
    </InstitutionLayout>
  );
}
