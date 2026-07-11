import { createFileRoute, Link } from "@tanstack/react-router";
import { Bookmark } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { RequireMember } from "@/components/auth/RequireAuth";
import { AddToCollectionMenu } from "@/components/member/AddToCollectionMenu";
import { ConfirmButton } from "@/components/member/ConfirmButton";
import { CtaLink, EmptyState } from "@/components/member/ContentCard";
import { FilterBar } from "@/components/member/FilterBar";
import { ListSkeleton } from "@/components/member/LoadingState";
import { MemberLayout } from "@/components/member/MemberLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import {
  bulkUnsaveSavedItems,
  fetchSavedItems,
  loadSavedPagePrefs,
  saveSavedPagePrefs,
  savedItemHref,
  toggleSaved,
} from "@/lib/saved";
import type { SavedItem, SavedItemType } from "@/lib/types";

export const Route = createFileRoute("/saved/")({
  component: SavedPage,
});

function SavedPage() {
  return (
    <RequireMember>
      <SavedContent />
    </RequireMember>
  );
}

const TYPE_LABELS: Record<SavedItemType, string> = {
  event: "Event",
  paper: "Paper",
  project: "Project",
  job: "Job",
  guide: "Guide",
  newsletter: "Newsletter",
};

function SavedContent() {
  const { user } = useAuth();
  const [items, setItems] = useState<SavedItem[]>([]);
  const [filter, setFilter] = useState<SavedItemType | "all">("all");
  const [sort, setSort] = useState<"newest" | "oldest" | "type">("newest");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const prefs = loadSavedPagePrefs(user.id);
    setFilter(prefs.filter);
    setSort(prefs.sort);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    saveSavedPagePrefs(user.id, { filter, sort });
  }, [user, filter, sort]);

  const reload = useCallback(() => {
    if (!user) return;
    void fetchSavedItems(user.id).then((list) => {
      setItems(list);
      setLoading(false);
    });
  }, [user]);

  useEffect(() => {
    reload();
  }, [reload]);

  const filtered = useMemo(() => {
    const base = filter === "all" ? items : items.filter((i) => i.item_type === filter);
    const sorted = [...base];
    if (sort === "newest") sorted.sort((a, b) => b.created_at.localeCompare(a.created_at));
    else if (sort === "oldest") sorted.sort((a, b) => a.created_at.localeCompare(b.created_at));
    else sorted.sort((a, b) => a.item_type.localeCompare(b.item_type));
    return sorted;
  }, [items, filter, sort]);

  const onUnsave = async (item: SavedItem) => {
    if (!user) return;
    await toggleSaved(user.id, item.item_type, item.item_slug, item.item_title);
    toast.success("Removed from saved");
    reload();
  };

  const onBulkUnsave = async () => {
    if (!user || filtered.length === 0) return;
    const { error } = await bulkUnsaveSavedItems(
      user.id,
      filtered.map((i) => ({ item_type: i.item_type, item_slug: i.item_slug })),
    );
    if (error) {
      toast.error(error);
      return;
    }
    toast.success(`Removed ${filtered.length} item(s)`);
    reload();
  };

  return (
    <MemberLayout title="Saved" eyebrow="your bookmarks">
      <p className="text-muted-foreground mb-4 max-w-2xl leading-relaxed -mt-4">
        Bookmarks for papers, guides, projects, events, jobs, and newsletter issues. Saved items
        sync to your account — add them to collections for thread-specific reading lists.
      </p>
      <div className="mb-6">
        <CtaLink to="/saved/collections" accent="green">
          Research collections →
        </CtaLink>
      </div>
      {loading ? (
        <ListSkeleton rows={4} />
      ) : items.length === 0 ? (
        <EmptyState
          title="Nothing saved yet"
          body="Use Save on any detail page — papers, guides, projects, events, jobs, newsletter issues. Saved items appear here and can be added to collections."
          action={<CtaLink to="/search">Browse content →</CtaLink>}
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <FilterBar
              value={sort}
              onChange={setSort}
              options={(
                [
                  ["newest", "Newest"],
                  ["oldest", "Oldest"],
                  ["type", "By type"],
                ] as const
              ).map(([value, label]) => ({ value, label }))}
            />
            {filtered.length > 0 ? (
              <ConfirmButton
                title={`Remove ${filtered.length} saved item(s)?`}
                description="This cannot be undone. Items will be removed from your saved list."
                confirmLabel="Remove all"
                destructive
                onConfirm={() => void onBulkUnsave()}
                trigger={
                  <Button type="button" size="sm" variant="outline" className="ml-auto label-xs">
                    Unsave all ({filtered.length})
                  </Button>
                }
              />
            ) : null}
          </div>
          <FilterBar
            className="mb-6"
            value={filter}
            onChange={setFilter}
            options={(
              ["all", "project", "guide", "paper", "event", "job", "newsletter"] as const
            ).map((f) => ({
              value: f,
              label: f === "all" ? "All" : TYPE_LABELS[f],
              count: f === "all" ? items.length : items.filter((i) => i.item_type === f).length,
            }))}
          />

          {filtered.length === 0 ? (
            <EmptyState
              title="No items for this type"
              body="Change the type filter to All, or save content from its detail page first."
            />
          ) : (
            <div className="grid gap-px bg-border/40 border border-border/40 surface-card overflow-hidden">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className="bg-background/75 p-5 flex items-start justify-between gap-4 list-row-hover"
                >
                  <Link
                    to={savedItemHref(item.item_type, item.item_slug)}
                    className="min-w-0 hover:opacity-90 transition"
                  >
                    <span className="label-xs text-accent-green">
                      {TYPE_LABELS[item.item_type]}
                    </span>
                    <h3 className="font-display text-lg text-bone mt-2">{item.item_title}</h3>
                  </Link>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {user ? (
                      <AddToCollectionMenu
                        userId={user.id}
                        itemType={item.item_type}
                        itemSlug={item.item_slug}
                        itemTitle={item.item_title}
                      />
                    ) : null}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void onUnsave(item)}
                      className="label-xs text-muted-foreground"
                    >
                      <Bookmark className="h-3.5 w-3.5 mr-1 fill-current" />
                      Unsave
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </MemberLayout>
  );
}
