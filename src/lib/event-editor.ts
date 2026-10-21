import { eventDate, publicHttpUrl } from "@/lib/event-state";
import type { MlEvent } from "@/lib/types";

export function parseEventOperations(data: FormData): Partial<MlEvent> {
  const text = (name: string) => String(data.get(name) ?? "").trim();
  const patch: Partial<MlEvent> = {};
  for (const name of [
    "organizer",
    "eligibility",
    "format_details",
    "price_details",
    "agenda",
    "timezone",
  ] as const)
    patch[name] = text(name) || null;
  if (patch.timezone) {
    try {
      new Intl.DateTimeFormat("en", { timeZone: patch.timezone }).format();
    } catch {
      throw new Error("Enter a valid IANA timezone, such as Asia/Kolkata.");
    }
  }
  for (const name of [
    "starts_at",
    "ends_at",
    "registration_opens_at",
    "registration_deadline",
  ] as const) {
    const value = text(name);
    if (value && (!value.includes("T") || eventDate(value) == null))
      throw new Error(
        "Enter timestamps with an explicit offset, such as 2026-11-01T18:00:00+05:30. Date-only deadlines need an explicit organizer cutoff.",
      );
    patch[name] = value ? new Date(value).toISOString() : null;
  }
  for (const name of ["registration_url", "contact_url", "source_url"] as const) {
    const value = text(name);
    if (value && !publicHttpUrl(value))
      throw new Error("Use HTTPS links without embedded credentials.");
    patch[name] = value || null;
  }
  const mode = text("registration_mode"),
    state = text("registration_state"),
    operations = text("operational_state");
  if (
    !["unavailable", "internal", "external"].includes(mode) ||
    !["open", "closed", "waitlist"].includes(state) ||
    !["scheduled", "cancelled", "postponed"].includes(operations)
  )
    throw new Error("Select valid event states.");
  patch.registration_mode = mode as MlEvent["registration_mode"];
  patch.operational_state = operations as MlEvent["operational_state"];
  patch.archived = data.has("archived");
  patch.registration_state =
    operations !== "scheduled" || patch.archived
      ? "closed"
      : (state as MlEvent["registration_state"]);
  patch.waitlist_enabled = data.has("waitlist_enabled");
  const capacity = text("capacity");
  if (capacity && (!/^\d+$/.test(capacity) || Number(capacity) > 2147483647))
    throw new Error("Capacity must be a nonnegative whole number.");
  patch.capacity = capacity ? Number(capacity) : null;
  patch.public_materials = text("public_materials")
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => {
      const separator = line.indexOf("|");
      const label = line.slice(0, separator).trim(),
        url = publicHttpUrl(line.slice(separator + 1).trim());
      if (separator < 1 || !label || !url)
        throw new Error("Each material needs Label | HTTPS URL.");
      return { label, url, kind: "other" as const };
    });
  // Every operational edit must be reverified before it can reopen registration.
  patch.verified_at = data.has("verified") ? new Date().toISOString() : null;
  if (!patch.verified_at) patch.registration_state = "closed";
  return patch;
}
