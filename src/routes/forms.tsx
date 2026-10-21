import { createFileRoute, Link } from "@tanstack/react-router";
import type { SearchSchemaInput } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { InstitutionLayout } from "@/components/institution/InstitutionLayout";
import {
  filterOpportunities,
  INTEREST_STORAGE_KEY,
  OPPORTUNITIES,
  OPPORTUNITY_OPTIONS,
  OPPORTUNITY_TOPICS,
  opportunityStatus,
  parseOpportunitySearch,
  readSavedInterests,
  saveInterests,
  type Opportunity,
} from "@/lib/opportunity-directory";
import { pageHead } from "@/lib/seo";
import { trackEvent } from "@/lib/analytics";
import { createOpportunityDetailAnalytics } from "@/lib/learning-analytics";

export const Route = createFileRoute("/forms")({
  validateSearch: (search: Record<string, unknown> & SearchSchemaInput) =>
    parseOpportunitySearch(search),
  loader: () => ({ now: Date.now() }),
  head: () =>
    pageHead({
      title: "Participate — The BU1LD",
      description:
        "Find research interests and program formats, check requirements, and choose the correct participation route.",
      path: "/forms",
    }),
  component: ParticipationPage,
});

const filterLabels = {
  type: "Type",
  experience: "Experience focus",
  location: "Location",
  commitment: "Format commitment",
  deadline: "Deadline",
  status: "Status",
  sort: "Sort by",
  saved: "Saved interests",
};

