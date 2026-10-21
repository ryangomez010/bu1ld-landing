import { Button } from "@/components/ui/button";

export function PublicDataNotice({
  title,
  hasCachedData,
  retrying,
  onRetry,
}: {
  title: string;
  hasCachedData: boolean;
  retrying: boolean;
  onRetry: () => void;
}) {
  return (
    <div role="alert" className="my-5 rounded-sm border border-accent-blue/30 bg-accent-blue/5 p-5">
      <h3 className="font-display text-xl text-bone">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {hasCachedData
          ? "Showing the last loaded records. Their publication or verification status may have changed."
          : "The service could not confirm the current records. Please try again."}
      </p>
      <Button
        type="button"
        variant="outline"
        className="mt-4 min-h-11"
        disabled={retrying}
        onClick={onRetry}
      >
        {retrying ? "Retrying…" : "Try again"}
      </Button>
    </div>
  );
}
