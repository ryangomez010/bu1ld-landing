import {
  APPLICATION_STATUS_LABEL,
  PROJECT_STATUS_LABEL,
  PROJECT_TYPE_LABEL,
} from "@/data/seed/projects";
import { cn } from "@/lib/utils";

export function ProjectTypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    research: "text-accent-blue border-accent-blue/40",
    startup: "text-accent-red border-accent-red/40",
    program: "text-accent-green border-accent-green/40",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 label-xs px-2.5 py-1 border rounded-sm",
        colors[type] ?? "text-bone border-bone/30",
      )}
    >
      <span className="h-1 w-1 rounded-full bg-current" />
      {PROJECT_TYPE_LABEL[type] ?? type}
    </span>
  );
}

export function ProjectStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    open: "text-accent-green border-accent-green/40",
    active: "text-accent-blue border-accent-blue/40",
    closed: "text-muted-foreground border-border/60",
  };
  return (
    <span className={cn("label-xs px-2.5 py-1 border rounded-sm", colors[status] ?? "")}>
      {PROJECT_STATUS_LABEL[status] ?? status}
    </span>
  );
}

export function ApplicationStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "text-bone border-bone/30",
    accepted: "text-accent-green border-accent-green/40",
    declined: "text-accent-red border-accent-red/40",
    waitlist: "text-accent-blue border-accent-blue/40",
  };
  return (
    <span className={cn("label-xs px-2.5 py-1 border rounded-sm", colors[status] ?? "")}>
      {APPLICATION_STATUS_LABEL[status] ?? status}
    </span>
  );
}

export function JobSourceBadge({ source }: { source: string }) {
  return (
    <span
      className={cn(
        "label-xs px-2.5 py-1 border rounded-sm",
        source === "internal"
          ? "text-accent-green border-accent-green/40"
          : "text-muted-foreground border-border/60",
      )}
    >
      {source === "internal" ? "Internal" : "External"}
    </span>
  );
}
