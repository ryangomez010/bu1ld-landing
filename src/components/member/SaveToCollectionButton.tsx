import { Bookmark, FolderPlus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";
import { addToCollection, createCollection, fetchCollections } from "@/lib/saved-collections";
import { loadSavedState, toggleSavedWithReceipt } from "@/lib/saved";
import { trackPaperSave } from "@/lib/learning-analytics";
import type { SavedItemType } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SaveToCollectionButton({
  itemType,
  itemSlug,
  itemTitle,
  className,
}: {
  itemType: SavedItemType;
  itemSlug: string;
  itemTitle: string;
  className?: string;
}) {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [loadedKey, setLoadedKey] = useState("");
  const currentKey = `${user?.id}:${itemType}:${itemSlug}`;
  const revision = useRef(0);
  const [collections, setCollections] = useState<Awaited<ReturnType<typeof fetchCollections>>>([]);

  useEffect(() => {
    const generation = ++revision.current;
    let active = true;
    setLoadedKey("");
    setLoading(true);
    setLoadError(false);
    setSaved(false);
    setCollections([]);
    if (!user) return;
    void loadSavedState(user.id, itemType, itemSlug).then((result) => {
      if (!active || generation !== revision.current) return;
      setSaved(result.saved);
      setLoadError(Boolean(result.error));
      setLoadedKey(currentKey);
      setLoading(false);
    });
    void fetchCollections(user.id)
      .then((rows) => {
        if (active) setCollections(rows);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [user, itemType, itemSlug, currentKey, retry]);

  if (!user) return null;

  const onToggleSaved = async () => {
    const generation = revision.current;
    setLoading(true);
    const result = await toggleSavedWithReceipt(user.id, itemType, itemSlug, itemTitle, !saved);
    trackPaperSave(itemType, result);
    if (generation !== revision.current) return;
    setLoading(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setSaved(result.saved);
    toast.success(result.saved ? "Saved to your list" : "Removed from saved");
  };

  const onAddToCollection = async (collectionId: string, collectionName: string) => {
    const { error } = await addToCollection(collectionId, {
      item_type: itemType,
      item_slug: itemSlug,
      item_title: itemTitle,
    });
    if (error) {
      toast.error(error);
      return;
    }
    if (!saved) await onToggleSaved();
    toast.success(`Added to ${collectionName}`);
  };

  const onQuickCreate = async () => {
    const name = `Saved ${itemType}s`;
    const { collection, error } = await createCollection(user.id, name);
    if (error || !collection) {
      toast.error(error ?? "Could not create collection");
      return;
    }
    setCollections((prev) => [collection, ...prev]);
    await onAddToCollection(collection.id, collection.name);
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={loading || loadedKey !== currentKey}
        onClick={() => (loadError ? setRetry((value) => value + 1) : void onToggleSaved())}
        className={cn(
          "font-mono text-[9px] tracking-[0.15em] uppercase gap-2",
          saved ? "text-accent-blue" : "text-muted-foreground",
        )}
      >
        <Bookmark className={cn("h-3.5 w-3.5", saved && "fill-current")} />
        {loadError ? "Retry saved status" : saved ? "Saved" : "Save"}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={loading || loadError || loadedKey !== currentKey}
            className="font-mono text-[9px] tracking-[0.15em] uppercase gap-1.5 text-muted-foreground"
          >
            <FolderPlus className="h-3.5 w-3.5" />
            Collection
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel className="font-mono text-[9px] tracking-[0.2em] uppercase">
            Save to collection
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {collections.length ? (
            collections.map((c) => (
              <DropdownMenuItem key={c.id} onClick={() => void onAddToCollection(c.id, c.name)}>
                {c.name}
              </DropdownMenuItem>
            ))
          ) : (
            <DropdownMenuItem disabled>No collections yet</DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => void onQuickCreate()}>+ New collection</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
