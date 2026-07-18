import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { RequireMember } from "@/components/auth/RequireAuth";
import { MemberLayout } from "@/components/member/MemberLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { clearLeadDraft, loadLeadDraft, saveLeadDraft } from "@/lib/lead-draft";
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
    setMessage(loadLeadDraft(user.id));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const t = window.setTimeout(() => saveLeadDraft(user.id, message), 500);
    return () => window.clearTimeout(t);
  }, [message, user]);

  if (isProjectLead(profile?.role, profile?.institutional_roles)) {
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
    if (user) clearLeadDraft(user.id);
    setPending(true);
  };

  return (
    <MemberLayout title="Become a project lead" eyebrow="verification">
      <p className="text-muted-foreground mb-8 max-w-xl leading-relaxed -mt-4">
        Verified project leads can create open listings, set team capacity, review application
        queues with full applicant profiles attached, post milestone updates, and approve or decline
        pitches with optional notes. Admins review lead requests before granting access.
      </p>

      {!checked ? (
        <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground animate-pulse">
          Loading…
        </p>
      ) : pending ? (
        <div className="rounded-sm border border-accent-blue/30 bg-accent-blue/5 p-6">
          <p className="text-bone font-display text-lg">Request pending</p>
          <p className="mt-2 text-sm text-muted-foreground">
            An admin will read your request and email you when approved or declined. Until then you
            can still apply to open projects as a member.
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
              placeholder="List shipped repos, papers, or startups. Name the research thread you want to run, team size you expect, and how you would review applications."
            />
            <p className="text-xs text-muted-foreground">Draft autosaved locally as you type.</p>
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
