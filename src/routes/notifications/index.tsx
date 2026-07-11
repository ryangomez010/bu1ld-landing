import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { RequireMember } from "@/components/auth/RequireAuth";
import { EmptyState } from "@/components/member/ContentCard";
import { FilterBar } from "@/components/member/FilterBar";
import { LoadingState } from "@/components/member/LoadingState";
import { MemberLayout } from "@/components/member/MemberLayout";
import { SectionHeader } from "@/components/member/SectionHeader";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { relativeTime } from "@/lib/date";
import {
  deleteNotification,
  groupNotificationsByDay,
  markAllRead,
  markNotificationRead,
  notificationCategory,
  subscribeNotifications,
  type NotificationCategory,
} from "@/lib/notifications";
import { queryKeys } from "@/lib/queries/keys";
import { useNotificationsQuery } from "@/lib/queries/use-notifications";
import type { Notification } from "@/lib/types";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

export const Route = createFileRoute("/notifications/")({
  component: NotificationsPage,
  head: () => ({
    meta: [{ title: "Notifications — The Bu1ld" }],
  }),
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
  const queryClient = useQueryClient();
  const { data: items = [], isLoading: loading } = useNotificationsQuery(user?.id);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [typeFilter, setTypeFilter] = useState<NotificationCategory | "all">("all");
  const [page, setPage] = useState(1);

  const refresh = useCallback(() => {
    if (!user) return;
    void queryClient.invalidateQueries({ queryKey: queryKeys.notifications(user.id) });
  }, [queryClient, user]);

  useEffect(() => {
    setPage(1);
  }, [filter, typeFilter]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeNotifications(user.id, refresh);
    return unsub;
  }, [user, refresh]);

  const unread = items.filter((n) => !n.read).length;
  const visible = useMemo(() => {
    let list = filter === "unread" ? items.filter((n) => !n.read) : items;
    if (typeFilter !== "all") {
      list = list.filter((n) => notificationCategory(n) === typeFilter);
    }
    return list;
  }, [items, filter, typeFilter]);
  const paged = useMemo(() => visible.slice(0, page * PAGE_SIZE), [visible, page]);
  const grouped = useMemo(() => groupNotificationsByDay(paged), [paged]);
  const hasMore = paged.length < visible.length;

  const typeCounts = useMemo(() => {
    const base = filter === "unread" ? items.filter((n) => !n.read) : items;
    return {
      application: base.filter((n) => notificationCategory(n) === "application").length,
      announcement: base.filter((n) => notificationCategory(n) === "announcement").length,
      lead: base.filter((n) => notificationCategory(n) === "lead").length,
    };
  }, [items, filter]);

  return (
    <MemberLayout title="Notifications" eyebrow="updates">
      <p className="text-muted-foreground mb-6 max-w-2xl leading-relaxed -mt-4">
        Application status changes, project lead messages, pinned announcements, and event deadline
        reminders — filter by category or mark all as read when you are caught up.
      </p>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <FilterBar
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
            className="label-xs shrink-0"
          >
            Mark all read
          </Button>
        ) : null}
      </div>

      <FilterBar
        className="mb-6"
        value={typeFilter}
        onChange={setTypeFilter}
        options={(
          [
            ["all", "All types", items.length],
            ["application", "Applications", typeCounts.application],
            ["announcement", "Announcements", typeCounts.announcement],
            ["lead", "Lead status", typeCounts.lead],
          ] as const
        ).map(([value, label, count]) => ({ value, label, count }))}
      />

      {loading ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <EmptyState
          title="All caught up"
          body="Notifications appear when a project lead changes your application status, mentions you in an update, posts a pinned announcement, or an event deadline you saved is due within three days."
        />
      ) : visible.length === 0 ? (
        <EmptyState
          title="No unread"
          body="Switch to All to browse past notifications — they are grouped by day and link to the source page."
        />
      ) : (
        <div className="space-y-8">
          {grouped.map((group) => (
            <section key={group.label}>
              <SectionHeader title={group.label} className="mb-3" />
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
          {hasMore ? (
            <div className="pt-4 text-center">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)}>
                Load more
              </Button>
            </div>
          ) : null}
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
        "surface-card border p-5 transition-colors list-row-hover",
        !n.read
          ? "panel glass-subtle border-accent-blue/20 bg-accent-blue/5"
          : "panel glass-subtle border-border/60",
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
