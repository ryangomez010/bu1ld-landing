import { Share2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function ShareButton({
  title,
  url,
  className,
}: {
  title: string;
  url?: string;
  className?: string;
}) {
  const share = async () => {
    const href = url ?? (typeof window !== "undefined" ? window.location.href : "");
    try {
      if (navigator.share) {
        await navigator.share({ title, url: href });
        return;
      }
      await navigator.clipboard.writeText(href);
      toast.success("Link copied.");
    } catch {
      if (href) {
        await navigator.clipboard.writeText(href);
        toast.success("Link copied.");
      }
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => void share()}
      className={`font-mono text-[9px] tracking-[0.15em] uppercase gap-1.5 ${className ?? ""}`}
    >
      <Share2 className="h-3.5 w-3.5" />
      Share
    </Button>
  );
}
