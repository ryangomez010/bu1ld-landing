import { Bookmark } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { loadSavedState, toggleSavedWithReceipt } from "@/lib/saved";
import { trackPaperSave } from "@/lib/learning-analytics";
import type { SavedItemType } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SaveButton({
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

  useEffect(() => {
    const generation = ++revision.current;
    let active = true;
    setLoadedKey("");
    setLoading(true);
    setLoadError(false);
    setSaved(false);
    if (!user) return;
    void loadSavedState(user.id, itemType, itemSlug).then((result) => {
      if (!active || generation !== revision.current) return;
      setSaved(result.saved);
      setLoadError(Boolean(result.error));
      setLoadedKey(currentKey);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [user, itemType, itemSlug, currentKey, retry]);

  if (!user) return null;

  const onToggle = async () => {
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

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={loading || loadedKey !== currentKey}
      onClick={() => (loadError ? setRetry((value) => value + 1) : void onToggle())}
      className={cn(
        "font-mono text-[9px] tracking-[0.15em] uppercase gap-2",
        saved ? "text-accent-blue" : "text-muted-foreground",
        className,
      )}
    >
      <Bookmark className={cn("h-3.5 w-3.5", saved && "fill-current")} />
      {loadError ? "Retry saved status" : saved ? "Saved" : "Save"}
    </Button>
  );
}
