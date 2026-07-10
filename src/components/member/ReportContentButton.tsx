import { Flag } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { submitContentReport, type ContentReportType } from "@/lib/content-reports";

export function ReportContentButton({
  contentType,
  contentSlug,
  label = "Report",
}: {
  contentType: ContentReportType;
  contentSlug: string;
  label?: string;
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!user) return null;

  const onSubmit = async () => {
    setSubmitting(true);
    const { error } = await submitContentReport(user.id, contentType, contentSlug, reason);
    setSubmitting(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Report submitted. Admins will review it.");
    setReason("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="font-mono text-[9px] tracking-[0.15em] uppercase gap-1.5 text-muted-foreground"
        >
          <Flag className="h-3.5 w-3.5" />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report content</DialogTitle>
          <DialogDescription>
            Flag inappropriate, inaccurate, or harmful content for admin review.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          placeholder="What's wrong with this content?"
        />
        <DialogFooter>
          <Button
            type="button"
            disabled={submitting || reason.trim().length < 5}
            onClick={() => void onSubmit()}
          >
            {submitting ? "Submitting…" : "Submit report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
