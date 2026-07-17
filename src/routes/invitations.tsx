import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { RequireMember } from "@/components/auth/RequireAuth";
import { MemberLayout } from "@/components/member/MemberLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { fetchMyInvitations, respondToInvitation } from "@/lib/invitations";
import type { Invitation } from "@/lib/types";

export const Route = createFileRoute("/invitations")({
  component: InvitationsPage,
  head: () => ({
    meta: [{ title: "Invitations — The Bu1ld" }],
  }),
});

function InvitationsPage() {
  return (
    <RequireMember>
      <InvitationsPanel />
    </RequireMember>
  );
}

function InvitationsPanel() {
  const { user } = useAuth();
  const [items, setItems] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    if (!user) return;
    setLoading(true);
    setItems(await fetchMyInvitations(user.id));
    setLoading(false);
  };

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const onRespond = async (id: string, status: "accepted" | "declined") => {
    const { error } = await respondToInvitation(id, status);
    if (error) return toast.error(error);
    toast.success(status === "accepted" ? "Invitation accepted." : "Invitation declined.");
    void reload();
  };

  return (
    <MemberLayout title="Invitations" eyebrow="Team access">
      <p className="-mt-4 max-w-2xl text-sm text-muted-foreground">
        Project, lab, and program invitations sent to your account appear here. Accepting joins you
        to the target team once the invitation is still valid.
      </p>
      {loading ? (
        <p className="mt-8 font-mono text-xs text-muted-foreground">Loading invitations…</p>
      ) : items.length === 0 ? (
        <div className="mt-8 rounded-sm border border-border/50 p-6 text-sm text-muted-foreground">
          No pending invitations. Project leads and administrators can invite you by email or member
          id. Browse{" "}
          <Link to="/projects" className="text-accent-blue">
            open projects
          </Link>{" "}
          to apply directly.
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {items.map((invite) => (
            <li
              key={invite.id}
              className="rounded-sm border border-border/50 bg-bone/[0.02] p-5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent-blue">
                  {invite.invitation_type}
                </span>
                <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                  {invite.status}
                </span>
                <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-bone/50">
                  role · {invite.role_offered}
                </span>
              </div>
              {invite.message ? (
                <p className="mt-3 text-sm text-muted-foreground">{invite.message}</p>
              ) : null}
              <p className="mt-2 font-mono text-[10px] text-muted-foreground">
                Expires {new Date(invite.expires_at).toLocaleDateString()}
              </p>
              {invite.status === "pending" ? (
                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    className="font-mono text-[10px] uppercase tracking-[0.16em]"
                    onClick={() => void onRespond(invite.id, "accepted")}
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="font-mono text-[10px] uppercase tracking-[0.16em]"
                    onClick={() => void onRespond(invite.id, "declined")}
                  >
                    Decline
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </MemberLayout>
  );
}
