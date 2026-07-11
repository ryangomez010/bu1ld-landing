import { describe, expect, test } from "bun:test";

import { groupNotificationsByDay, notificationCategory } from "./notifications";
import { shouldUseNotifyUsersRpc } from "./auth-guards";

describe("notifications", () => {
  test("notificationCategory classifies application updates", () => {
    const n = {
      id: "1",
      user_id: "u",
      title: "Application accepted",
      body: "Your waitlist status changed",
      href: "/applications",
      read: false,
      created_at: new Date().toISOString(),
    };
    expect(notificationCategory(n)).toBe("application");
  });

  test("notificationCategory classifies lead messages", () => {
    const n = {
      id: "2",
      user_id: "u",
      title: "Project lead approved",
      body: "You are now a project lead",
      href: "/projects/manage",
      read: false,
      created_at: new Date().toISOString(),
    };
    expect(notificationCategory(n)).toBe("lead");
  });

  test("groupNotificationsByDay buckets today", () => {
    const now = new Date().toISOString();
    const groups = groupNotificationsByDay([
      {
        id: "1",
        user_id: "u",
        title: "Hi",
        body: "Body",
        href: null,
        read: false,
        created_at: now,
      },
    ]);
    expect(groups[0]?.label).toBe("Today");
  });

  test("cross-user inserts use notify_users RPC", () => {
    expect(shouldUseNotifyUsersRpc("lead-id", "member-id")).toBe(true);
  });
});
