import { FolderPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { addToCollection, fetchCollections } from "@/lib/saved-collections";
import type { SavedItemType } from "@/lib/types";

export function AddToCollectionMenu({
  userId,
  itemType,
  itemSlug,
  itemTitle,
}: {
  userId: string;
  itemType: SavedItemType;
  itemSlug: string;
  itemTitle: string;
}) {
  const [collections, setCollections] = useState<Awaited<ReturnType<typeof fetchCollections>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchCollections(userId).then((c) => {
      setCollections(c);
      setLoading(false);
    });
  }, [userId]);

  const onAdd = async (collectionId: string) => {
    const { error } = await addToCollection(collectionId, {
      item_type: itemType,
      item_slug: itemSlug,
      item_title: itemTitle,
    });
    if (error) toast.error(error);
    else toast.success("Added to collection");
  };

  if (loading) {
    return (
      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled
        className="label-xs gap-1.5 text-muted-foreground"
        aria-label="Loading collections"
      >
        <FolderPlus className="h-3.5 w-3.5" aria-hidden />
        Collection
      </Button>
    );
  }

  if (!collections.length) {
    return (
      <Button
        type="button"
        size="sm"
        variant="ghost"
        asChild
        className="label-xs gap-1.5 text-muted-foreground hover:text-accent-green"
      >
        <Link to="/saved/collections" aria-label="Create a collection">
          <FolderPlus className="h-3.5 w-3.5" aria-hidden />
          New collection
        </Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="label-xs gap-1.5 text-muted-foreground"
          aria-label="Add to collection"
        >
          <FolderPlus className="h-3.5 w-3.5" aria-hidden />
          Collection
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-64 overflow-y-auto">
        {collections.map((c) => (
          <DropdownMenuItem key={c.id} onClick={() => void onAdd(c.id)}>
            {c.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
