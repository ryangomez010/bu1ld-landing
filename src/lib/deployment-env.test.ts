import { describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  databaseConnection,
  loadDeploymentEnv,
  publicSupabaseConfig,
  databaseIdentityErrors,
  publicConfigErrors,
} from "../../scripts/deployment-env.mjs";

describe("deployment configuration boundaries", () => {
  test("matches Vite mode/local precedence and expansion before validating public values", () => {
    const dir = mkdtempSync(join(tmpdir(), "bu1ld-env-"));
    try {
      writeFileSync(join(dir, ".env"), "BU1LD_TEST_BASE=file\nBU1LD_TEST_KEEP=retained\n");
      writeFileSync(join(dir, ".env.local"), "BU1LD_TEST_BASE=local\n");
      writeFileSync(join(dir, ".env.production"), "BU1LD_TEST_BASE=production\n");
      writeFileSync(
        join(dir, ".env.production.local"),
        "BU1LD_TEST_BASE=last\nBU1LD_TEST_PRIVATE_KEY=sb_secret_hidden\nVITE_BU1LD_TEST_VALUE=${BU1LD_TEST_PRIVATE_KEY}\n",
      );
      const loaded = loadDeploymentEnv(dir, { BU1LD_TEST_KEEP: "ci" });
      expect(loaded.BU1LD_TEST_BASE).toBe("last");
      expect(loaded.BU1LD_TEST_KEEP).toBe("ci");
      expect(loaded.VITE_BU1LD_TEST_VALUE).toBe("sb_secret_hidden");
      expect(publicConfigErrors(loaded).some((error: string) => error.includes("privileged"))).toBe(
        true,
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
  test("uses the same nonempty key precedence as the client and runtime payload", () => {
    expect(
      publicSupabaseConfig({
        VITE_SUPABASE_ANON_KEY: "",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "legacy",
        VITE_SUPABASE_PUBLISHABLE_KEY: "new",
      }).key,
    ).toBe("legacy");
    expect(
      publicSupabaseConfig({ VITE_SUPABASE_ANON_KEY: "", VITE_SUPABASE_PUBLISHABLE_KEY: "new" })
        .key,
    ).toBe("new");
  });
  test("binds production schema verification to the application's Supabase project", () => {
    const env = {
      VITE_SUPABASE_URL: "https://projectref.supabase.co",
      SUPABASE_DB_URL: "postgresql://postgres:private@db.projectref.supabase.co:5432/postgres",
    };
    expect(databaseIdentityErrors(env)).toEqual([]);
    expect(
      databaseIdentityErrors({
        ...env,
        SUPABASE_DB_URL:
          "postgresql://postgres.projectref:private@aws-0-region.pooler.supabase.com:6543/postgres",
      }),
    ).toEqual([]);
    expect(
      databaseIdentityErrors({
        ...env,
        SUPABASE_DB_URL: "postgresql://postgres:private@db.wrongproject.supabase.co:5432/postgres",
      }),
    ).not.toEqual([]);
    expect(databaseIdentityErrors({ ...env, SUPABASE_PROJECT_REF: "wrongproject" })).not.toEqual(
      [],
    );
  });
  test("rejects privileged keys in public slots before build", () => {
    const env = {
      VITE_SUPABASE_URL: "https://project.supabase.co",
      VITE_SUPABASE_ANON_KEY: "sb_publishable_public",
    };
    expect(publicConfigErrors(env, true)).toEqual([]);
    for (const key of [
      "sb_secret_private",
      `header.${Buffer.from(JSON.stringify({ role: "service_role" })).toString("base64url")}.sig`,
    ]) {
      expect(
        publicConfigErrors({ ...env, VITE_SUPABASE_ANON_KEY: key }).some((error: string) =>
          error.includes("privileged"),
        ),
      ).toBe(true);
    }
    expect(publicConfigErrors({ ...env, VITE_RESEND_API_KEY: "private" })).not.toEqual([]);
    expect(publicConfigErrors({ ...env, VITE_EMAIL_API_SECRET: "private" })).not.toEqual([]);
    expect(
      publicConfigErrors({ ...env, VITE_SUPABASE_ANON_KEY: "ci-placeholder" }, true),
    ).not.toEqual([]);
    expect(
      publicConfigErrors({
        ...env,
        VITE_SUPABASE_URL: "https://user:password@project.supabase.co",
      }),
    ).not.toEqual([]);
  });
  test("client email delivery never reads public-prefixed secrets", () => {
    const client = readFileSync("src/lib/email.ts", "utf8");
    expect(client).not.toContain("VITE_RESEND_API_KEY");
    expect(client).not.toContain("VITE_EMAIL_API_SECRET");
    expect(client).not.toContain("api.resend.com");

    const releaseGate = readFileSync("scripts/release-readiness.mjs", "utf8");
    expect(releaseGate).toContain('"VITE_RESEND_API_KEY"');
    expect(releaseGate).toContain('"VITE_EMAIL_API_SECRET"');
  });
  test("requires complete DB settings and never guesses a pooler region", () => {
    expect(databaseConnection({ SUPABASE_DB_PASSWORD: "private" })).toBeNull();
    const connection = databaseConnection({
      SUPABASE_DB_PASSWORD: "p@ss:/#",
      SUPABASE_PROJECT_REF: "projectref",
    });
    expect(new URL(connection).hostname).toBe("db.projectref.supabase.co");
    expect(decodeURIComponent(new URL(connection).password)).toBe("p@ss:/#");
    expect(databaseConnection({ SUPABASE_DB_URL: "postgresql://provided.example/db" })).toBe(
      "postgresql://provided.example/db",
    );
    expect(() => databaseConnection({ SUPABASE_DB_URL: "https://wrong.example" })).toThrow();
  });
  test("catalog verification covers every intended RLS table", () => {
    const setup = readFileSync("supabase/FINAL_SETUP.sql", "utf8");
    const verify = readFileSync("supabase/VERIFY_SETUP.sql", "utf8");
    const rls = verify.split("required_rls(table_name) as (")[1].split("rls_status as (")[0];
    for (const match of setup.matchAll(/alter table public\.(\w+) enable row level security/g))
      expect(rls).toContain(`('${match[1]}')`);
    expect(verify).toContain("c.relnamespace = n.oid");
    expect(verify).not.toContain("where c.oid is null or n.nspname");
  });
});
