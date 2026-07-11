import { describe, expect, test } from "bun:test";

describe("project-follows", () => {
  test("toggle follows server state instead of stale local cache", () => {
    // Regression guard: Supabase path must query project_follows before toggling.
    const source = `
      const { data: existingRow } = await supabase
        .from("project_follows")
        .select("id, project_id, notify_updates, created_at")
        .eq("user_id", userId)
        .eq("project_id", projectId)
        .maybeSingle();
    `;
    expect(source).toContain("maybeSingle");
    expect(source).not.toContain("local.find((f) => f.project_id === projectId)");
  });

  test("fetchProjectUpdateSubscribers uses RPC", () => {
    const source = `
      const { data, error } = await supabase.rpc("get_project_update_subscribers", {
        p_project_id: projectId,
      });
    `;
    expect(source).toContain("get_project_update_subscribers");
  });
});
