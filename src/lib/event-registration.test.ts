import { describe, expect, test } from "bun:test";
import { parseEventOperations } from "./event-editor";
import { eventDate, eventRegistrationState, eventState } from "./event-state";

function form(values: Record<string, string> = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries({
    registration_mode: "internal",
    registration_state: "open",
    operational_state: "scheduled",
    ...values,
  }))
    data.set(key, value);
  return data;
}
describe("event operational editing", () => {
  test("closing, cancellation and missing verification cannot leave intake open", () => {
    expect(parseEventOperations(form()).registration_state).toBe("closed");
    for (const operational_state of ["cancelled", "postponed"]) {
      expect(
        parseEventOperations(form({ operational_state, verified: "on" })).registration_state,
      ).toBe("closed");
    }
    expect(parseEventOperations(form({ archived: "on", verified: "on" })).registration_state).toBe(
      "closed",
    );
  });
  test("instants preserve organizer offsets and reject ambiguous or impossible dates", () => {
    expect(parseEventOperations(form({ starts_at: "2026-11-01T18:00:00+05:30" })).starts_at).toBe(
      "2026-11-01T12:30:00.000Z",
    );
    for (const starts_at of [
      "2026-11-01",
      "2026-11-01T18:00:00",
      "2026-02-30T18:00:00Z",
      "2026-10-01T24:00:00Z",
    ])
      expect(() => parseEventOperations(form({ starts_at }))).toThrow();
    expect(() => parseEventOperations(form({ timezone: "Not/AZone" }))).toThrow();
    expect(eventDate("2026-02-29T01:00:00Z")).toBeNull();
  });
  test("public links and capacity reject unsafe values", () => {
    for (const registration_url of ["javascript:alert(1)", "https://secret:password@example.com"])
      expect(() => parseEventOperations(form({ registration_url }))).toThrow();
    for (const capacity of ["-1", "0.5", "Infinity", "2147483648"])
      expect(() => parseEventOperations(form({ capacity }))).toThrow();
    expect(parseEventOperations(form({ capacity: "0" })).capacity).toBe(0);
    expect(() =>
      parseEventOperations(form({ public_materials: "Slides | javascript:alert(1)" })),
    ).toThrow();
    expect(
      parseEventOperations(form({ public_materials: "Slides | https://example.com/slides" }))
        .public_materials,
    ).toEqual([{ label: "Slides", url: "https://example.com/slides", kind: "other" }]);
  });
  test("verified instants override historical dates and cutoff is exclusive", () => {
    const ev = {
      start_date: "2026-01-01",
      end_date: "2026-01-02",
      starts_at: "2026-11-01T18:00:00+05:30",
      ends_at: "2026-11-01T20:00:00+05:30",
      registration_opens_at: "2026-10-16T18:00:00+05:30",
      registration_deadline: "2026-10-31T18:00:00+05:30",
      verified_at: "2026-10-16T00:00:00Z",
      registration_state: "open" as const,
    };
    expect(eventState(ev, Date.parse("2026-10-16T00:00:00Z"))).toBe("upcoming");
    expect(eventRegistrationState(ev, Date.parse(ev.registration_opens_at) - 1)).toBe("closed");
    expect(eventRegistrationState(ev, Date.parse(ev.registration_opens_at))).toBe("open");
    expect(eventRegistrationState(ev, Date.parse(ev.registration_deadline))).toBe("closed");
    expect(
      eventRegistrationState({ ...ev, archived: true }, Date.parse(ev.registration_opens_at)),
    ).toBe("closed");
  });
});

test("registration requires a durable valid response and preserves retry identity without exposing database errors", () => {
  const result = Bun.spawnSync(
    [
      process.execPath,
      "--eval",
      `
    import { mock } from "bun:test";
    let response = { data: "confirmed", error: null };
    const calls = [];
    const client = { rpc(name, args) { calls.push({ name, args }); return { abortSignal() { return Promise.resolve(response); } }; }, from() { throw new Error("Direct write attempted"); } };
    mock.module("./src/lib/supabase", () => ({ getSupabase: () => client }));
    const { setEventRegistration } = await import("./src/lib/event-rsvp");
    const saved = await setEventRegistration("event", "register", "stable-id");
    const repeated = await setEventRegistration("event", "register", "stable-id");
    const failures = [];
    for (const next of [{ data: null, error: null }, { data: "garbage", error: null }, { data: null, error: { message: "private database detail" } }, { data: null, error: { message: "This event is full." } }]) {
      response = next;
      try { await setEventRegistration("event", "register", "stable-id"); failures.push("unexpected success"); }
      catch (e) { failures.push(e.message); }
    }
    console.log(JSON.stringify({ saved, repeated, calls, failures }));
  `,
    ],
    { cwd: process.cwd(), timeout: 15000 },
  );
  expect(result.exitCode).toBe(0);
  const output = JSON.parse(result.stdout.toString());
  expect(output.saved).toBe("confirmed");
  expect(output.repeated).toBe("confirmed");
  expect(output.calls).toHaveLength(6);
  for (const call of output.calls)
    expect(call).toEqual({
      name: "set_event_registration",
      args: { p_event_id: "event", p_action: "register", p_request_id: "stable-id" },
    });
  for (const message of output.failures) {
    expect(message).not.toBe("unexpected success");
    expect(message).not.toContain("private database detail");
  }
  expect(output.failures[3]).toBe("This event is full.");
});
