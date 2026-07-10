import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { RequireMember } from "@/components/auth/RequireAuth";
import { MemberLayout } from "@/components/member/MemberLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { hasPendingLeadRequest, isProjectLead, submitLeadRequest } from "@/lib/projects";

export const Route = createFileRoute("/lead/apply")({
  component: LeadApplyPage,
});

function LeadApplyPage() {
  return (
    <RequireMember>
      <LeadApplyForm />
    </RequireMember>
  );
}

function LeadApplyForm() {
  const { user, profile } = useAuth();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!user) return;
    void hasPendingLeadRequest(user.id).then((p) => {
      setPending(p);
      setChecked(true);
    });
  }, [user]);

  if (isProjectLead(profile?.role)) {
    return (
      <MemberLayout title="Project lead" eyebrow="verified">
        <p className="text-muted-foreground -mt-4">
          You are a verified project lead.{" "}
          <Link to="/projects/new" className="text-accent-blue hover:text-bone">
            Create a project →
          </Link>
        </p>
      </MemberLayout>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    const { error } = await submitLeadRequest(user.id, message);
    setSubmitting(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Request submitted. An admin will review it.");
    setPending(true);
  };

  return (
    <MemberLayout title="Become a project lead" eyebrow="verification">
      <p className="text-muted-foreground mb-8 max-w-xl leading-relaxed -mt-4">
        Project leads can create projects, review applications, and build teams. Tell us what you
        have shipped or researched and why you want to lead a BUILD thread.
      </p>

      {!checked ? (
        <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground animate-pulse">
          Loading…
        </p>
      ) : pending ? (
        <div className="rounded-sm border border-accent-blue/30 bg-accent-blue/5 p-6">
          <p className="text-bone font-display text-lg">Request pending</p>
          <p className="mt-2 text-sm text-muted-foreground">
            An admin will review your request. You will be able to create projects once approved.
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="max-w-xl space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message">Why should you be a project lead?</Label>
            <Textarea
              id="message"
              required
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Past projects, research, startups, or threads you want to run..."
            />
          </div>
          <Button
            type="submit"
            disabled={submitting}
            className="font-mono text-[10px] tracking-[0.2em] uppercase"
          >
            {submitting ? "Submitting…" : "Submit request"}
          </Button>
        </form>
      )}
    </MemberLayout>
  );
}
