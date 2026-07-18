import { formatDate } from "@/lib/date";
import type { AuditEntry } from "@/lib/audit-log";
import { isSupabaseConfigured } from "@/lib/supabase";

export function AdminAuditTab({ entries }: { entries: AuditEntry[] }) {
  if (!isSupabaseConfigured) {
    return (
      <p className="text-sm text-muted-foreground">
        The audit log is temporarily unavailable. Try again shortly.
      </p>
    );
  }

  if (!entries.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No admin actions logged yet. Role changes and content publishes will appear here.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-sm border border-border/60">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/60 text-left font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground">
            <th className="p-3">When</th>
            <th className="p-3">Action</th>
            <th className="p-3">Target</th>
            <th className="p-3">Detail</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.id} className="border-b border-border/40 last:border-0 admin-row-hover">
              <td className="p-3 text-muted-foreground whitespace-nowrap">
                {formatDate(e.created_at)}
              </td>
              <td className="p-3 font-mono text-[10px] uppercase text-bone">{e.action}</td>
              <td className="p-3 text-muted-foreground">
                {e.target_type
                  ? `${e.target_type}${e.target_id ? ` · ${e.target_id.slice(0, 8)}…` : ""}`
                  : "—"}
              </td>
              <td className="p-3 text-muted-foreground max-w-md truncate">
                {e.detail ? JSON.stringify(e.detail) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
