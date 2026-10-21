import { expect, test } from "bun:test";
import {
  createLessonCompletionAnalytics,
  createOpportunityDetailAnalytics,
  trackPaperSave,
} from "./learning-analytics";
import { createReadingProgressStore } from "./reading-progress-store";

function recorder() {
  const events: { name: string; props: Record<string, string | boolean> }[] = [];
  return {
    events,
    emit: (name: string, props: Record<string, string | boolean>) => {
      events.push({ name, props });
    },
  };
}

test("restoring or automatically persisting reading progress does not emit completion", () => {
  const { events, emit } = recorder();
  const restored = createLessonCompletionAnalytics(emit);
  restored.restore(100);
  restored.intendCompletion();
  restored.persisted(100, { percent: 100, source: "synced" });
  const automatic = createLessonCompletionAnalytics(emit);
  automatic.persisted(100, { percent: 100, source: "local" });
  expect(events).toEqual([]);
});

test("completion emits once only after an explicit action and actual durable progress receipt", async () => {
  const { events, emit } = recorder();
  let available = false;
  const entries = new Map<string, string>();
  const store = createReadingProgressStore({
    storage: () =>
      available
        ? {
            get length() {
              return entries.size;
            },
            key: (index) => Array.from(entries.keys())[index] ?? null,
            getItem: (key) => entries.get(key) ?? null,
            setItem: (key, value) => {
              entries.set(key, value);
            },
          }
        : null,
    remote: () => null,
  });
  const completion = createLessonCompletionAnalytics(emit);
  completion.restore(10);
  completion.intendCompletion();
  completion.persisted(100, await store.save("private-user", "private-slug", 100));
  expect(events).toEqual([]);
  available = true;
  completion.persisted(100, await store.save("private-user", "private-slug", 100));
  completion.persisted(100, { percent: 100, source: "synced" });
  completion.intendCompletion();
  completion.persisted(100, { percent: 100, source: "synced" });
  expect(events).toEqual([
    {
      name: "lesson_completed",
      props: { content_type: "guide", source: "local", completed: true },
    },
  ]);
});

test("incomplete progress cannot trigger a completed lesson event", () => {
  const { events, emit } = recorder();
  const completion = createLessonCompletionAnalytics(emit);
  completion.intendCompletion();
  completion.persisted(50, { percent: 100, source: "synced" });
  completion.persisted(100, { percent: 50, source: "synced" });
  expect(events).toEqual([]);
  completion.persisted(100, { percent: 100, source: "synced" });
  expect(events[0]).toEqual({
    name: "lesson_completed",
    props: { content_type: "guide", source: "synced", completed: true },
  });
});

test("native opportunity details count opening gestures but not restore or closing", () => {
  const { events, emit } = recorder();
  const detail = createOpportunityDetailAnalytics("program", emit);
  detail.toggled(true);
  detail.summaryActivated(true);
  detail.toggled(false);
  expect(events).toEqual([]);
  detail.summaryActivated(false);
  detail.toggled(true);
  detail.toggled(true);
  expect(events).toEqual([
    {
      name: "opportunity_detail_viewed",
      props: { opportunity_kind: "program", source: "participation_directory", action: "expand" },
    },
  ]);
});

test("paper analytics require a successful saved receipt and carry no paper or reader identity", () => {
  const { events, emit } = recorder();
  trackPaperSave(
    "paper",
    { saved: true, changed: false, source: "unavailable", error: "failed" },
    emit,
  );
  trackPaperSave("paper", { saved: true, changed: false, source: "synced", error: "failed" }, emit);
  trackPaperSave("paper", { saved: false, changed: true, source: "synced", error: null }, emit);
  trackPaperSave("guide", { saved: true, changed: true, source: "synced", error: null }, emit);
  trackPaperSave("paper", { saved: true, changed: false, source: "synced", error: null }, emit);
  expect(events).toEqual([]);
  trackPaperSave("paper", { saved: true, changed: true, source: "synced", error: null }, emit);
  trackPaperSave("paper", { saved: true, changed: true, source: "local", error: null }, emit);
  expect(events).toEqual([
    { name: "paper_saved", props: { item_type: "paper", source: "account_bookmark" } },
    { name: "paper_saved", props: { item_type: "paper", source: "browser_bookmark" } },
  ]);
});
