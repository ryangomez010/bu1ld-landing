import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { RequireMember } from "@/components/auth/RequireAuth";
import { EmptyState } from "@/components/member/ContentCard";
import { FilterBar } from "@/components/member/FilterBar";
import { FilterChip } from "@/components/member/FilterChip";
import { ListSkeleton } from "@/components/member/LoadingState";
import { MemberLayout } from "@/components/member/MemberLayout";
import { RoleBadge } from "@/components/member/RoleBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { fetchMemberDirectory, sharedInterests } from "@/lib/members";
import type { DirectoryMember } from "@/lib/members";
import type { MemberBackground } from "@/lib/types";

const PAGE_SIZE = 24;

export const Route = createFileRoute("/members/")({
  component: MembersPage,
  head: () => ({
    meta: [{ title: "Members — The Bu1ld" }],
  }),
});

const BACKGROUNDS: (MemberBackground | "all")[] = [
  "all",
  "researcher",
  "engineer",
  "founder",
  "student",
  "other",
];

function MembersPage() {
  return (
    <RequireMember>
      <MembersContent />
    </RequireMember>
  );
}

function MembersContent() {
  const { profile } = useAuth();
  const [members, setMembers] = useState<DirectoryMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [background, setBackground] = useState<MemberBackground | "all">("all");
  const [sharedOnly, setSharedOnly] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    void fetchMemberDirectory().then((list) => {
      setMembers(list);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const myInterests = profile?.interests ?? [];
    return members.filter((m) => {
      if (background !== "all" && m.background !== background) return false;
      if (sharedOnly && myInterests.length) {
        if (sharedInterests(myInterests, m.interests ?? []).length === 0) return false;
      }
      if (!q) return true;
      const hay = [m.full_name, m.bio, ...(m.interests ?? []), m.background]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [members, query, background, sharedOnly, profile?.interests]);

  useEffect(() => {
    setPage(1);
  }, [query, background, sharedOnly]);

  const visible = useMemo(() => filtered.slice(0, page * PAGE_SIZE), [filtered, page]);
  const hasMore = visible.length < filtered.length;

  return (
    <MemberLayout title="Members" eyebrow="community">
      <p className="text-muted-foreground mb-6 max-w-2xl leading-relaxed -mt-4">
        Members who completed onboarding and opted into the directory. Filter by background
        (researcher, engineer, founder, student), search by name or interest tag, or show only
        members who share at least one of your interests.
      </p>

      {profile?.directory_visible === false ? (
        <div className="mb-6 max-w-2xl panel glass-subtle surface-card px-4 py-3 text-sm text-muted-foreground">
          Your profile is hidden from this directory.{" "}
          <Link to="/profile" className="text-accent-blue hover:text-bone">
            Update visibility in profile →
          </Link>
        </div>
      ) : null}

      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name, bio, or interest…"
        className="mb-4 max-w-md"
      />

      <FilterBar
        className="mb-4"
        value={background}
        onChange={setBackground}
        options={BACKGROUNDS.map((b) => ({
          value: b,
          label: b === "all" ? "All" : b,
          count: b === "all" ? members.length : members.filter((m) => m.background === b).length,
        }))}
      />

      {profile?.interests?.length ? (
        <div className="mb-6">
          <FilterChip active={sharedOnly} onClick={() => setSharedOnly((v) => !v)}>
            Shared interests with me
          </FilterChip>
        </div>
      ) : null}

      {loading ? (
        <ListSkeleton rows={5} />
      ) : members.length === 0 ? (
        <EmptyState
          title="Directory empty"
          body="No members have completed onboarding with directory visibility on. Profiles appear here once onboarding is finished and directory_visible is enabled in profile settings."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No directory matches"
          body="Clear the search box, set Background to All, or turn off Shared interests only to widen results."
        />
      ) : (
        <div className="grid gap-px border border-border/40 bg-border/40 sm:grid-cols-2">
          {visible.map((m) => (
            <MemberCard key={m.id} member={m} />
          ))}
        </div>
      )}
      {!loading && hasMore ? (
        <div className="mt-8 text-center">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)}>
            Load more
          </Button>
        </div>
      ) : null}
    </MemberLayout>
  );
}

function MemberCard({ member }: { member: DirectoryMember }) {
  const { profile } = useAuth();
  const overlap =
    profile?.interests?.length && member.interests?.length
      ? sharedInterests(profile.interests, member.interests)
      : [];
  const initials = (member.full_name ?? "M")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <Link
      to={`/members/${member.profile_slug || member.id}`}
      className="panel glass-subtle panel-interactive surface-card-interactive p-5 block h-full"
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-11 w-11 border border-border/40 shrink-0">
          {member.avatar_url ? (
            <AvatarImage
              src={member.avatar_url}
              alt={member.full_name ? `${member.full_name} avatar` : "Member avatar"}
            />
          ) : null}
          <AvatarFallback className="bg-accent-blue/15 font-display text-sm text-bone">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-lg text-bone">{member.full_name ?? "Member"}</h3>
            <RoleBadge role={member.role} />
          </div>
          {member.profile_slug ? (
            <p className="mt-0.5 label-xs text-muted-foreground">@{member.profile_slug}</p>
          ) : null}
          {member.background ? (
            <p className="mt-1 label-xs text-muted-foreground capitalize">{member.background}</p>
          ) : null}
          {member.bio ? (
            <p className="mt-3 text-sm text-muted-foreground line-clamp-3 leading-relaxed">
              {member.bio}
            </p>
          ) : null}
          {member.goals?.length ? (
            <p className="mt-2 text-xs text-muted-foreground line-clamp-1">→ {member.goals[0]}</p>
          ) : null}
          {member.interests?.length ? (
            <p className="mt-3 label-xs text-accent-green line-clamp-2">
              {overlap.length
                ? `Shared: ${overlap.slice(0, 4).join(" · ")}`
                : member.interests.slice(0, 5).join(" · ")}
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
