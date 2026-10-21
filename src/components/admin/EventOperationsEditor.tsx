import { useState } from "react";
import { updateEventAdmin } from "@/lib/content";
import { parseEventOperations } from "@/lib/event-editor";
import type { MlEvent } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const fields = [
  ["organizer", "Owner / organizer"],
  ["timezone", "IANA timezone"],
  ["starts_at", "Confirmed start (ISO timestamp with offset)"],
  ["ends_at", "Confirmed end (ISO timestamp with offset)"],
  ["registration_opens_at", "Registration opens (timestamp with offset)"],
  ["registration_deadline", "Registration deadline (timestamp with offset)"],
  ["registration_url", "Canonical external registration URL"],
  ["contact_url", "Public contact page URL"],
  ["source_url", "Operational source URL"],
  ["price_details", "Price / Free"],
] as const;
export function EventOperationsEditor({ event, onSaved }: { event: MlEvent; onSaved: () => void }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  return (
    <details className="mt-4 border border-border p-3">
      <summary className="min-h-11 cursor-pointer">Schedule, registration and materials</summary>
      <form
        className="mt-4 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy) return;
          setBusy(true);
          setMessage("");
          setFailed(false);
          try {
            const patch = parseEventOperations(new FormData(e.currentTarget));
            const { error } = await updateEventAdmin(event.id, patch);
            if (error) throw new Error(error);
            setMessage("Event operations saved. Publication is controlled separately.");
            onSaved();
          } catch (reason) {
            setFailed(true);
            setMessage(reason instanceof Error ? reason.message : "Event could not be saved.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <p className="text-sm text-muted-foreground">
          Public details only. Never enter participant data or private meeting links. Missing
          verification keeps registration closed. Internal registration supports free events with a
          verified capacity.
        </p>
        <fieldset disabled={busy} className="space-y-4">
          {fields.map(([name, label]) => (
            <label key={name} className="block space-y-2">
              <span>{label}</span>
              <Input name={name} defaultValue={event[name] ?? ""} />
            </label>
          ))}
          {(
            [
              ["eligibility", "Eligibility and prerequisites"],
              ["format_details", "Format, venue and access rules"],
              ["agenda", "Agenda, deliverables and review criteria"],
            ] as const
          ).map(([name, label]) => (
            <label key={name} className="block space-y-2">
              <span>{label}</span>
              <Textarea name={name} defaultValue={event[name] ?? ""} rows={3} />
            </label>
          ))}
          <label className="block space-y-2">
            <span>Capacity (blank means unverified)</span>
            <Input
              name="capacity"
              type="number"
              min="0"
              step="1"
              defaultValue={event.capacity ?? ""}
            />
          </label>
          {(
            [
              [
                "operational_state",
                "Operational state",
                ["scheduled", "cancelled", "postponed"],
                "scheduled",
              ],
              [
                "registration_mode",
                "Registration destination",
                ["unavailable", "internal", "external"],
                "unavailable",
              ],
              [
                "registration_state",
                "Registration state",
                ["closed", "open", "waitlist"],
                "closed",
              ],
            ] as const
          ).map(([name, label, values, fallback]) => (
            <label key={name} className="block space-y-2">
              <span>{label}</span>
              <select
                name={name}
                defaultValue={event[name] ?? fallback}
                className="block min-h-11 w-full rounded-sm border border-border bg-background px-3"
              >
                {values.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <label className="flex min-h-11 items-center gap-3">
            <input
              name="waitlist_enabled"
              type="checkbox"
              defaultChecked={event.waitlist_enabled}
            />{" "}
            Allow a waitlist when capacity is reached
          </label>
          <label className="flex min-h-11 items-center gap-3">
            <input name="archived" type="checkbox" defaultChecked={event.archived} /> Archive this
            event and close registration
          </label>
          <label className="block space-y-2">
            <span>Verified public materials: one Label | HTTPS URL per line</span>
            <Textarea
              name="public_materials"
              defaultValue={(event.public_materials ?? [])
                .map((item) => `${item.label} | ${item.url}`)
                .join("\n")}
              rows={3}
            />
          </label>
          <label className="flex min-h-11 items-center gap-3">
            <input name="verified" type="checkbox" /> I checked these details against the organizer
            source today
          </label>
          <Button type="submit">{busy ? "Saving…" : "Save operations"}</Button>
        </fieldset>
        {message ? (
          <p
            role={failed ? "alert" : "status"}
            className={failed ? "text-accent-red" : "text-muted-foreground"}
          >
            {message}
          </p>
        ) : null}
      </form>
    </details>
  );
}
