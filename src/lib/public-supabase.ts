import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readPublicRuntimeEnv, type PublicRuntimeEnv } from "@/lib/public-env";
import type { Database } from "@/lib/supabase";

// Public loaders never inherit a visitor's session, service role or private data.
// The same anonymous projection can run during SSR and client navigation.
let client: SupabaseClient<Database> | null = null;
let clientConfig: string | null = null;

export function getPublicSupabase(): SupabaseClient<Database> | null {
  const read = (key: keyof PublicRuntimeEnv) => {
    const runtime = readPublicRuntimeEnv(key);
    const build = import.meta.env?.[key];
    return runtime ?? (typeof build === "string" && build.trim() ? build.trim() : undefined);
  };
  const url = read("VITE_SUPABASE_URL") ?? read("NEXT_PUBLIC_SUPABASE_URL");
  const key =
    read("VITE_SUPABASE_PUBLISHABLE_KEY") ??
    read("VITE_SUPABASE_ANON_KEY") ??
    read("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") ??
    read("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!url || !key) return null;
  const config = `${url}|${key}`;
  if (!client || clientConfig !== config) {
    client = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    clientConfig = config;
  }
  return client;
}
