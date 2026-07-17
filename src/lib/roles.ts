import type { InstitutionalRole, MemberRole, Profile } from "@/lib/types";

/** Legacy profile.role values used by RLS admin checks. */
export function isLegacyAdmin(profile: Profile | null | undefined): boolean {
  return profile?.role === "admin";
}

/** Institutional administrator grant (member_roles) or legacy admin. */
export function isAdministrator(profile: Profile | null | undefined): boolean {
  if (!profile) return false;
  if (profile.role === "admin") return true;
  return (profile.institutional_roles ?? []).includes("administrator");
}

export function isProjectLead(profile: Profile | null | undefined): boolean {
  if (!profile) return false;
  if (profile.role === "project_lead" || profile.role === "admin") return true;
  return (profile.institutional_roles ?? []).some(
    (role) => role === "project_lead" || role === "lab_lead",
  );
}

export function isReviewer(profile: Profile | null | undefined): boolean {
  if (!profile) return false;
  if (profile.role === "admin") return true;
  return (profile.institutional_roles ?? []).includes("reviewer");
}

export function isMentor(profile: Profile | null | undefined): boolean {
  if (!profile) return false;
  return (
    profile.role === "admin" ||
    (profile.institutional_roles ?? []).includes("mentor") ||
    (profile.institutional_roles ?? []).includes("lab_lead")
  );
}

export function isLabLead(profile: Profile | null | undefined): boolean {
  if (!profile) return false;
  return profile.role === "admin" || (profile.institutional_roles ?? []).includes("lab_lead");
}

export function isStartupFounder(profile: Profile | null | undefined): boolean {
  if (!profile) return false;
  return (profile.institutional_roles ?? []).includes("startup_founder");
}

export function hasInstitutionalRole(
  profile: Profile | null | undefined,
  role: InstitutionalRole,
): boolean {
  if (!profile) return false;
  if (profile.role === "admin") return true;
  return (profile.institutional_roles ?? []).includes(role);
}

export function describeAccess(profile: Profile | null | undefined): {
  memberRole: MemberRole | "visitor";
  institutional: InstitutionalRole[];
  canAdmin: boolean;
  canLead: boolean;
  canReview: boolean;
} {
  if (!profile) {
    return {
      memberRole: "visitor",
      institutional: [],
      canAdmin: false,
      canLead: false,
      canReview: false,
    };
  }
  return {
    memberRole: profile.role,
    institutional: profile.institutional_roles ?? [],
    canAdmin: isAdministrator(profile),
    canLead: isProjectLead(profile),
    canReview: isReviewer(profile),
  };
}
