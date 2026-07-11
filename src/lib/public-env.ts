/** Public runtime config injected by /runtime-env.js on Cloudflare and other hosts. */
export type PublicRuntimeEnv = {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
};

declare global {
  interface Window {
    __BU1LD_PUBLIC_ENV__?: PublicRuntimeEnv;
  }
}

export function readPublicRuntimeEnv(key: keyof PublicRuntimeEnv): string | undefined {
  if (typeof window !== "undefined") {
    const runtime = window.__BU1LD_PUBLIC_ENV__;
    const value = runtime?.[key];
    if (typeof value === "string" && value.length > 0) return value;
  }
  return undefined;
}
