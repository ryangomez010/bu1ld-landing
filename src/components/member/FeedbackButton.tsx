import { MessageSquarePlus } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { submitFeedback, type FeedbackCategory } from "@/lib/member-feedback";

export function FeedbackButton({ className }: { className?: string }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<FeedbackCategory>("general");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!user) return null;

  const onSubmit = async () => {
    setSubmitting(true);
    const { error } = await submitFeedback(user.id, category, body);
    setSubmitting(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Sent to The Bu1ld team — view status in Your submissions.");
    setBody("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={`font-mono text-[9px] tracking-[0.15em] uppercase gap-1.5 ${className ?? ""}`}
        >
          <MessageSquarePlus className="h-3.5 w-3.5" />
          Feedback
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send feedback</DialogTitle>
          <DialogDescription>
            Bugs, feature requests, and content corrections go to admins. Include the page URL and
            steps to reproduce when reporting a bug.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as FeedbackCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bug">Bug</SelectItem>
                <SelectItem value="feature">Feature request</SelectItem>
                <SelectItem value="content">Content issue</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            placeholder="Page: /papers/attention-is-all-you-need. Expected: highlight saves. Actual: button does nothing on mobile Safari."
          />
        </div>
        <DialogFooter>
          <Button
            type="button"
            disabled={submitting || body.trim().length < 10}
            onClick={() => void onSubmit()}
          >
            {submitting ? "Sending…" : "Send feedback"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
