import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { CtaLink, InlineEmpty } from "@/components/member/ContentCard";
import { ListSkeleton } from "@/components/member/LoadingState";
import { SectionHeader } from "@/components/member/SectionHeader";
import { useAuth } from "@/lib/auth";
import { fetchMemberPreferences } from "@/lib/member-preferences";
import { buildForYouFeed } from "@/lib/personalization";
import type { ForYouItem } from "@/lib/personalization";

export function DigestPreviewCard() {
  const { user, profile } = useAuth();
  const [frequency, setFrequency] = useState<string | null>(null);
  const [items, setItems] = useState<ForYouItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    void fetchMemberPreferences(user.id).then((p) => {
      setFrequency(p.email_digest_frequency);
      if (p.email_digest_frequency === "never" || !profile?.interests?.length) {
        setLoading(false);
        return;
      }
      void buildForYouFeed(profile.interests).then((feed) => {
        setItems(feed.slice(0, 4));
        setLoading(false);
      });
    });
  }, [user, profile?.interests]);

  if (!user) return null;

  return (
    <section className="section-gap panel glass surface-card p-5 md:p-6">
      <SectionHeader
        title="Digest preview"
        accent="violet"
        description={
          frequency === "never"
            ? "Email digests are off — turn them on in preferences to receive a summary of new paper reviews, open projects, and upcoming deadlines."
            : `Preview of your ${frequency ?? "weekly"} digest — actual emails are sent on schedule when digest delivery is configured.`
        }
        action={<CtaLink to="/account/preferences">Change frequency →</CtaLink>}
        className="mb-0"
      />
      {loading ? (
        <ListSkeleton rows={3} className="mt-5" />
      ) : frequency === "never" ? (
        <InlineEmpty
          className="mt-5"
          title="Digests disabled"
          body="Turn on weekly or daily digests in preferences to preview what you'd receive."
          action={<CtaLink to="/account/preferences">Enable digest →</CtaLink>}
        />
      ) : !profile?.interests?.length ? (
        <InlineEmpty
          className="mt-5"
          title="Add interests first"
          body="Set research interests in your profile — the digest pulls paper reviews, open projects, and events that share those tags."
          action={<CtaLink to="/profile">Update profile →</CtaLink>}
        />
      ) : items.length === 0 ? (
        <InlineEmpty
          className="mt-5"
          title="Nothing to preview yet"
          body="Once you read papers, save items, or follow projects, the digest preview will show what would appear in your next email."
          action={<CtaLink to="/research">Browse research →</CtaLink>}
        />
      ) : (
        <ul className="mt-5 space-y-2">
          {items.map((item) => (
            <li key={`${item.type}-${item.href}`}>
              <Link
                to={item.href}
                className="flex items-baseline gap-2 text-sm hover:text-accent-blue transition-colors"
              >
                <span className="label-xs text-muted-foreground shrink-0">{item.type}</span>
                <span className="text-bone line-clamp-1">{item.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
