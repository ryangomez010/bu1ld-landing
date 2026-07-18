import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { approveLeadRequest, rejectLeadRequest } from "@/lib/projects";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { LeadVerificationRequest } from "@/lib/types";

export function AdminLeadsTab({
  requests,
  adminId,
  onSaved,
}: {
  requests: LeadVerificationRequest[];
  adminId: string;
  onSaved: () => void;
}) {
  const onApprove = async (req: LeadVerificationRequest) => {
    const { error } = await approveLeadRequest(req.id, req.user_id, adminId);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Lead approved.");
    onSaved();
  };

  const onReject = async (req: LeadVerificationRequest) => {
    const { error } = await rejectLeadRequest(req.id, adminId);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Request rejected.");
    onSaved();
  };

  if (!isSupabaseConfigured) {
    return (
      <p className="text-sm text-muted-foreground">
        Lead verification is temporarily unavailable. Try again shortly.
      </p>
    );
  }

  if (requests.length === 0) {
    return <p className="text-sm text-muted-foreground">No pending lead requests.</p>;
  }

  return (
    <div className="space-y-4">
      {requests.map((req) => (
        <div key={req.id} className="rounded-sm border border-border/60 bg-background/70 p-6">
          <h3 className="font-display text-lg text-bone">{req.applicant_name ?? "Member"}</h3>
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{req.message}</p>
          <div className="mt-4 flex gap-2">
            <Button
              size="sm"
              onClick={() => void onApprove(req)}
              className="font-mono text-[9px] tracking-[0.15em] uppercase"
            >
              Approve as project lead
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => void onReject(req)}
              className="font-mono text-[9px] tracking-[0.15em] uppercase text-accent-red"
            >
              Reject
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
