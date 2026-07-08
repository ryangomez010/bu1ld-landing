import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { isProjectLead } from "@/lib/projects";

export function RequireProjectLead({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground animate-pulse">
        Loading…
      </div>
    );
  }

  if (!isProjectLead(profile?.role)) {
    return (
      <div className="rounded-sm border border-border/60 p-8 text-center">
        <h2 className="font-display text-xl text-bone">Project lead access required</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
          Request project lead status to create and manage projects. Admins can approve requests in
          the admin panel.
        </p>
        <Link
          to="/lead/apply"
          className="mt-4 inline-block font-mono text-[10px] tracking-[0.25em] uppercase text-accent-blue hover:text-bone"
        >
          Request lead status →
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
