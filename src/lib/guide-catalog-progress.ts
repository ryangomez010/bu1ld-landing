import { createReadingProgressStore } from "./reading-progress-store";
import * as accountProgress from "./reading-progress";

export const ANONYMOUS_READER = "anonymous-device";
const anonymousProgress = createReadingProgressStore({
  storage: () => (typeof window === "undefined" ? null : window.localStorage),
  remote: () => null,
});
// Anonymous reads and writes are deliberately incapable of requesting the remote adapter.
export const getLocalGuideProgress = (id: string, slug: string) =>
  id === ANONYMOUS_READER
    ? anonymousProgress.getLocal(id, slug)
    : accountProgress.getLocalProgress(id, slug);
export const setLocalGuideProgress = (id: string, slug: string, percent: number) =>
  id === ANONYMOUS_READER
    ? anonymousProgress.setLocal(id, slug, percent)
    : accountProgress.setLocalProgress(id, slug, percent);
export const loadPublicGuideProgress = (id: string, slug?: string) =>
  id === ANONYMOUS_READER
    ? anonymousProgress.load(id, slug)
    : accountProgress.loadGuideProgress(id, slug);
export const persistPublicGuideProgress = (id: string, slug: string, percent: number) =>
  id === ANONYMOUS_READER
    ? anonymousProgress.save(id, slug, percent)
    : accountProgress.persistReadingProgress(id, slug, percent);
