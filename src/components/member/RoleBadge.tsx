import type { MemberRole } from "@/lib/types";
import { cn } from "@/lib/utils";

const ROLE_STYLES: Record<MemberRole, string> = {
  member: "",
  project_lead: "text-accent-green border-accent-green/40 bg-accent-green/5",
  admin: "text-accent-red border-accent-red/40 bg-accent-red/5",
};

const ROLE_LABELS: Record<MemberRole, string> = {
  member: "",
  project_lead: "Project lead",
  admin: "Admin",
};

export function RoleBadge({ role, className }: { role: MemberRole; className?: string }) {
  if (role === "member") return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-mono text-[9px] tracking-[0.22em] uppercase px-2.5 py-1 border rounded-sm",
        ROLE_STYLES[role],
        className,
      )}
    >
      <span className="h-1 w-1 rounded-full bg-current" />
      {ROLE_LABELS[role]}
    </span>
  );
}