function ParticipationPage() {
  const search = Route.useSearch();
  const { now } = Route.useLoaderData();
  const navigate = Route.useNavigate();
  const [saved, setSaved] = useState<string[]>([]);
  const [storageState, setStorageState] = useState<"pending" | "available" | "unavailable">(
    "pending",
  );
  const [saveNotice, setSaveNotice] = useState("");

  useEffect(() => {
    function load() {
      try {
        const result = readSavedInterests(window.localStorage);
        setSaved(result.ids);
        setStorageState(result.available ? "available" : "unavailable");
      } catch {
        setStorageState("unavailable");
      }
    }
    load();
    const onStorage = (event: StorageEvent) => {
      if (event.key === INTEREST_STORAGE_KEY || event.key === null) load();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const visible = filterOpportunities(OPPORTUNITIES, search, {
    now,
    savedIds: storageState === "available" ? saved : undefined,
  });
  const savedFilterUnavailable = search.saved === "saved" && storageState !== "available";

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    void navigate({ search: parseOpportunitySearch(values), resetScroll: false });
  }

  function toggleInterest(item: Opportunity) {
    const next = saved.includes(item.id)
      ? saved.filter((id) => id !== item.id)
      : [...saved, item.id];
    let success = false;
    try {
      success = saveInterests(window.localStorage, next);
    } catch {
      /* Browser privacy settings may deny access to storage itself. */
    }
    if (success) {
      setSaved(next);
      setSaveNotice(
        `${item.name}: ${next.includes(item.id) ? "saved on this device" : "removed from saved interests"}.`,
      );
    } else {
      setStorageState("unavailable");
      setSaveNotice(
        "Could not save this change. Browser storage is unavailable; nothing was submitted.",
      );
    }
  }

  return (
    <InstitutionLayout
      title="Choose a question worth your time."
      eyebrow="Participate"
      description="Explore research lanes, project briefs and program formats. Dates, reviewer capacity and a named owner must be confirmed before an interest becomes an active role."
    >
      <p className="mb-5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        These BU1LD entries are interests and preparation routes. No placement is confirmed open.
        Experience and commitment filters describe the published format; they do not establish
        current eligibility or availability.
      </p>
      <form
        key={JSON.stringify(search)}
        action="/forms"
        method="get"
        onSubmit={applyFilters}
        role="search"
        aria-label="Find participation paths"
        className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <label className="sm:col-span-2">
          Find a path
          <input
            name="q"
            type="search"
            defaultValue={search.q}
            maxLength={120}
            className="mt-2 w-full rounded-sm border border-border bg-background px-4 py-3"
            placeholder="Scientific ML, writing, systems…"
          />
        </label>
        <label>
          Topic
          <select
            name="topic"
            defaultValue={search.topic}
            className="mt-2 block w-full rounded-sm border border-border bg-background px-4 py-3"
          >
            <option value="all">All research areas</option>
            {OPPORTUNITY_TOPICS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        {Object.entries(OPPORTUNITY_OPTIONS).map(([key, options]) => (
          <label key={key}>
            {filterLabels[key as keyof typeof filterLabels]}
            <select
              name={key}
              defaultValue={search[key as keyof typeof search]}
              className="mt-2 block w-full rounded-sm border border-border bg-background px-4 py-3"
            >
              {options.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        ))}
        <div className="flex items-end gap-5">
          <button
            type="submit"
            className="min-h-12 rounded-sm border border-accent-blue px-5 text-accent-blue"
          >
            Apply filters
          </button>
          <a href="/forms" className="inline-flex min-h-12 items-center text-sm underline">
            Clear filters
          </a>
        </div>
      </form>
      <p className="mb-3 text-sm text-muted-foreground">
        Saved interests stay only in this browser on this device. They are not applications, account
        bookmarks, or expressions of interest sent to BU1LD. Clearing browser storage removes them.
      </p>
      <noscript>
        <p className="mb-4 text-sm text-muted-foreground">
          Search and catalog filters work without JavaScript. Saving interests requires JavaScript
          and browser storage; a saved-only filter cannot be applied here.
        </p>
      </noscript>
      {storageState === "unavailable" && (
        <p role="status" className="mb-4 text-sm text-muted-foreground">
          Device storage is unavailable. You can still browse and use all catalog filters. Reload
          after enabling storage to try saving again.
        </p>
      )}
      {savedFilterUnavailable && (
        <p role="status" className="mb-4 text-sm text-muted-foreground">
          Saved interests are not available yet. Showing catalog matches until device storage can be
          read.
        </p>
      )}
      <p role="status" aria-live="polite" className="mb-5 text-sm text-muted-foreground">
        {saveNotice}
      </p>

      <section className="mb-10 rounded-sm border border-accent-blue/40 p-6">
        <h2 className="font-display text-2xl">Understand the next step</h2>
        <ol className="mt-4 grid gap-4 sm:grid-cols-3">
          <li>
            <strong>1. Explore and prepare.</strong>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Read a project’s evidence, prerequisites and bounded contribution. Preparation is
              optional and does not assign work.
            </p>
          </li>
          <li>
            <strong>2. Use the correct intake.</strong>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              BU1LD research uses its existing research intake. FinanceMeta is a separate
              organization with a separate application route.
            </p>
          </li>
          <li>
            <strong>3. Wait for a reviewed match.</strong>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Submission does not confer membership, authorship, funding, compute, or acceptance.
              Agree scope and a reviewer before starting.
            </p>
          </li>
        </ol>
        <a
          href="https://tally.so/r/1AeYbO"
          onClick={() =>
            trackEvent("opportunity_intake_outbound", {
              opportunity_kind: "research",
              application_path: "external",
              destination_host: "tally.so",
              source: "participation_directory",
            })
          }
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex min-h-12 items-center rounded-sm border border-border px-5"
        >
          Open existing BU1LD research intake ↗
        </a>
        <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
          You will leave BU1LD for Tally. This is the destination linked by BU1LD’s public site; the
          first application page was verified on 16 October 2026. The form states that teams
          activate only after ownership and reviewer capacity are confirmed. Only the provider can
          confirm receipt. No form is submitted by this link.
        </p>
      </section>

      <section aria-labelledby="participation-results">
        <h2 id="participation-results" className="font-display text-3xl">
          {search.status === "archived" ? "Archived formats" : "Participation paths"}
        </h2>
        <p role="status" aria-live="polite" className="mb-5 mt-2 text-sm text-muted-foreground">
          {visible.length} {visible.length === 1 ? "matching path" : "matching paths"}
          {savedFilterUnavailable ? " in the catalog; saved filter pending" : ""}
        </p>
        {visible.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {visible.map((item) => (
              <OpportunityCard
                key={item.id}
                item={item}
                now={now}
                saved={saved.includes(item.id)}
                canSave={storageState === "available"}
                onSave={() => toggleInterest(item)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-sm border border-border p-6">
            <h3 className="font-display text-xl">No matching paths</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {search.status === "open"
                ? "No opportunity currently has confirmed operational approval for an open placement."
                : search.saved === "saved"
                  ? "No saved interests match these filters. Save a path from the full directory or broaden your filters."
                  : "Try another topic, type, or commitment. Unconfirmed dates and locations are not treated as published availability."}
            </p>
            <a
              href="/forms"
              className="mt-4 inline-flex min-h-11 items-center text-accent-blue underline"
            >
              Browse all current interests
            </a>
          </div>
        )}
      </section>
      <nav
        className="mt-10 flex flex-wrap gap-6 border-t border-border pt-6"
        aria-label="Participation destinations"
      >
        <Link to="/projects" className="text-accent-blue">
          Published project briefs →
        </Link>
        <Link to="/guides" className="text-accent-blue">
          Prepare with public lessons →
        </Link>
        <Link to="/events" className="text-accent-blue">
          Events →
        </Link>
        <Link to="/apply" className="text-accent-blue">
          Account applications and status →
        </Link>
      </nav>
    </InstitutionLayout>
  );
}

function OpportunityCard({
  item,
  now,
  saved,
  canSave,
  onSave,
}: {
  item: Opportunity;
  now: number;
  saved: boolean;
  canSave: boolean;
  onSave: () => void;
}) {
  const status = opportunityStatus(item, now);
  const detailAnalytics = useRef(createOpportunityDetailAnalytics(item.type));
  const statusLabel =
    status === "archived"
      ? "Archived · wave ended"
      : status === "closed"
        ? "Closed / expired"
        : status === "open"
          ? "Confirmed open"
          : "Interest only · capacity unconfirmed";
  return (
    <article className="panel rounded-sm p-6">
      <p className="text-xs uppercase tracking-wider text-accent-blue">
        BU1LD · {item.type === "program" ? "Program format" : "Research direction"}
      </p>
      <p className="mt-2 text-sm font-medium">{statusLabel}</p>
      <h3 className="mt-3 font-display text-2xl">{item.name}</h3>
      <p className="mt-3 leading-relaxed text-muted-foreground">{item.summary}</p>
      <dl className="mt-4 space-y-3 text-sm">
        <div>
          <dt className="font-medium">Intended participants</dt>
          <dd className="mt-1 text-muted-foreground">{item.eligibility}</dd>
        </div>
        <div>
          <dt className="font-medium">Format commitment</dt>
          <dd className="mt-1 text-muted-foreground">{item.commitment}</dd>
        </div>
        <div>
          <dt className="font-medium">Deadline / intake</dt>
          <dd className="mt-1 text-muted-foreground">
            {status === "archived"
              ? "Ended wave; no current application."
              : (item.deadline ??
                (item.rollingConfirmed
                  ? "Confirmed rolling intake"
                  : "Not confirmed; no deadline or rolling intake promised."))}
          </dd>
        </div>
        <div>
          <dt className="font-medium">Location / timezone</dt>
          <dd className="mt-1 text-muted-foreground">Not confirmed.</dd>
        </div>
      </dl>
      <details
        className="mt-5 border-t border-border pt-4"
        onToggle={(event) => detailAnalytics.current.toggled(event.currentTarget.open)}
      >
        <summary
          className="cursor-pointer text-sm"
          onClick={(event) =>
            detailAnalytics.current.summaryActivated(
              (event.currentTarget.parentElement as HTMLDetailsElement).open,
            )
          }
        >
          Scope and verification details
        </summary>
        <p className="mt-3 text-sm text-muted-foreground">{item.timeline}</p>
        <p className="mt-3 text-sm font-medium">
          {item.type === "program" ? "Intended format outputs" : "Published research focus"}
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {item.outputs.map((output) => (
            <li key={output}>{output}</li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-muted-foreground">
          Placement owner, assigned reviewer, reviewer capacity, compensation or volunteer terms,
          and final prerequisites: not confirmed. Agree these before undertaking work.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Source: BU1LD’s{" "}
          {item.type === "program" ? "program format catalog" : "research direction catalog"}.
          Catalog checked <time dateTime={item.checkedAt}>{item.checkedAt}</time>; this is not
          confirmation of recruitment.
        </p>
      </details>
      <div className="mt-5 flex flex-wrap items-center gap-4">
        {item.type === "program" ? (
          <Link
            to="/programs-public"
            hash={item.slug}
            onClick={() =>
              trackEvent("opportunity_detail_viewed", {
                opportunity_kind: item.type,
                source: "participation_directory",
                action: "follow_source",
              })
            }
            className="inline-flex min-h-11 items-center text-sm text-accent-blue"
          >
            Read source and requirements →
          </Link>
        ) : (
          <Link
            to="/labs/$slug"
            params={{ slug: item.slug }}
            onClick={() =>
              trackEvent("opportunity_detail_viewed", {
                opportunity_kind: item.type,
                source: "participation_directory",
                action: "follow_source",
              })
            }
            className="inline-flex min-h-11 items-center text-sm text-accent-blue"
          >
            Explore source and direction →
          </Link>
        )}
        <button
          type="button"
          disabled={!canSave}
          aria-pressed={saved}
          onClick={onSave}
          className="min-h-11 rounded-sm border border-border px-3 text-sm disabled:opacity-50"
        >
          {saved ? "Saved on device" : "Save interest on device"}
          <span className="sr-only">: {item.name}</span>
        </button>
      </div>
    </article>
  );
}
