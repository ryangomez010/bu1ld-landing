import { readUserJson, writeUserJson } from "@/lib/storage";

export type OnboardingStep = {
  id: string;
  label: string;
  done: boolean;
  href: string;
};

export type OnboardingProgress = {
  steps: OnboardingStep[];
  percent: number;
  complete: boolean;
};

const STORAGE = "build:onboarding-dismissed";

export function isOnboardingChecklistDismissed(userId: string): boolean {
  return readUserJson<boolean>(STORAGE, userId, false);
}

export function dismissOnboardingChecklist(userId: string): void {
  writeUserJson(STORAGE, userId, true);
}

export function computeOnboardingProgress(input: {
  profileComplete: boolean;
  hasApplicationOrSave: boolean;
  hasReadGuide: boolean;
  hasVerifiedEmail: boolean;
  hasSetInterests: boolean;
  continueGuideHref?: string;
}): OnboardingProgress {
  const steps: OnboardingStep[] = [
    {
      id: "profile",
      label: "Complete profile",
      done: input.profileComplete,
      href: input.profileComplete ? "/profile" : "/onboarding",
    },
    {
      id: "interests",
      label: "Set interest tags",
      done: input.hasSetInterests,
      href: "/profile",
    },
    {
      id: "verify",
      label: "Verify email address",
      done: input.hasVerifiedEmail,
      href: "/account/security",
    },
    {
      id: "engage",
      label: "Apply or save an item",
      done: input.hasApplicationOrSave,
      href: "/projects",
    },
    {
      id: "read",
      label: "Finish one guide (95%+)",
      done: input.hasReadGuide,
      href: input.continueGuideHref ?? "/guides",
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  return {
    steps,
    percent: Math.round((doneCount / steps.length) * 100),
    complete: doneCount === steps.length,
  };
}
