import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { RequireMember } from "@/components/auth/RequireAuth";
import { ListSkeleton } from "@/components/member/LoadingState";
import { MemberLayout } from "@/components/member/MemberLayout";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { logSecurityEvent } from "@/lib/account-security";
import {
  CONTENT_DENSITY_LABELS,
  DIGEST_FREQUENCY_LABELS,
  fetchMemberPreferences,
  updateMemberPreferences,
} from "@/lib/member-preferences";
import type { ContentDensity, EmailDigestFrequency } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/account/preferences")({
  component: PreferencesPage,
  head: () => ({
    meta: [{ title: "Preferences — The Bu1ld" }],
  }),
});

function PreferencesPage() {
  return (
    <RequireMember>
      <PreferencesContent />
    </RequireMember>
  );
}

function PreferencesContent() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [density, setDensity] = useState<ContentDensity>("comfortable");
  const [digest, setDigest] = useState<EmailDigestFrequency>("weekly");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    void fetchMemberPreferences(user.id).then((prefs) => {
      setDensity(prefs.content_density);
      setDigest(prefs.email_digest_frequency);
      setLoading(false);
    });
  }, [user]);

  const onDensity = async (value: ContentDensity) => {
    if (!user) return;
    setDensity(value);
    setSaving(true);
    const { error } = await updateMemberPreferences(user.id, { content_density: value });
    setSaving(false);
    if (error) toast.error(error);
    else {
      await logSecurityEvent(user.id, "preference_updated", { field: "content_density", value });
      toast.success("Display density updated");
    }
  };

  const onDigest = async (value: EmailDigestFrequency) => {
    if (!user) return;
    setDigest(value);
    setSaving(true);
    const { error } = await updateMemberPreferences(user.id, {
      email_digest_frequency: value,
    });
    setSaving(false);
    if (error) toast.error(error);
    else {
      await logSecurityEvent(user.id, "preference_updated", {
        field: "email_digest_frequency",
        value,
      });
      toast.success("Digest frequency updated");
    }
  };

  return (
    <MemberLayout title="Preferences" eyebrow="your experience">
      <p className="text-sm text-muted-foreground mb-8 max-w-xl -mt-4 leading-relaxed">
        Customize how BUILD looks and how often we reach you. Notification categories are managed
        separately in{" "}
        <Link to="/account/notifications" className="text-accent-blue hover:text-bone">
          notification settings
        </Link>
        .
      </p>

      {loading ? (
        <ListSkeleton rows={3} />
      ) : (
        <div className="max-w-xl space-y-8">
          <section className="space-y-4">
            <div>
              <h2 className="font-display text-xl text-bone">Content density</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Controls spacing across the member hub — applies immediately on save.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {(Object.keys(CONTENT_DENSITY_LABELS) as ContentDensity[]).map((key) => {
                const meta = CONTENT_DENSITY_LABELS[key];
                const active = density === key;
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={saving}
                    onClick={() => void onDensity(key)}
                    className={cn(
                      "rounded-xl border p-4 text-left transition panel-interactive",
                      active
                        ? "border-accent-blue/40 bg-accent-blue/10"
                        : "border-border/50 bg-background/60 hover:border-bone/20",
                    )}
                  >
                    <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-bone">
                      {meta.label}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                      {meta.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="font-display text-xl text-bone">Email digest</h2>
              <p className="text-sm text-muted-foreground mt-1">
                How often we send a summary of papers, events, and project activity to your inbox.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="digest-frequency" className="sr-only">
                Digest frequency
              </Label>
              <Select
                value={digest}
                onValueChange={(v) => void onDigest(v as EmailDigestFrequency)}
                disabled={saving}
              >
                <SelectTrigger id="digest-frequency" className="max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(DIGEST_FREQUENCY_LABELS) as EmailDigestFrequency[]).map((key) => (
                    <SelectItem key={key} value={key}>
                      {DIGEST_FREQUENCY_LABELS[key].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {DIGEST_FREQUENCY_LABELS[digest].description}
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-border/50 bg-background/60 p-5">
            <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground">
              Weekly paper goal
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Set your reading target on your{" "}
              <Link to="/profile" className="text-accent-blue hover:text-bone">
                profile page
              </Link>{" "}
              — it powers the streak widget and your week summary.
            </p>
          </section>
        </div>
      )}
    </MemberLayout>
  );
}
