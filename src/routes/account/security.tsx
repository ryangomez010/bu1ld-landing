import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Download, KeyRound, LogOut, Mail, Shield, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { ConfirmButton } from "@/components/member/ConfirmButton";
import { ListSkeleton } from "@/components/member/LoadingState";
import { MemberLayout } from "@/components/member/MemberLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  fetchMySecurityEvents,
  fetchSignInSessions,
  getConnectedIdentities,
  logSecurityEvent,
  requestAccountDeletion,
  type SecurityEvent,
  type SignInSession,
} from "@/lib/account-security";
import { useAuth } from "@/lib/auth";
import {
  downloadContributionExport,
  fetchMyContributionsForExport,
} from "@/lib/contribution-export";
import { relativeTime } from "@/lib/date";
import { validatePassword } from "@/lib/security";
import { isSupabaseConfigured } from "@/lib/supabase";

export const Route = createFileRoute("/account/security")({
  component: AccountSecurityPage,
  head: () => ({
    meta: [{ title: "Account security — The Bu1ld" }],
  }),
});

function AccountSecurityPage() {
  return (
    <RequireAuth>
      <AccountSecurityContent />
    </RequireAuth>
  );
}

function AccountSecurityContent() {
  const { user, emailVerified, updatePassword, resendVerificationEmail, signOut } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [changingPw, setChangingPw] = useState(false);
  const [resending, setResending] = useState(false);
  const [signingOutAll, setSigningOutAll] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [sessions, setSessions] = useState<SignInSession[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  const reloadEvents = useCallback(() => {
    if (!user) return;
    void fetchMySecurityEvents(user.id).then((data) => {
      setEvents(data);
      setLoadingEvents(false);
    });
    void fetchSignInSessions(user.id).then(setSessions);
  }, [user]);

  useEffect(() => {
    reloadEvents();
  }, [reloadEvents]);

  const identities = getConnectedIdentities(user?.identities);
  const hasEmailProvider = identities.some((i) => i.provider === "email") || !identities.length;

  const onChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords don't match.");
      return;
    }
    const check = validatePassword(password);
    if (!check.ok) {
      toast.error(check.reason);
      return;
    }
    setChangingPw(true);
    const { error } = await updatePassword(password);
    setChangingPw(false);
    if (error) {
      toast.error(error);
      return;
    }
    if (user) void logSecurityEvent(user.id, "password_changed");
    setPassword("");
    setConfirm("");
    toast.success("Password updated.");
    reloadEvents();
  };

  const onResendVerification = async () => {
    setResending(true);
    const { error } = await resendVerificationEmail();
    setResending(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Verification email sent — check your inbox.");
  };

  const onSignOutEverywhere = async () => {
    setSigningOutAll(true);
    if (user) void logSecurityEvent(user.id, "global_sign_out");
    await signOut("global");
    setSigningOutAll(false);
    toast.success("Signed out on all devices.");
    void navigate({ to: "/login" });
  };

  const onDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    const { error } = await requestAccountDeletion(user.id);
    if (error) {
      setDeleting(false);
      toast.error(error);
      return;
    }
    await signOut("global");
    setDeleting(false);
    toast.success("Account data removed. Contact support to fully delete auth credentials.");
    void navigate({ to: "/" });
  };

  const onExportContributions = async () => {
    if (!user) return;
    setExporting(true);
    const { rows, error } = await fetchMyContributionsForExport(user.id);
    setExporting(false);
    if (error) {
      toast.error(error);
      return;
    }
    downloadContributionExport(rows);
    toast.success(
      rows.length
        ? `Exported ${rows.length} contribution${rows.length === 1 ? "" : "s"}.`
        : "Exported an empty contribution record.",
    );
  };

  return (
    <MemberLayout title="Account security" eyebrow="member settings">
      <p className="text-muted-foreground mb-6 max-w-2xl leading-relaxed -mt-4">
        Password, connected sign-in providers, active sessions, and account deletion. Security
        events log here after password changes and global sign-outs.
      </p>
      {!isSupabaseConfigured ? (
        <p className="rounded-sm border border-accent-red/30 bg-accent-red/5 px-4 py-3 text-sm text-accent-red mb-6">
          Account security controls are temporarily unavailable. Please try again later.
        </p>
      ) : null}

      <div className="grid gap-6 max-w-xl">
        <section className="rounded-sm border border-border/60 bg-background/70 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-accent-blue" />
            <h2 className="font-mono text-[10px] tracking-[0.25em] uppercase text-bone">Email</h2>
          </div>
          <p className="text-sm text-bone">{user?.email}</p>
          {emailVerified ? (
            <p className="text-xs text-accent-green font-mono tracking-[0.12em] uppercase">
              Verified
            </p>
          ) : (
            <div className="rounded-sm border border-accent-red/25 bg-accent-red/5 p-3 space-y-2">
              <p className="text-sm text-muted-foreground flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-accent-red mt-0.5" />
                Email not verified. Some features may be limited until you confirm your address.
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={resending}
                onClick={() => void onResendVerification()}
                className="font-mono text-[9px] tracking-[0.15em] uppercase"
              >
                {resending ? "Sending…" : "Resend verification email"}
              </Button>
            </div>
          )}
        </section>

        <section className="rounded-sm border border-border/60 bg-background/70 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-accent-green" />
            <h2 className="font-mono text-[10px] tracking-[0.25em] uppercase text-bone">
              Connected accounts
            </h2>
          </div>
          {identities.length ? (
            <ul className="space-y-2">
              {identities.map((id) => (
                <li
                  key={id.provider}
                  className="flex items-center justify-between rounded-sm border border-border/50 px-3 py-2 text-sm"
                >
                  <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-bone capitalize">
                    {id.provider}
                  </span>
                  <span className="text-muted-foreground text-xs">{id.email ?? "Linked"}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Email & password sign-in.</p>
          )}
        </section>

        {hasEmailProvider ? (
          <section className="rounded-sm border border-border/60 bg-background/70 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-accent-blue" />
              <h2 className="font-mono text-[10px] tracking-[0.25em] uppercase text-bone">
                Change password
              </h2>
            </div>
            <form onSubmit={onChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  minLength={8}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                At least 8 characters with a letter and a number.
              </p>
              <Button
                type="submit"
                disabled={changingPw || !password}
                className="font-mono text-[10px] tracking-[0.2em] uppercase"
              >
                {changingPw ? "Updating…" : "Update password"}
              </Button>
            </form>
          </section>
        ) : null}

        <section className="rounded-sm border border-border/60 bg-background/70 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <LogOut className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-mono text-[10px] tracking-[0.25em] uppercase text-bone">
              Sessions
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Sign out on every device where you&apos;re logged in to The Bu1ld.
          </p>
          {sessions.length > 0 ? (
            <ul className="space-y-2 rounded-sm border border-border/50 p-3">
              {sessions.map((s) => (
                <li key={s.id} className="flex items-center justify-between text-sm gap-3">
                  <span className="text-bone">{s.device}</span>
                  <span className="font-mono text-[8px] tracking-[0.1em] uppercase text-muted-foreground shrink-0">
                    {relativeTime(s.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">
              Sign-in history appears after your next login.
            </p>
          )}
          <ConfirmButton
            title="Sign out everywhere?"
            description="You'll need to log in again on all devices."
            confirmLabel="Sign out all"
            destructive
            onConfirm={() => void onSignOutEverywhere()}
            trigger={
              <Button
                type="button"
                variant="outline"
                disabled={signingOutAll}
                className="font-mono text-[10px] tracking-[0.2em] uppercase"
              >
                {signingOutAll ? "Signing out…" : "Sign out everywhere"}
              </Button>
            }
          />
        </section>

        <section className="rounded-sm border border-border/60 bg-background/70 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 text-accent-blue" />
            <h2 className="font-mono text-[10px] tracking-[0.25em] uppercase text-bone">
              Contribution export
            </h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Download your submitted and verified contribution history as JSON. Private review notes
            and other members&apos; records are not included.
          </p>
          <Button
            type="button"
            variant="outline"
            disabled={exporting}
            onClick={() => void onExportContributions()}
            className="font-mono text-[10px] tracking-[0.2em] uppercase"
          >
            {exporting ? "Preparing…" : "Download contribution record"}
          </Button>
        </section>

        <section className="rounded-sm border border-accent-red/30 bg-accent-red/5 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Trash2 className="h-4 w-4 text-accent-red" />
            <h2 className="font-mono text-[10px] tracking-[0.25em] uppercase text-bone">
              Delete account
            </h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Removes your profile, saved items, applications, and notifications from The Bu1ld. Your
            sign-in credential is also removed when the deletion service is available. Contact{" "}
            <a href="mailto:hello@thebu1ld.com" className="text-accent-blue hover:text-bone">
              hello@thebu1ld.com
            </a>{" "}
            if you need confirmation or a manual erasure request.
          </p>
          <ConfirmButton
            title="Delete your The Bu1ld account?"
            description="This anonymizes your profile and removes your data from the member area. This cannot be undone."
            confirmLabel="Delete my account"
            destructive
            onConfirm={() => void onDeleteAccount()}
            trigger={
              <Button
                type="button"
                variant="destructive"
                disabled={deleting}
                className="font-mono text-[10px] tracking-[0.2em] uppercase"
              >
                {deleting ? "Deleting…" : "Delete account"}
              </Button>
            }
          />
        </section>

        <section className="rounded-sm border border-border/60 bg-background/70 p-5 space-y-3">
          <h2 className="font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
            Recent security activity
          </h2>
          {loadingEvents ? (
            <ListSkeleton rows={2} />
          ) : events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No security events recorded yet.</p>
          ) : (
            <ul className="space-y-2">
              {events.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between text-sm border-b border-border/40 pb-2 last:border-0"
                >
                  <span className="font-mono text-[9px] tracking-[0.12em] uppercase text-bone">
                    {e.event_type.replace(/_/g, " ")}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {relativeTime(e.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <Link
          to="/account/notifications"
          className="inline-block font-mono text-[10px] tracking-[0.2em] uppercase text-accent-blue hover:text-bone"
        >
          Notification preferences →
        </Link>

        <Link
          to="/profile"
          className="inline-block font-mono text-[10px] tracking-[0.2em] uppercase text-accent-blue hover:text-bone"
        >
          ← Back to profile
        </Link>
      </div>
    </MemberLayout>
  );
}
