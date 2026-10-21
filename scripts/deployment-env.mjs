import { loadEnv } from "vite";

// Match Vite production precedence and expansion, including .env.local and mode files.
// Values stay in memory; callers must never log the complete environment.
export function loadDeploymentEnv(root, shell = process.env) {
  return { ...loadEnv("production", root, ""), ...shell };
}

export function publicSupabaseConfig(env) {
  return {
    url: env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL,
    key:
      env.VITE_SUPABASE_ANON_KEY ||
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  };
}

export function isPrivilegedKey(key) {
  if (!key) return false;
  if (key.startsWith("sb_secret_")) return true;
  try {
    const payload = JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString());
    return typeof payload.role === "string" && payload.role !== "anon";
  } catch {
    return false;
  }
}

export function publicConfigErrors(env, strict = false) {
  const { url, key } = publicSupabaseConfig(env);
  const errors = [];
  if (!url) errors.push("Set VITE_SUPABASE_URL.");
  else {
    try {
      const parsed = new URL(url);
      if (
        !["https:", "http:"].includes(parsed.protocol) ||
        parsed.username ||
        parsed.password ||
        (strict &&
          (parsed.protocol !== "https:" ||
            /^(localhost|127\.0\.0\.1|example\.|your-project\.)/.test(parsed.hostname)))
      ) {
        errors.push("Set a valid production HTTPS Supabase URL without embedded credentials.");
      }
    } catch {
      errors.push("Set a valid Supabase URL.");
    }
  }
  if (!key) errors.push("Set VITE_SUPABASE_ANON_KEY or VITE_SUPABASE_PUBLISHABLE_KEY.");
  if (strict && key && !key.startsWith("sb_publishable_") && key.split(".").length !== 3)
    errors.push("Replace the placeholder public key with a Supabase anon JWT or publishable key.");
  for (const [name, value] of Object.entries(env)) {
    if (
      /^(VITE_|NEXT_PUBLIC_)/.test(name) &&
      value &&
      (/(SECRET|SERVICE_ROLE|RESEND_API_KEY|DB_PASSWORD)/.test(name) || isPrivilegedKey(value))
    )
      errors.push(`Remove privileged client configuration from ${name}.`);
  }
  return errors;
}

export function databaseConnection(env) {
  if (env.SUPABASE_DB_URL) {
    const parsed = new URL(env.SUPABASE_DB_URL);
    if (!["postgres:", "postgresql:"].includes(parsed.protocol))
      throw new Error("SUPABASE_DB_URL must be a Postgres connection URL.");
    return env.SUPABASE_DB_URL;
  }
  if (!env.SUPABASE_DB_PASSWORD || !/^[a-z0-9]+$/.test(env.SUPABASE_PROJECT_REF || "")) return null;
  // Pooler regions vary. Use an explicit dashboard connection URL for pooling/IPv4.
  return `postgresql://postgres:${encodeURIComponent(env.SUPABASE_DB_PASSWORD)}@db.${env.SUPABASE_PROJECT_REF}.supabase.co:5432/postgres`;
}

export function databaseIdentityErrors(env) {
  const { url } = publicSupabaseConfig(env);
  const expected = url && new URL(url).hostname.match(/^([a-z0-9]+)\.supabase\.co$/)?.[1];
  const connection = databaseConnection(env);
  if (!connection) return ["Configure the database connection for the public Supabase project."];
  const db = new URL(connection);
  const direct = db.hostname.match(/^db\.([a-z0-9]+)\.supabase\.co$/)?.[1];
  const pooled = db.hostname.endsWith(".pooler.supabase.com")
    ? decodeURIComponent(db.username).match(/^postgres\.([a-z0-9]+)$/)?.[1]
    : undefined;
  if (!expected || expected !== (direct || pooled))
    return [
      "The database connection must identify the same Supabase project as VITE_SUPABASE_URL. Use its dashboard direct or pooler URL.",
    ];
  if (env.SUPABASE_PROJECT_REF && env.SUPABASE_PROJECT_REF !== expected)
    return ["SUPABASE_PROJECT_REF differs from the public Supabase project."];
  return [];
}
