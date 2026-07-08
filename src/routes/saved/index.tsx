import { createFileRoute, Link } from "@tanstack/react-router";
import { Bookmark } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { EmptyState } from "@/components/member/ContentCard";
import { MemberLayout } from "@/components/member/MemberLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { fetchSavedItems, savedItemHref, toggleSaved } from "@/lib/saved";
import type { SavedItem, SavedItemType } from "@/lib/types";

export const Route = createFileRoute("/saved/")({
  component: SavedPage,
});

function SavedPage() {
  return (
    <RequireAuth>
      <SavedContent />
    </RequireAuth>
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
  const [loading, setLoading] = useState(true);

  const reload = () => {
    if (!user) return;
    void fetchSavedItems(user.id).then((list) => {
      setItems(list);
      setLoading(false);
    });
  };

  useEffect(() => {
    reload();
  }, [user]);

  const filtered = useMemo(
    () => (filter === "all" ? items : items.filter((i) => i.item_type === filter)),
    [items, filter],
  );

  const onUnsave = async (item: SavedItem) => {
    if (!user) return;
    await toggleSaved(user.id, item.item_type, item.item_slug, item.item_title);
    toast.success("Removed from saved");
    reload();
  };

  return (
    <MemberLayout title="Saved" eyebrow="your bookmarks">
      {loading ? (
        <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground animate-pulse">
          Loading…
        </p>
      ) : items.length === 0 ? (
        <EmptyState
          title="Nothing saved yet"
          body="Use the Save button on events, papers, projects, jobs, guides, and newsletter issues."
          action={
            <Link
              to="/search"
              className="font-mono text-[10px] tracking-[0.22em] uppercase text-accent-blue hover:text-bone"
            >
              Browse content →
            </Link>
          }
        />
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-6 -mt-4">
            {(["all", "project", "guide", "paper", "event", "job", "newsletter"] as const).map(
              (f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`font-mono text-[10px] tracking-[0.22em] uppercase px-3 py-1.5 rounded-sm border transition ${
                    filter === f
                      ? "bg-accent-blue/10 text-bone border-accent-blue/30"
                      : "border-border/60 text-muted-foreground hover:text-bone"
                  }`}
                >
                  {f === "all" ? "All" : TYPE_LABELS[f]}
                  {f === "all"
                    ? ` (${items.length})`
                    : ` (${items.filter((i) => i.item_type === f).length})`}
                </button>
              ),
            )}
          </div>

          {filtered.length === 0 ? (
            <EmptyState title="No items in this filter" body="Try another type." />
          ) : (
            <div className="grid gap-px bg-border/40 border border-border/40">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className="bg-background/75 p-5 flex items-start justify-between gap-4"
                >
                  <Link
                    to={savedItemHref(item.item_type, item.item_slug)}
                    className="min-w-0 hover:opacity-90 transition"
                  >
                    <span className="font-mono text-[9px] tracking-[0.25em] uppercase text-accent-green">
                      {TYPE_LABELS[item.item_type]}
                    </span>
                    <h3 className="font-display text-lg text-bone mt-2">{item.item_title}</h3>
                  </Link>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void onUnsave(item)}
                    className="shrink-0 font-mono text-[9px] tracking-[0.15em] uppercase text-muted-foreground"
                  >
                    <Bookmark className="h-3.5 w-3.5 mr-1 fill-current" />
                    Unsave
                  </Button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </MemberLayout>
  );
}
