import type { MemberBackground } from "@/lib/types";

export type OnboardingDraft = {
  step: number;
  fullName: string;
  bio: string;
  background: MemberBackground;
  interests: string[];
  githubUrl: string;
  linkedinUrl: string;
  timezone: string;
  availabilityHours: string;
  experienceLevel: string;
  desiredRoles: string;
};

type DraftStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
const key = (userId: string) => `build:onboarding-draft:${userId}`;
const backgrounds: MemberBackground[] = ["researcher", "engineer", "founder", "student", "other"];
const textFields = [
  "fullName",
  "bio",
  "githubUrl",
  "linkedinUrl",
  "timezone",
  "availabilityHours",
  "experienceLevel",
  "desiredRoles",
] as const;

export function parseOnboardingDraft(value: unknown): Partial<OnboardingDraft> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const raw = value as Record<string, unknown>;
  const draft: Partial<OnboardingDraft> = {};
  if (typeof raw.step === "number" && Number.isInteger(raw.step) && raw.step >= 0 && raw.step <= 3)
    draft.step = raw.step;
  for (const field of textFields) {
    if (typeof raw[field] === "string") draft[field] = raw[field].slice(0, 5000);
  }
  if (backgrounds.includes(raw.background as MemberBackground))
    draft.background = raw.background as MemberBackground;
  if (Array.isArray(raw.interests))
    draft.interests = raw.interests
      .filter(
        (value): value is string =>
          typeof value === "string" && value.length > 0 && value.length <= 60,
      )
      .slice(0, 20);
  return draft;
}

export function loadOnboardingDraft(
  userId: string,
  storage?: DraftStorage,
): Partial<OnboardingDraft> {
  if (!userId || (!storage && typeof window === "undefined")) return {};
  try {
    return parseOnboardingDraft(JSON.parse((storage ?? localStorage).getItem(key(userId)) ?? "{}"));
  } catch {
    return {};
  }
}

export function saveOnboardingDraft(
  userId: string,
  draft: OnboardingDraft,
  storage?: DraftStorage,
): void {
  if (!userId || (!storage && typeof window === "undefined")) return;
  try {
    (storage ?? localStorage).setItem(key(userId), JSON.stringify(draft));
  } catch {
    // Keep the form usable when browser storage is disabled or full.
  }
}

export function clearOnboardingDraft(userId: string, storage?: DraftStorage): void {
  if (!userId || (!storage && typeof window === "undefined")) return;
  try {
    (storage ?? localStorage).removeItem(key(userId));
  } catch {
    // Saving the profile has already succeeded; a storage error must not undo it.
  }
}

export function validateOnboardingDetails(
  fullName: string,
  interests: string[],
): { step: number; error: string } | null {
  if (fullName.trim().length < 2)
    return { step: 0, error: "Enter a name with at least 2 characters." };
  if (!interests.some((interest) => interest.trim()))
    return { step: 1, error: "Choose at least one interest." };
  return null;
}
