import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { EmptyState } from "@/components/member/ContentCard";
import { MemberLayout } from "@/components/member/MemberLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { fetchNotifications, markAllRead, markNotificationRead } from "@/lib/notifications";
import type { Notification } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/notifications/")({
  component: NotificationsPage,
});

function NotificationsPage() {
  return (
    <RequireAuth>
      <NotificationsContent />
    </RequireAuth>
  );
}

function NotificationsContent() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    if (!user) return;
    void fetchNotifications(user.id).then((list) => {
      setItems(list);
      setLoading(false);
    });
  };

  useEffect(() => {
    refresh();
  }, [user]);

  const unread = items.filter((n) => !n.read).length;
  const visible = useMemo(
    () => (filter === "unread" ? items.filter((n) => !n.read) : items),
    [items, filter],
  );

  return (
    <MemberLayout title="Notifications" eyebrow="updates">
      <div className="flex flex-wrap items-center gap-3 mb-6 -mt-2">
        {(["all", "unread"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`font-mono text-[10px] tracking-[0.22em] uppercase px-3 py-1.5 rounded-sm border transition ${
              filter === f
                ? "bg-accent-blue/10 text-bone border-accent-blue/30"
                : "border-border/60 text-muted-foreground hover:text-bone"
            }`}
          >
            {f} {f === "unread" && unread > 0 ? `(${unread})` : ""}
          </button>
        ))}
        {unread > 0 ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void markAllRead(user!.id).then(refresh)}
            className="ml-auto font-mono text-[9px] tracking-[0.15em] uppercase"
          >
            Mark all read
          </Button>
        ) : null}
      </div>

      {loading ? (
        <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground animate-pulse">
          Loading…
        </p>
      ) : items.length === 0 ? (
        <EmptyState
          title="All caught up"
          body="You'll see updates when application status changes, lead requests are reviewed, or announcements are posted."
        />
      ) : visible.length === 0 ? (
        <EmptyState title="No unread notifications" body="Switch to All to see your history." />
      ) : (
        <div className="space-y-2">
          {visible.map((n) => (
            <NotificationCard key={n.id} notification={n} userId={user!.id} onRead={refresh} />
          ))}
        </div>
      )}
    </MemberLayout>
  );
}

function NotificationCard({
  notification: n,
  userId,
  onRead,
}: {
  notification: Notification;
  userId: string;
  onRead: () => void;
}) {
  const onClick = async () => {
    if (!n.read) {
      await markNotificationRead(userId, n.id);
      onRead();
    }
  };

  const inner = (
    <div
      className={cn(
        "rounded-sm border border-border/60 p-5 transition",
        !n.read ? "bg-accent-blue/5 border-accent-blue/20" : "bg-background/70",
      )}
    >
      <p className="font-display text-lg text-bone">{n.title}</p>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{n.body}</p>
      <p className="mt-3 font-mono text-[9px] tracking-[0.15em] uppercase text-muted-foreground">
        {new Date(n.created_at).toLocaleDateString()}
      </p>
    </div>
  );

  if (n.href) {
    return (
      <Link to={n.href} onClick={() => void onClick()}>
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" className="w-full text-left" onClick={() => void onClick()}>
      {inner}
    </button>
  );
}
