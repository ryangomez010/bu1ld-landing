import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { RequireMember } from "@/components/auth/RequireAuth";
import { MemberLayout } from "@/components/member/MemberLayout";
import { ListSkeleton } from "@/components/member/LoadingState";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/lib/auth";
import {
  fetchNotificationPreferences,
  NOTIFICATION_PREF_LABELS,
  updateNotificationPreference,
  type NotificationPrefKey,
  type NotificationPreference,
} from "@/lib/notification-preferences";

export const Route = createFileRoute("/account/notifications")({
  component: NotificationPrefsPage,
  head: () => ({
    meta: [{ title: "Notification preferences — The Bu1ld" }],
  }),
});

function NotificationPrefsPage() {
  return (
    <RequireMember>
      <NotificationPrefsContent />
    </RequireMember>
  );
}

function NotificationPrefsContent() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<NotificationPreference[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    void fetchNotificationPreferences(user.id).then((p) => {
      setPrefs(p);
      setLoading(false);
    });
  }, [user]);

  const onToggle = async (
    key: NotificationPrefKey,
    field: "email_enabled" | "in_app_enabled",
    value: boolean,
  ) => {
    if (!user) return;
    setPrefs((prev) => prev.map((p) => (p.pref_key === key ? { ...p, [field]: value } : p)));
    const { error } = await updateNotificationPreference(user.id, key, { [field]: value });
    if (error) toast.error(error);
    else toast.success("Preference saved");
  };

  return (
    <MemberLayout title="Notifications" eyebrow="preferences">
      <p className="text-sm text-muted-foreground mb-8 max-w-xl -mt-4">
        Per-category toggles for in-app notifications and email. Digest frequency (daily/weekly/off)
        is set separately in{" "}
        <Link to="/account/preferences" className="text-accent-blue hover:text-bone">
          preferences
        </Link>
        .
      </p>

      {loading ? (
        <ListSkeleton rows={4} />
      ) : (
        <div className="max-w-xl space-y-4">
          {prefs.map((pref) => {
            const meta = NOTIFICATION_PREF_LABELS[pref.pref_key];
            return (
              <div
                key={pref.pref_key}
                className="rounded-sm border border-border/60 bg-background/70 p-5 space-y-4"
              >
                <div>
                  <p className="font-display text-lg text-bone">{meta.label}</p>
                  <p className="text-sm text-muted-foreground mt-1">{meta.description}</p>
                </div>
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-3">
                    <Switch
                      id={`${pref.pref_key}-inapp`}
                      checked={pref.in_app_enabled}
                      onCheckedChange={(v) => void onToggle(pref.pref_key, "in_app_enabled", v)}
                    />
                    <Label htmlFor={`${pref.pref_key}-inapp`} className="text-sm cursor-pointer">
                      In-app
                    </Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      id={`${pref.pref_key}-email`}
                      checked={pref.email_enabled}
                      onCheckedChange={(v) => void onToggle(pref.pref_key, "email_enabled", v)}
                    />
                    <Label htmlFor={`${pref.pref_key}-email`} className="text-sm cursor-pointer">
                      Email
                    </Label>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </MemberLayout>
  );
}
