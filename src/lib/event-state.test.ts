import { describe, expect, test } from "bun:test";
import { eventDate, eventState, eventRegistrationState } from "./event-state";
import { buildIcsEvent } from "./calendar";
import { closeExpiredCohort } from "./participation-state";

const now = Date.parse("2026-10-16T12:00:00Z");
const scheduled = { start_date: "2026-10-16T11:00:00Z", end_date: "2026-10-16T13:00:00Z" };
describe("event schedule and registration boundaries", () => {
  test("missing dates never mean upcoming or indefinitely live", () => {
    expect(eventState({ start_date: null, end_date: null }, now)).toBe("unconfirmed");
    expect(eventState({ ...scheduled, end_date: null }, now)).toBe("unconfirmed");
    expect(eventState(scheduled, now)).toBe("ongoing");
    expect(eventState(scheduled, Date.parse(scheduled.end_date))).toBe("completed");
    expect(eventState(scheduled, Date.parse("2026-10-15T12:00:00Z"))).toBe("upcoming");
  });
  test("cancellation and postponement override the clock", () => {
    for (const status of ["cancelled", "postponed"] as const) {
      expect(eventState({ ...scheduled, operational_state: status }, now)).toBe(status);
      expect(
        eventRegistrationState(
          {
            ...scheduled,
            operational_state: status,
            registration_state: "open",
            verified_at: "2026-10-15",
          },
          now,
        ),
      ).toBe("closed");
    }
  });
  test("offsets and registration deadlines fail closed", () => {
    expect(eventDate("2026-02-30")).toBeNull();
    expect(eventDate("2026-10-16T12:00:00")).toBeNull();
    expect(eventDate("2026-10-16T17:30:00+05:30")).toBe(now);
    expect(eventRegistrationState(scheduled, now)).toBe("unconfirmed");
    expect(
      eventRegistrationState(
        {
          ...scheduled,
          registration_state: "open",
          verified_at: "2026-10-15",
          registration_deadline: "2026-10-16T17:30:00+05:30",
        },
        now,
      ),
    ).toBe("closed");
    expect(
      eventRegistrationState(
        {
          ...scheduled,
          registration_state: "open",
          verified_at: "2026-10-15",
          registration_deadline: "2026-10-16",
        },
        now,
      ),
    ).toBe("unconfirmed");
  });
  test("ICS preserves calendar days, stable identity and safe text", () => {
    const input = {
      id: "test",
      title: "Test, event; line\nEND:VEVENT",
      startDate: "2026-10-16",
      endDate: "2026-10-17",
    };
    const ics = buildIcsEvent(input);
    expect(ics).toBe(buildIcsEvent(input));
    expect(ics).toContain("UID:test@thebu1ld.com");
    expect(ics).toContain("DTSTART;VALUE=DATE:20261016");
    expect(ics).toContain("DTEND;VALUE=DATE:20261018");
    expect(ics).toContain("SUMMARY:Test\\, event\\; line\\nEND:VEVENT");
    expect(() => buildIcsEvent({ title: "bad", startDate: "2026-10-16T12:00:00" })).toThrow();
  });
  test("Q2 2026 cohort is archived without a fabricated successor", () => {
    const record = {
      slug: "ai-builder-cohort-q2",
      status: "open" as const,
      description: "Rolling admission",
    };
    expect(closeExpiredCohort(record, now).status).toBe("closed");
    expect(closeExpiredCohort(record, Date.parse("2026-06-01")).status).toBe("open");
    expect(record.status).toBe("open");
    expect(closeExpiredCohort({ ...record, slug: "another-cohort" }, now)).toEqual({
      ...record,
      slug: "another-cohort",
    });
  });
});
