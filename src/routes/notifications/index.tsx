import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";

import { RequireMember } from "@/components/auth/RequireAuth";
import { EmptyState } from "@/components/member/ContentCard";
import { FilterBar } from "@/components/member/FilterBar";
import { LoadingState } from "@/components/member/LoadingState";
import { MemberLayout } from "@/components/member/MemberLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { relativeTime } from "@/lib/date";
import {
  deleteNotification,
  fetchNotifications,
  groupNotificationsByDay,
  markAllRead,
  markNotificationRead,
  subscribeNotifications,
} from "@/lib/notifications";
import type { Notification } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/notifications/")({
  component: NotificationsPage,
});

function NotificationsPage() {
  return (
    <RequireMember>
      <NotificationsContent />
    </RequireMember>
  );
}

function NotificationsContent() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    if (!user) return;
    void fetchNotifications(user.id).then((list) => {
      setItems(list);
      setLoading(false);
    });
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeNotifications(user.id, refresh);
    return unsub;
  }, [user, refresh]);

  const unread = items.filter((n) => !n.read).length;
  const visible = useMemo(
    () => (filter === "unread" ? items.filter((n) => !n.read) : items),
    [items, filter],
  );
  const grouped = useMemo(() => groupNotificationsByDay(visible), [visible]);

  return (
    <MemberLayout title="Notifications" eyebrow="updates">
      <FilterBar
        className="mb-6 -mt-2"
        value={filter}
        onChange={setFilter}
        options={[
          { value: "all" as const, label: "all", count: items.length },
          { value: "unread" as const, label: "unread", count: unread },
        ]}
      />
      {unread > 0 ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void markAllRead(user!.id).then(refresh)}
          className="-mt-4 mb-6 ml-auto block font-mono text-[9px] tracking-[0.15em] uppercase"
        >
          Mark all read
        </Button>
      ) : null}

      {loading ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <EmptyState
          title="All caught up"
          body="You'll see updates when application status changes, lead requests are reviewed, or announcements are posted."
        />
      ) : visible.length === 0 ? (
        <EmptyState title="No unread notifications" body="Switch to All to see your history." />
      ) : (
        <div className="space-y-8">
          {grouped.map((group) => (
            <section key={group.label}>
              <h2 className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-3">
                {group.label}
              </h2>
              <div className="space-y-2">
                {group.items.map((n) => (
                  <NotificationCard
                    key={n.id}
                    notification={n}
                    userId={user!.id}
                    onChange={refresh}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </MemberLayout>
  );
}

function NotificationCard({
  notification: n,
  userId,
  onChange,
}: {
  notification: Notification;
  userId: string;
  onChange: () => void;
}) {
  const onClick = async () => {
    if (!n.read) {
      await markNotificationRead(userId, n.id);
      onChange();
    }
  };

  const onDismiss = async () => {
    await deleteNotification(userId, n.id);
    onChange();
  };

  const inner = (
    <div
      className={cn(
        "rounded-sm border border-border/60 p-5 transition",
        !n.read ? "bg-accent-blue/5 border-accent-blue/20" : "bg-background/70",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="font-display text-lg text-bone">{n.title}</p>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void onDismiss();
          }}
          className="font-mono text-[9px] tracking-[0.15em] uppercase text-muted-foreground hover:text-accent-red shrink-0"
        >
          Dismiss
        </button>
      </div>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{n.body}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <p className="font-mono text-[9px] tracking-[0.15em] uppercase text-muted-foreground">
          {relativeTime(n.created_at)}
        </p>
        {n.href ? (
          <span className="font-mono text-[9px] tracking-[0.15em] uppercase text-accent-blue">
            View →
          </span>
        ) : null}
      </div>
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
