import { Link } from "@tanstack/react-router";
import { Bell, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/lib/auth";
import { relativeTime } from "@/lib/date";
import {
  deleteNotification,
  fetchNotifications,
  markAllRead,
  markNotificationRead,
  subscribeNotifications,
  unreadCount,
} from "@/lib/notifications";
import type { Notification } from "@/lib/types";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const refresh = useCallback(() => {
    if (!user) return;
    void unreadCount(user.id).then(setCount);
    void fetchNotifications(user.id).then(setItems);
  }, [user]);

  useEffect(() => {
    refresh();
    const poll = window.setInterval(refresh, 60000);
    const unsub = user ? subscribeNotifications(user.id, refresh) : undefined;
    return () => {
      window.clearInterval(poll);
      unsub?.();
    };
  }, [user, refresh]);

  if (!user) return null;

  const onOpenItem = async (n: Notification) => {
    if (!n.read) {
      await markNotificationRead(user.id, n.id);
      refresh();
    }
    setOpen(false);
  };

  const onMarkAll = async () => {
    await markAllRead(user.id);
    refresh();
  };

  const onDismiss = async (e: React.MouseEvent, n: Notification) => {
    e.preventDefault();
    e.stopPropagation();
    await deleteNotification(user.id, n.id);
    refresh();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {count > 0 ? (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-red px-1 text-[9px] font-mono text-bone">
              {count > 9 ? "9+" : count}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 bg-background/95 border-border/60">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-bone">
            Notifications
          </span>
          {count > 0 ? (
            <button
              type="button"
              onClick={() => void onMarkAll()}
              className="font-mono text-[9px] tracking-[0.15em] uppercase text-accent-blue hover:text-bone"
            >
              Mark all read
            </button>
          ) : null}
        </div>
        <div className="max-h-72 overflow-y-auto">
          {items.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground text-center">All caught up.</p>
          ) : (
            items.slice(0, 8).map((n) => (
              <div key={n.id} className="relative border-b border-border/40 last:border-0 group">
                {n.href ? (
                  <Link
                    to={n.href}
                    onClick={() => void onOpenItem(n)}
                    className={cn(
                      "block px-4 py-3 pr-10 hover:bg-bone/5 transition",
                      !n.read && "bg-accent-blue/5",
                    )}
                  >
                    <NotificationRow notification={n} />
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => void onOpenItem(n)}
                    className={cn(
                      "w-full text-left px-4 py-3 pr-10 hover:bg-bone/5 transition",
                      !n.read && "bg-accent-blue/5",
                    )}
                  >
                    <NotificationRow notification={n} />
                  </button>
                )}
                <button
                  type="button"
                  aria-label="Dismiss notification"
                  onClick={(e) => void onDismiss(e, n)}
                  className="absolute right-2 top-3 rounded-sm p-1 text-muted-foreground opacity-70 hover:opacity-100 hover:text-bone transition focus:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))
          )}
        </div>
        <Link
          to="/notifications"
          onClick={() => setOpen(false)}
          className="block border-t border-border/60 px-4 py-2.5 text-center font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground hover:text-bone"
        >
          View all
        </Link>
      </PopoverContent>
    </Popover>
  );
}

function NotificationRow({ notification: n }: { notification: Notification }) {
  return (
    <>
      <p className="text-sm text-bone font-medium leading-snug">{n.title}</p>
      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{n.body}</p>
      <p className="mt-2 font-mono text-[9px] tracking-[0.12em] uppercase text-bone/40">
        {relativeTime(n.created_at)}
      </p>
    </>
  );
}
