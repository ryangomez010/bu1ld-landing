import { Bell, BellOff } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { isFollowingProject, toggleProjectFollow } from "@/lib/project-follows";
import { cn } from "@/lib/utils";

export function FollowProjectButton({
  projectId,
  className,
}: {
  projectId: string;
  className?: string;
}) {
  const { user } = useAuth();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    void isFollowingProject(user.id, projectId).then((v) => {
      setFollowing(v);
      setLoading(false);
    });
  }, [user, projectId]);

  if (!user) return null;

  const onToggle = async () => {
    setBusy(true);
    const { following: next, error } = await toggleProjectFollow(user.id, projectId);
    setBusy(false);
    if (error) {
      toast.error(error);
      return;
    }
    setFollowing(next);
    toast.success(next ? "Following — you'll get update notifications" : "Unfollowed project");
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={loading || busy}
      onClick={() => void onToggle()}
      className={cn(
        "font-mono text-[9px] tracking-[0.15em] uppercase gap-2",
        following ? "text-accent-green" : "text-muted-foreground",
        className,
      )}
    >
      {following ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
      {following ? "Watching" : "Watch"}
    </Button>
  );
}
