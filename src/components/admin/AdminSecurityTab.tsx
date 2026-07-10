import { formatDate } from "@/lib/date";
import type { SecurityEvent } from "@/lib/account-security";
import { isSupabaseConfigured } from "@/lib/supabase";

export function AdminSecurityTab({ events }: { events: SecurityEvent[] }) {
  if (!isSupabaseConfigured) {
    return (
      <p className="text-sm text-muted-foreground">
        Security events require Supabase. Run <code className="font-mono text-xs">phase13.sql</code>{" "}
        on your project.
      </p>
    );
  }

  const deletions = events.filter((e) => e.event_type.includes("deletion")).length;
  const recent = events.slice(0, 20);

  return (
    <div className="space-y-6">
      <div className="grid gap-px border border-border/40 bg-border/40 sm:grid-cols-3">
        <div className="bg-background/75 p-4">
          <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground">
            Events (recent)
          </p>
          <p className="mt-2 font-display text-2xl text-bone">{events.length}</p>
        </div>
        <div className="bg-background/75 p-4">
          <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground">
            Deletion requests
          </p>
          <p className="mt-2 font-display text-2xl text-bone">{deletions}</p>
        </div>
        <div className="bg-background/75 p-4">
          <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground">
            Tip
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Auth user removal still requires Supabase dashboard or service role.
          </p>
        </div>
      </div>

      {recent.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No security events yet. Password changes, global sign-outs, and account deletions will
          appear here.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-sm border border-border/60">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground">
                <th className="p-3">When</th>
                <th className="p-3">Event</th>
                <th className="p-3">User</th>
                <th className="p-3">Detail</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((e) => (
                <tr key={e.id} className="border-b border-border/40 last:border-0 admin-row-hover">
                  <td className="p-3 text-muted-foreground whitespace-nowrap">
                    {formatDate(e.created_at)}
                  </td>
                  <td className="p-3 font-mono text-[10px] uppercase text-bone">{e.event_type}</td>
                  <td className="p-3 text-muted-foreground font-mono text-[10px]">
                    {e.user_id ? `${e.user_id.slice(0, 8)}…` : "—"}
                  </td>
                  <td className="p-3 text-muted-foreground max-w-md truncate">
                    {e.detail ? JSON.stringify(e.detail) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
