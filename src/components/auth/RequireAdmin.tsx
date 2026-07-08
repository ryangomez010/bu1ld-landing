import { useAuth } from "@/lib/auth";

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground animate-pulse">
        Loading…
      </div>
    );
  }

  if (profile?.role !== "admin") {
    return (
      <div className="rounded-sm border border-accent-red/30 bg-accent-red/5 p-8 text-center">
        <h2 className="font-display text-xl text-bone">Admin access required</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Set <code className="font-mono text-xs">role = 'admin'</code> on your profile in Supabase
          to manage content.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
