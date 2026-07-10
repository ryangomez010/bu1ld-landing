import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { RequireMember } from "@/components/auth/RequireAuth";
import { ResourceNotFound } from "@/components/member/ResourceNotFound";
import { ListSkeleton } from "@/components/member/LoadingState";
import { MemberLayout } from "@/components/member/MemberLayout";
import { PageBackLink } from "@/components/member/PageBackLink";
import { RoleBadge } from "@/components/member/RoleBadge";
import { TagList } from "@/components/member/ContentCard";
import { fetchDirectoryMember } from "@/lib/members";
import type { DirectoryMember } from "@/lib/members";
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
  const [member, setMember] = useState<DirectoryMember | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchDirectoryMember(id).then((m) => {
      setMember(m);
      setLoading(false);
    });
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

  return (
    <MemberLayout title={member.full_name ?? "Member"} eyebrow="builder profile">
      <PageBackLink to="/members" label="All members" />

      <div className="flex flex-wrap items-center gap-2 -mt-2">
        <RoleBadge role={member.role} />
        {member.background ? (
          <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground capitalize border border-border/60 px-2 py-1 rounded-sm">
            {member.background}
          </span>
        ) : null}
      </div>

      {member.bio ? (
        <p className="mt-6 text-muted-foreground leading-relaxed max-w-2xl">{member.bio}</p>
      ) : null}

      {member.interests?.length ? (
        <section className="mt-8">
          <h2 className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-3">
            Interests
          </h2>
          <TagList tags={member.interests} />
        </section>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-4">
        {github ? (
          <a
            href={github}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-[10px] tracking-[0.22em] uppercase text-accent-blue hover:text-bone"
          >
            GitHub →
          </a>
        ) : null}
        {linkedin ? (
          <a
            href={linkedin}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-[10px] tracking-[0.22em] uppercase text-accent-blue hover:text-bone"
          >
            LinkedIn →
          </a>
        ) : null}
        <Link
          to="/projects"
          className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted-foreground hover:text-bone"
        >
          Browse projects →
        </Link>
      </div>
    </MemberLayout>
  );
}
