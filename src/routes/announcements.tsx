import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { RequireMember } from "@/components/auth/RequireAuth";
import { EmptyState } from "@/components/member/ContentCard";
import { ListSkeleton } from "@/components/member/LoadingState";
import { MemberLayout } from "@/components/member/MemberLayout";
import type { Announcement } from "@/data/seed/announcements";
import { fetchAnnouncements } from "@/lib/announcements";
import { postAuthNavigateTarget } from "@/lib/post-auth-redirect";
import { sanitizeAppPath } from "@/lib/security";
import { isSafeUrl } from "@/lib/urls";

export const Route = createFileRoute("/announcements")({
  component: AnnouncementsPage,
  head: () => ({
    meta: [{ title: "Announcements — The Bu1ld" }],
  }),
});

function AnnouncementsPage() {
  return (
    <RequireMember>
      <AnnouncementsContent />
    </RequireMember>
  );
}

function AnnouncementHref({ href }: { href: string }) {
  const navigate = useNavigate();
  const appPath = sanitizeAppPath(href);
  if (appPath) {
    return (
      <button
        type="button"
        onClick={() => void navigate(postAuthNavigateTarget(appPath))}
        className="mt-4 inline-block font-mono text-[10px] uppercase tracking-[0.2em] text-accent-blue hover:text-bone"
      >
        Open →
      </button>
    );
  }
  if (isSafeUrl(href)) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-block font-mono text-[10px] uppercase tracking-[0.2em] text-accent-blue hover:text-bone"
      >
        External link →
      </a>
    );
  }
  return null;
}

function AnnouncementsContent() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchAnnouncements(40).then((rows) => {
      setItems(rows);
      setLoading(false);
    });
  }, []);

  return (
    <MemberLayout title="Announcements" eyebrow="internal updates">
      <p className="-mt-4 mb-8 max-w-2xl text-muted-foreground leading-relaxed">
        Pinned and recent updates from The Bu1ld team — program waves, challenge openings, and
        operational notes. The dashboard shows a short slice; this page is the full list.
      </p>
      {loading ? (
        <ListSkeleton rows={4} />
      ) : items.length === 0 ? (
        <EmptyState
          title="No announcements yet"
          body="When administrators publish updates, they appear here and can notify members. Check Events for dated deadlines in the meantime."
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <article
              key={item.id}
              className="rounded-sm border border-border/50 bg-background/70 p-5"
            >
              <div className="flex flex-wrap items-center gap-3">
                {item.pinned ? (
                  <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent-green">
                    Pinned
                  </span>
                ) : null}
                <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                  {new Date(item.created_at).toLocaleDateString()}
                </span>
              </div>
              <h2 className="mt-3 font-display text-xl text-bone">{item.title}</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {item.body}
              </p>
              {item.href ? <AnnouncementHref href={item.href} /> : null}
            </article>
          ))}
        </div>
      )}
      <p className="mt-8 text-sm text-muted-foreground">
        Prefer calendar deadlines?{" "}
        <Link to="/events" className="text-accent-blue hover:text-bone">
          Browse events →
        </Link>
      </p>
    </MemberLayout>
  );
}
