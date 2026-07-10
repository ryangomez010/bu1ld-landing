import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { RequireMember } from "@/components/auth/RequireAuth";
import { EmptyState } from "@/components/member/ContentCard";
import { FilterBar } from "@/components/member/FilterBar";
import { ListSkeleton } from "@/components/member/LoadingState";
import { MemberLayout } from "@/components/member/MemberLayout";
import { RoleBadge } from "@/components/member/RoleBadge";
import { Input } from "@/components/ui/input";
import { fetchMemberDirectory } from "@/lib/members";
import type { DirectoryMember } from "@/lib/members";
import type { MemberBackground } from "@/lib/types";

export const Route = createFileRoute("/members/")({
  component: MembersPage,
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
  const [members, setMembers] = useState<DirectoryMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [background, setBackground] = useState<MemberBackground | "all">("all");

  useEffect(() => {
    void fetchMemberDirectory().then((list) => {
      setMembers(list);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter((m) => {
      if (background !== "all" && m.background !== background) return false;
      if (!q) return true;
      const hay = [
        m.full_name,
        m.bio,
        ...(m.interests ?? []),
        m.background,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [members, query, background]);

  return (
    <MemberLayout title="Members" eyebrow="community">
      <p className="text-muted-foreground mb-6 max-w-2xl leading-relaxed -mt-4">
        Builders who completed onboarding — discover collaborators by background and interests.
      </p>

      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name, bio, or interest…"
        className="mb-4 max-w-md"
      />

      <FilterBar
        className="mb-6"
        value={background}
        onChange={setBackground}
        options={BACKGROUNDS.map((b) => ({
          value: b,
          label: b === "all" ? "All" : b,
          count: b === "all" ? members.length : members.filter((m) => m.background === b).length,
        }))}
      />

      {loading ? (
        <ListSkeleton rows={5} />
      ) : members.length === 0 ? (
        <EmptyState
          title="No members yet"
          body="Once members complete onboarding, they'll appear here. Run phase9.sql in Supabase for directory access."
        />
      ) : filtered.length === 0 ? (
        <EmptyState title="No matches" body="Try another search or background filter." />
      ) : (
        <div className="grid gap-px border border-border/40 bg-border/40 sm:grid-cols-2">
          {filtered.map((m) => (
            <MemberCard key={m.id} member={m} />
          ))}
        </div>
      )}
    </MemberLayout>
  );
}

function MemberCard({ member }: { member: DirectoryMember }) {
  return (
    <Link
      to={`/members/${member.id}`}
      className="bg-background/75 p-5 hover:bg-bone/5 transition block h-full"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-display text-lg text-bone">{member.full_name ?? "Member"}</h3>
        <RoleBadge role={member.role} />
      </div>
      {member.background ? (
        <p className="mt-1 font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground capitalize">
          {member.background}
        </p>
      ) : null}
      {member.bio ? (
        <p className="mt-3 text-sm text-muted-foreground line-clamp-3 leading-relaxed">{member.bio}</p>
      ) : null}
      {member.interests?.length ? (
        <p className="mt-3 font-mono text-[8px] tracking-[0.12em] uppercase text-accent-green line-clamp-2">
          {member.interests.slice(0, 5).join(" · ")}
        </p>
      ) : null}
    </Link>
  );
}
