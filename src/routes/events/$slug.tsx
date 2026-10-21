import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { InstitutionLayout } from "@/components/institution/InstitutionLayout";
import { SaveToCollectionButton } from "@/components/member/SaveToCollectionButton";
import { publicEvents } from "@/lib/public-library";
import { eventState, publicHttpUrl } from "@/lib/event-state";
import { buildIcsEvent, downloadIcs } from "@/lib/calendar";
import { useAuth } from "@/lib/auth";
import { pageHead } from "@/lib/seo";
import { EventRegistration } from "@/components/events/EventRegistration";

export const Route = createFileRoute("/events/$slug")({
  loader: async ({ params }) => {
    const catalog = await publicEvents();
    const event = catalog.records.find((record) => record.slug === params.slug);
    if (catalog.state === "ready" && !event) throw notFound();
    return { catalog, event };
  },
  head: ({ loaderData, params }) =>
    pageHead({
      title: `${loaderData?.event?.title ?? "Event"} — The BU1LD`,
      description: loaderData?.event?.summary ?? "Event details and organizer information.",
      path: `/events/${params.slug}`,
      robots: loaderData?.event ? "index, follow" : "noindex, nofollow",
    }),
  component: EventDetail,
});

function EventDetail() {
  const { event, catalog } = Route.useLoaderData() as {
    event: import("@/lib/types").MlEvent | undefined;
    catalog: Awaited<ReturnType<typeof publicEvents>>;
  };
  const router = useRouter();
  const { user } = useAuth();
  if (!event)
    return (
      <InstitutionLayout title="Event information unavailable">
        <p role="status">
          {catalog.state === "unavailable" ? catalog.message : "Event not found."}
        </p>
        <button
          className="mt-4 min-h-11 border border-border px-4"
          onClick={() => void router.invalidate()}
        >
          Retry
        </button>
        <Link to="/events" className="ml-4 text-accent-blue">
          All events
        </Link>
      </InstitutionLayout>
    );
  const status = eventState(event);
  const source = publicHttpUrl(event.source_url ?? event.url);
  const start = event.starts_at ?? event.start_date;
  const end = event.ends_at ?? event.end_date;
  const calendarReady =
    !!start &&
    !!end &&
    !!event.verified_at &&
    ["upcoming", "ongoing", "completed"].includes(status);
  return (
    <InstitutionLayout
      title={event.title}
      eyebrow="Event information"
      description={event.summary ?? undefined}
    >
      <Link to="/events" className="text-accent-blue">
        ← All events
      </Link>
      <dl className="my-8 grid gap-6 border-y border-border py-6 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-muted-foreground">Listed schedule</dt>
          <dd className="mt-2">
            {start ?? "Start unconfirmed"} — {end ?? "End unconfirmed"}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Schedule state</dt>
          <dd className="mt-2">
            {status}
            {event.archived ? " · archived" : ""}
            {event.verified_at
              ? ` · verified ${event.verified_at.slice(0, 10)}`
              : " · organizer status unverified"}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Location</dt>
          <dd className="mt-2">{event.location ?? "To be confirmed"}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Timezone</dt>
          <dd className="mt-2">
            {event.timezone ??
              (start?.includes("T")
                ? "Offset shown with the source timestamp"
                : "Calendar dates only; meeting time and timezone unconfirmed")}
          </dd>
        </div>
      </dl>
      <section className="max-w-3xl">
        <h2 className="font-display text-2xl">Registration and eligibility</h2>
        <dl className="mt-5 space-y-4">
          {(
            [
              ["Organizer", event.organizer],
              ["Eligibility and prerequisites", event.eligibility],
              ["Format and access", event.format_details],
              ["Price", event.price_details],
              ["Agenda and deliverables", event.agenda],
              ["Verified capacity", event.capacity == null ? null : String(event.capacity)],
            ] as const
          ).map(([label, value]) => (
            <div key={label}>
              <dt className="text-sm text-muted-foreground">{label}</dt>
              <dd className="mt-1 whitespace-pre-wrap">{value ?? "Unconfirmed"}</dd>
            </div>
          ))}
        </dl>
        <EventRegistration event={event} />
        <p className="mt-3 leading-relaxed text-muted-foreground">
          Check the organizer’s current eligibility, deadline, fees, capacity and access
          instructions before applying. This listing does not establish an open registration or
          institutional partnership. No attendance is confirmed by clicking a link or saving this
          event.
        </p>
        {source ? (
          <a
            href={source}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex min-h-12 items-center border border-border px-5"
          >
            Visit organizer website ↗
          </a>
        ) : (
          <p className="mt-4">An organizer registration destination has not been verified.</p>
        )}
      </section>
      {event.public_materials?.length ? (
        <section className="mt-8">
          <h2 className="font-display text-2xl">Public materials</h2>
          <ul className="mt-4 space-y-3">
            {event.public_materials.map((material) =>
              publicHttpUrl(material.url) ? (
                <li key={material.url}>
                  <a
                    className="text-accent-blue underline"
                    href={material.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {material.label} ↗
                  </a>
                </li>
              ) : null,
            )}
          </ul>
        </section>
      ) : null}
      {publicHttpUrl(event.contact_url) ? (
        <a
          className="mt-5 inline-flex min-h-11 items-center text-accent-blue underline"
          href={event.contact_url!}
          target="_blank"
          rel="noopener noreferrer"
        >
          Contact the organizer ↗
        </a>
      ) : null}
      <div className="mt-8 flex flex-wrap gap-4 items-center">
        <SaveToCollectionButton itemType="event" itemSlug={event.slug} itemTitle={event.title} />
        {!user && (
          <Link to="/login" className="text-accent-blue">
            Sign in to save this event
          </Link>
        )}
        {calendarReady && (
          <button
            className="min-h-11 border border-border px-4"
            onClick={() =>
              downloadIcs(
                `${event.slug}.ics`,
                buildIcsEvent({
                  id: event.id,
                  title: event.title,
                  startDate: start!,
                  endDate: end,
                  description: event.summary ?? undefined,
                  location: event.location,
                  url: source,
                  updatedAt: event.updated_at,
                }),
              )
            }
          >
            Download listed dates (.ics)
          </button>
        )}
      </div>
      <p className="mt-6 text-sm text-muted-foreground">
        Record updated: {event.updated_at.slice(0, 10)}. This timestamp is not an organizer
        verification receipt.
      </p>
    </InstitutionLayout>
  );
}
