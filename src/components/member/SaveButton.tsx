import { Bookmark } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { isSaved, toggleSaved } from "@/lib/saved";
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

  useEffect(() => {
    if (!user) return;
    void isSaved(user.id, itemType, itemSlug).then((v) => {
      setSaved(v);
      setLoading(false);
    });
  }, [user, itemType, itemSlug]);

  if (!user) return null;

  const onToggle = async () => {
    setLoading(true);
    const next = await toggleSaved(user.id, itemType, itemSlug, itemTitle);
    setSaved(next);
    setLoading(false);
    toast.success(next ? "Saved to your list" : "Removed from saved");
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={loading}
      onClick={() => void onToggle()}
      className={cn(
        "font-mono text-[9px] tracking-[0.15em] uppercase gap-2",
        saved ? "text-accent-blue" : "text-muted-foreground",
        className,
      )}
    >
      <Bookmark className={cn("h-3.5 w-3.5", saved && "fill-current")} />
      {saved ? "Saved" : "Save"}
    </Button>
  );
}
