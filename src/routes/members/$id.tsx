import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { RequireMember } from "@/components/auth/RequireAuth";
import { CtaLink } from "@/components/member/ContentCard";
import { ReportContentButton } from "@/components/member/ReportContentButton";
import { ResourceNotFound } from "@/components/member/ResourceNotFound";
import { IdentityCard } from "@/components/member/IdentityCard";
import { InterestMatchTags } from "@/components/member/InterestMatchTags";
import { ListSkeleton } from "@/components/member/LoadingState";
import { MemberLayout } from "@/components/member/MemberLayout";
import { PageBackLink } from "@/components/member/PageBackLink";
import { RoleBadge } from "@/components/member/RoleBadge";
import { SectionHeader } from "@/components/member/SectionHeader";
import { TagList } from "@/components/member/ContentCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { fetchDirectoryMember, sharedInterests } from "@/lib/members";
import type { DirectoryMember } from "@/lib/members";
import { resolveMemberId } from "@/lib/profile-share";
import {
  endorseSkill,
  fetchEndorsementsForProfile,
  groupEndorsementsBySkill,
  removeEndorsement,
} from "@/lib/skill-endorsements";
import { safeHref } from "@/lib/urls";

export const Route = createFileRoute("/members/$id")({
  component: MemberProfilePage,
});

function MemberProfilePage() {
  return (
    <RequireMember>
      <MemberProfileContent />
    </RequireMember>
  );
}

function MemberProfileContent() {
  const { id } = Route.useParams();
  const { user, profile } = useAuth();
  const [member, setMember] = useState<DirectoryMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [endorsements, setEndorsements] = useState<
    Awaited<ReturnType<typeof fetchEndorsementsForProfile>>
  >([]);

  useEffect(() => {
    void (async () => {
      const resolvedId = (await resolveMemberId(id)) ?? id;
      const m = await fetchDirectoryMember(resolvedId);
      setMember(m);
      if (m) void fetchEndorsementsForProfile(m.id).then(setEndorsements);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <MemberLayout>
        <ListSkeleton rows={3} />
      </MemberLayout>
    );
  }

  if (!member) {
    return (
      <MemberLayout>
        <ResourceNotFound
          title="Profile not available"
          body="This member chose to hide their profile from the directory, or onboarding isn't complete yet."
          backTo="/members"
          backLabel="← Back to members"
        />
      </MemberLayout>
    );
  }

  const github = safeHref(member.github_url);
  const linkedin = safeHref(member.linkedin_url);
  const twitter = safeHref(member.twitter_url);
  const website = safeHref(member.website_url);
  const overlap =
    profile?.interests?.length && member.interests?.length
      ? sharedInterests(profile.interests, member.interests)
      : [];
  const isSelf = user?.id === member.id;
  const endorsementGroups = groupEndorsementsBySkill(endorsements);

  const onEndorse = async (skill: string) => {
    if (!user || !member) return;
    const existing = endorsements.find((e) => e.endorser_id === user.id && e.skill === skill);
    if (existing) {
      const { error } = await removeEndorsement(user.id, existing.id, member.id);
      if (error) {
        toast.error(error);
        return;
      }
      toast.success(`Removed endorsement for ${skill}`);
    } else {
      const { error } = await endorseSkill(user.id, member.id, skill);
      if (error) {
        toast.error(error);
        return;
      }
      toast.success(`Endorsed ${skill}`);
    }
    void fetchEndorsementsForProfile(member.id).then(setEndorsements);
  };

  return (
    <MemberLayout title={member.full_name ?? "Member"} eyebrow="builder profile">
      <PageBackLink to="/members" label="All members" />

      <div className="flex flex-wrap items-center justify-between gap-3 -mt-2">
        <div className="flex flex-wrap items-center gap-2">
          <RoleBadge role={member.role} />
          {member.background ? (
            <span className="label-xs text-muted-foreground capitalize border border-border/60 px-2 py-1 rounded-sm">
              {member.background}
            </span>
          ) : null}
        </div>
        {!isSelf ? (
          <ReportContentButton
            contentType="member"
            contentSlug={member.id}
            label="Report profile"
          />
        ) : null}
      </div>

      <IdentityCard
        profile={{
          ...member,
          goals: member.goals ?? [],
          avatar_url: member.avatar_url ?? null,
          twitter_url: member.twitter_url ?? null,
          website_url: member.website_url ?? null,
          profile_slug: member.profile_slug ?? null,
          onboarding_completed: true,
          directory_visible: true,
          weekly_paper_goal: 2,
          timezone: null,
          updated_at: member.created_at,
        }}
        displayName={member.full_name ?? "Member"}
        className="mt-4"
      />

      {overlap.length > 0 && !isSelf ? (
        <section className="mt-6 panel glass-subtle surface-card border border-accent-green/25 px-4 py-4">
          <p className="label-xs text-accent-green mb-2">Shared interests</p>
          <InterestMatchTags tags={member.interests ?? []} interests={profile!.interests} />
        </section>
      ) : null}

      {member.interests?.length ? (
        <section className="mt-8">
          <SectionHeader title="Interests" />
          <div className="panel glass-subtle surface-card p-4">
            <TagList tags={member.interests} />
            {!isSelf && user ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {member.interests.slice(0, 6).map((skill) => {
                  const endorsed = endorsements.some(
                    (e) => e.endorser_id === user.id && e.skill === skill,
                  );
                  return (
                    <Button
                      key={skill}
                      type="button"
                      size="sm"
                      variant={endorsed ? "secondary" : "outline"}
                      onClick={() => void onEndorse(skill)}
                      className="label-xs min-h-8"
                      aria-pressed={endorsed}
                    >
                      {endorsed ? `✓ ${skill}` : `+ Endorse ${skill}`}
                    </Button>
                  );
                })}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {endorsementGroups.length > 0 ? (
        <section className="mt-8">
          <SectionHeader title="Endorsements" accent="green" />
          <ul className="grid gap-2">
            {endorsementGroups.map((g) => (
              <li
                key={g.skill}
                className="panel glass-subtle surface-card px-4 py-3 text-sm text-muted-foreground"
              >
                <span className="text-bone font-medium">{g.skill}</span>
                <span className="ml-2 label-xs">
                  {g.count} · {g.endorsers.slice(0, 3).join(", ")}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-4">
        {github ? (
          <a href={github} target="_blank" rel="noreferrer" className="cta-link">
            GitHub →
          </a>
        ) : null}
        {linkedin ? (
          <a href={linkedin} target="_blank" rel="noreferrer" className="cta-link">
            LinkedIn →
          </a>
        ) : null}
        {twitter ? (
          <a href={twitter} target="_blank" rel="noreferrer" className="cta-link">
            X / Twitter →
          </a>
        ) : null}
        {website ? (
          <a href={website} target="_blank" rel="noreferrer" className="cta-link">
            Website →
          </a>
        ) : null}
        <CtaLink to="/projects">Browse projects →</CtaLink>
        {!isSelf ? (
          <CtaLink to="/search" search={{ q: overlap[0] ?? member.interests?.[0] ?? "" }}>
            Content you both might like →
          </CtaLink>
        ) : null}
      </div>
    </MemberLayout>
  );
}
