export type ApplicationOpportunityKind = "project" | "program";

/** Coarse funnel context only: never send applicant, opportunity or application identifiers. */
export function applicationAnalyticsProps(kind: ApplicationOpportunityKind) {
  return { opportunity_kind: kind, application_path: "internal" } as const;
}

const persistedId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Validate a returned INSERT/RPC receipt locally; none of its fields enter analytics. */
export function applicationReceiptMatches(
  receipt: unknown,
  kind: ApplicationOpportunityKind,
  expectedUserId: string,
  expectedOpportunityId: string,
): boolean {
  if (!receipt || typeof receipt !== "object" || Array.isArray(receipt)) return false;
  const row = receipt as Record<string, unknown>;
  return (
    persistedId.test(expectedUserId) &&
    persistedId.test(expectedOpportunityId) &&
    typeof row.id === "string" &&
    persistedId.test(row.id) &&
    row.user_id === expectedUserId &&
    row[`${kind}_id`] === expectedOpportunityId &&
    row.status === "pending" &&
    typeof row.created_at === "string" &&
    !Number.isNaN(Date.parse(row.created_at))
  );
}
