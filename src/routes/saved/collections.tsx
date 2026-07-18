import { createFileRoute, Link } from "@tanstack/react-router";
import { Layers } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { RequireMember } from "@/components/auth/RequireAuth";
import { ConfirmButton } from "@/components/member/ConfirmButton";
import { EmptyState } from "@/components/member/ContentCard";
import { ListSkeleton } from "@/components/member/LoadingState";
import { MemberLayout } from "@/components/member/MemberLayout";
import { PageBackLink } from "@/components/member/PageBackLink";
import { SectionHeader } from "@/components/member/SectionHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { relativeTime } from "@/lib/date";
import {
  createCollection,
  deleteCollection,
  fetchCollectionItems,
  fetchCollections,
  removeFromCollection,
  type SavedCollection,
  type SavedCollectionItem,
} from "@/lib/saved-collections";
import { savedItemHref } from "@/lib/saved";
import { isSupabaseConfigured } from "@/lib/supabase";

export const Route = createFileRoute("/saved/collections")({
  component: CollectionsPage,
});

function CollectionsPage() {
  return (
    <RequireMember>
      <CollectionsContent />
    </RequireMember>
  );
}

function CollectionsContent() {
  const { user } = useAuth();
  const [collections, setCollections] = useState<SavedCollection[]>([]);
  const [selected, setSelected] = useState<SavedCollection | null>(null);
  const [items, setItems] = useState<SavedCollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const reload = useCallback(() => {
    if (!user) return;
    void fetchCollections(user.id).then((data) => {
      setCollections(data);
      setLoading(false);
    });
  }, [user]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    if (!selected) {
      setItems([]);
      return;
    }
    void fetchCollectionItems(selected.id).then(setItems);
  }, [selected]);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setCreating(true);
    const { collection, error } = await createCollection(user.id, name, description);
    setCreating(false);
    if (error || !collection) {
      toast.error(error ?? "Could not create collection.");
      return;
    }
    toast.success(`Collection “${collection.name}” created.`);
    setName("");
    setDescription("");
    reload();
    setSelected(collection);
  };

  const onDeleteCollection = async (id: string) => {
    if (!user) return;
    const { error } = await deleteCollection(user.id, id);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Collection deleted.");
    if (selected?.id === id) setSelected(null);
    reload();
  };

  const onRemoveItem = async (itemId: string) => {
    const { error } = await removeFromCollection(itemId);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Removed from collection.");
    if (selected) void fetchCollectionItems(selected.id).then(setItems);
    reload();
  };

  return (
    <MemberLayout title="Research collections" eyebrow="organized bookmarks">
      <p className="text-muted-foreground mb-6 max-w-2xl leading-relaxed -mt-4">
        Named reading lists separate from your main saved queue — one collection per research
        thread, paper sprint, or conference prep cycle. Items stay in Saved even if you delete a
        collection.
      </p>
      {!isSupabaseConfigured ? (
        <p className="rounded-sm border border-accent-red/30 bg-accent-red/5 px-4 py-3 text-sm text-accent-red mb-6">
          Collections are temporarily unavailable. Please try again later.
        </p>
      ) : null}

      <PageBackLink to="/saved" label="All saved items" />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="space-y-6">
          <form onSubmit={onCreate} className="panel glass-subtle surface-card p-5 space-y-4">
            <SectionHeader title="New collection" accent="green" className="mb-0" />
            <div className="space-y-2">
              <Label htmlFor="colName">Name</Label>
              <Input
                id="colName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. ICLR 2026 world-model prep — papers to read before the defect-injection sprint"
                required
                maxLength={80}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="colDesc">Description (optional)</Label>
              <Textarea
                id="colDesc"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
              />
            </div>
            <Button
              type="submit"
              disabled={creating || !name.trim()}
              className="font-mono text-[10px] tracking-[0.2em] uppercase"
            >
              {creating ? "Creating…" : "Create collection"}
            </Button>
          </form>

          {loading ? (
            <ListSkeleton rows={3} />
          ) : collections.length === 0 ? (
            <EmptyState
              title="No collections yet"
              body="Create a collection on the left, then add saved papers, guides, or events from the Saved page or any item's Add to collection menu."
            />
          ) : (
            <div
              className="grid gap-px bg-border/40 border border-border/40 surface-card overflow-hidden"
              role="listbox"
              aria-label="Your collections"
            >
              {collections.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="option"
                  aria-selected={selected?.id === c.id}
                  onClick={() => setSelected(c)}
                  className={`bg-background/75 p-4 text-left transition hover:bg-bone/5 list-row-hover ${
                    selected?.id === c.id
                      ? "ring-1 ring-inset ring-accent-blue/40 bg-accent-blue/5"
                      : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-display text-lg text-bone">{c.name}</p>
                      {c.description ? (
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                          {c.description}
                        </p>
                      ) : null}
                    </div>
                    <Layers className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </div>
                  <p className="mt-2 label-xs text-muted-foreground">
                    {c.item_count ?? 0} items · Updated {relativeTime(c.updated_at)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          {selected ? (
            <div className="panel glass-subtle surface-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h2 className="font-display text-xl text-bone">{selected.name}</h2>
                <ConfirmButton
                  title={`Delete “${selected.name}”?`}
                  description="Items in this collection will be removed. Your saved bookmarks are not affected."
                  confirmLabel="Delete collection"
                  destructive
                  onConfirm={() => void onDeleteCollection(selected.id)}
                  trigger={
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="font-mono text-[9px] tracking-[0.15em] uppercase text-accent-red"
                    >
                      Delete
                    </Button>
                  }
                />
              </div>
              {items.length === 0 ? (
                <EmptyState
                  title="Empty collection"
                  body="Save content from papers, guides, or events using the Save button — then add items to a collection from this page or from any saved item row."
                  action={
                    <Link
                      to="/saved"
                      className="font-mono text-[10px] tracking-[0.2em] uppercase text-accent-blue hover:text-bone"
                    >
                      View saved →
                    </Link>
                  }
                />
              ) : (
                <ul className="space-y-2">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-3 rounded-sm border border-border/50 px-3 py-2"
                    >
                      <Link
                        to={savedItemHref(item.item_type, item.item_slug)}
                        className="min-w-0 hover:text-accent-blue transition"
                      >
                        <span className="font-mono text-[8px] tracking-[0.15em] uppercase text-accent-green">
                          {item.item_type}
                        </span>
                        <p className="text-sm text-bone truncate">{item.item_title}</p>
                      </Link>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => void onRemoveItem(item.id)}
                        className="shrink-0 font-mono text-[8px] tracking-[0.12em] uppercase"
                      >
                        Remove
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <EmptyState
              title="Select a collection"
              body="Pick a collection on the left to view and manage its items."
            />
          )}
        </div>
      </div>
    </MemberLayout>
  );
}
