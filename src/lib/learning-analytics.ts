import { trackEvent } from "./analytics";
import type { ProgressSave } from "./reading-progress-store";
import type { SavedToggleReceipt } from "./saved";
import type { SavedItemType } from "./types";

/** A failed save, removal, or restored bookmark is not a newly saved paper. */
export function trackPaperSave(
  itemType: SavedItemType,
  result: SavedToggleReceipt,
  emit: (name: string, props: Record<string, string>) => void = trackEvent,
) {
  if (
    itemType !== "paper" ||
    !result.saved ||
    !result.changed ||
    result.error ||
    result.source === "unavailable"
  )
    return;
  emit("paper_saved", {
    item_type: "paper",
    source: result.source === "synced" ? "account_bookmark" : "browser_bookmark",
  });
}

/** Only an explicit completion intent followed by a durable save counts. */
export function createLessonCompletionAnalytics(
  emit: (name: string, props: Record<string, string | boolean>) => void = trackEvent,
) {
  let completed = false;
  let pendingIntent = false;
  return {
    restore(percent: number) {
      completed ||= percent >= 95;
    },
    intendCompletion() {
      pendingIntent = !completed;
    },
    persisted(requested: number, result: ProgressSave) {
      if (
        !pendingIntent ||
        completed ||
        requested < 95 ||
        result.percent < 95 ||
        result.source === "unavailable"
      )
        return;
      completed = true;
      pendingIntent = false;
      emit("lesson_completed", { content_type: "guide", source: result.source, completed: true });
    },
  };
}

/** A browser-restored details state must not count as a new user interaction. */
export function createOpportunityDetailAnalytics(
  kind: "program" | "research",
  emit: (name: string, props: Record<string, string>) => void = trackEvent,
) {
  let openingIntent = false;
  return {
    summaryActivated(currentlyOpen: boolean) {
      openingIntent = !currentlyOpen;
    },
    toggled(open: boolean) {
      const shouldEmit = openingIntent && open;
      openingIntent = false;
      if (shouldEmit)
        emit("opportunity_detail_viewed", {
          opportunity_kind: kind,
          source: "participation_directory",
          action: "expand",
        });
    },
  };
}
