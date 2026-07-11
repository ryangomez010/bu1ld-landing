import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { CtaLink, InlineEmpty } from "@/components/member/ContentCard";
import { ListSkeleton } from "@/components/member/LoadingState";
import { SectionHeader } from "@/components/member/SectionHeader";
import { fetchCollections, type SavedCollection } from "@/lib/saved-collections";

export function CollectionsStrip({ userId }: { userId: string }) {
  const [collections, setCollections] = useState<SavedCollection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchCollections(userId).then((c) => {
      setCollections(c.slice(0, 4));
      setLoading(false);
    });
  }, [userId]);

  return (
    <section className="section-gap">
      <SectionHeader
        title="Your collections"
        accent="green"
        description="Named lists of saved papers, guides, and events — group reading for a research thread, paper sprint, or event prep cycle."
        action={
          <CtaLink to="/saved/collections" accent="green">
            Manage →
          </CtaLink>
        }
      />
      {loading ? (
        <ListSkeleton rows={2} />
      ) : collections.length === 0 ? (
        <InlineEmpty
          title="No collections yet"
          body="Create a collection, then add saved papers, guides, or events from any detail page. Collections are private until you share the link."
          action={
            <CtaLink to="/saved/collections" accent="green">
              Create collection →
            </CtaLink>
          }
        />
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {collections.map((c) => (
            <Link
              key={c.id}
              to="/saved/collections"
              className="panel glass-subtle panel-interactive surface-card-interactive p-4 block"
            >
              <p className="font-display text-base text-bone line-clamp-1">{c.name}</p>
              {c.description ? (
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{c.description}</p>
              ) : null}
              <p className="mt-3 label-xs text-accent-green">
                {c.item_count ?? 0} item{(c.item_count ?? 0) === 1 ? "" : "s"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
