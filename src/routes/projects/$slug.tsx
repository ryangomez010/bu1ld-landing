import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { RequireMember } from "@/components/auth/RequireAuth";
import { clearPitchDraft, loadPitchDraft, savePitchDraft } from "@/lib/application-draft";
import { InterestMatchTags } from "@/components/member/InterestMatchTags";
import { ApplicationNextSteps } from "@/components/member/ApplicationNextSteps";
import { ApplicationStatusTimeline } from "@/components/member/ApplicationStatusTimeline";
import { CapacityBar } from "@/components/member/CapacityBar";
import { ResourceNotFound } from "@/components/member/ResourceNotFound";
import { LoadingState } from "@/components/member/LoadingState";
import { TagList } from "@/components/member/ContentCard";
import { PitchTemplates } from "@/components/member/PitchTemplates";
import { SaveButton } from "@/components/member/SaveButton";
import { MemberLayout } from "@/components/member/MemberLayout";
import { PageBackLink } from "@/components/member/PageBackLink";
import { ProjectMemberWorkspace } from "@/components/member/ProjectMemberWorkspace";
import { ProjectUpdatesSection } from "@/components/member/ProjectUpdatesSection";
import { ShareButton } from "@/components/member/ShareButton";
import {
  ApplicationStatusBadge,
  ProjectStatusBadge,
  ProjectTypeBadge,
} from "@/components/member/ProjectBadges";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import {
  applyToProject,
  fetchProjectBySlug,
  fetchProjectTeamMembers,
  fetchProjects,
  getApplicationForProject,
  isProjectLead,
  relatedProjects,
  updateApplicationPitch,
} from "@/lib/projects";
import { pushRecentView } from "@/lib/recent-views";
import type { Project, ProjectApplication } from "@/lib/types";

export const Route = createFileRoute("/projects/$slug")({
  component: ProjectDetailPage,
});

function ProjectDetailPage() {
  return (
    <RequireMember>
      <ProjectDetail />
    </RequireMember>
  );
}

function ProjectDetail() {
  const { slug } = Route.useParams();
  const { user, profile } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [application, setApplication] = useState<ProjectApplication | null>(null);
  const [related, setRelated] = useState<Project[]>([]);
  const [teamMembers, setTeamMembers] = useState<Array<{ name: string; userId: string }>>([]);
  const [pitch, setPitch] = useState("");
  const [editingPitch, setEditingPitch] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void Promise.all([fetchProjectBySlug(slug), fetchProjects()]).then(([p, all]) => {
      setProject(p);
      if (p) {
        setRelated(relatedProjects(p, all));
        void fetchProjectTeamMembers(p.id).then(setTeamMembers);
      }
      setLoading(false);
    });
  }, [slug]);

  useEffect(() => {
    if (!user || !project) return;
    pushRecentView(user.id, {
      type: "project",
      slug: project.slug,
      title: project.title,
      href: `/projects/${project.slug}`,
    });
  }, [user, project]);

  useEffect(() => {
    if (!user || !project) return;
    void getApplicationForProject(user.id, project.id).then(setApplication);
    setPitch(loadPitchDraft(user.id, project.id));
  }, [user, project]);

  useEffect(() => {
    if (!user || !project) return;
    savePitchDraft(user.id, project.id, pitch);
  }, [pitch, user, project]);

  const onApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !project || !profile) return;
    setSubmitting(true);
    const { error } = await applyToProject(user.id, project, pitch, profile);
    setSubmitting(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Application submitted.");
    clearPitchDraft(user.id, project.id);
    void getApplicationForProject(user.id, project.id).then(setApplication);
    setPitch("");
  };

  if (loading) {
    return (
      <MemberLayout>
        <LoadingState />
      </MemberLayout>
    );
  }

  if (!project) {
    return (
      <MemberLayout>
        <ResourceNotFound
          title="Project not found"
          body="This project may have been removed or the link is outdated."
          backTo="/projects"
          backLabel="← Back to projects"
        />
      </MemberLayout>
    );
  }

  const isFull = project.team_count >= project.capacity;
  const canApply = project.status === "open" && !application && !isFull;
  const isLead = project.lead_id === user?.id || isProjectLead(profile?.role);

  return (
    <MemberLayout>
      <PageBackLink to="/projects" label="Projects" />

      <div className="mt-2">
        <div className="flex flex-wrap items-center gap-2">
          <ProjectTypeBadge type={project.type} />
          <ProjectStatusBadge status={project.status} />
          {isFull ? (
            <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-accent-red border border-accent-red/30 px-2 py-1 rounded-sm">
              Full
            </span>
          ) : null}
        </div>
        <h1 className="font-display text-4xl text-bone mt-4 tracking-tight">{project.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <SaveButton itemType="project" itemSlug={project.slug} itemTitle={project.title} />
          <ShareButton title={project.title} />
        </div>
        {profile?.interests?.length ? (
          <InterestMatchTags
            tags={[...project.tags, ...project.skills_needed]}
            interests={profile.interests}
            className="mt-3"
          />
        ) : null}
        <p className="mt-2 font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
          {project.lead_name ? `Lead: ${project.lead_name}` : "BUILD collective"} ·{" "}
          {project.team_count}/{project.capacity} builders
        </p>
        <CapacityBar
          teamCount={project.team_count}
          capacity={project.capacity}
          className="mt-4 max-w-xs"
        />
        <TagList tags={project.tags} linkToSearch className="mt-4" />

        <p className="mt-8 text-muted-foreground leading-relaxed text-lg">{project.description}</p>

        {project.skills_needed.length > 0 ? (
          <section className="mt-8">
            <h2 className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-3">
              Skills needed
            </h2>
            <TagList tags={project.skills_needed} linkToSearch />
          </section>
        ) : null}

        {teamMembers.length > 0 ? (
          <section className="mt-8">
            <h2 className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-3">
              Team
            </h2>
            <div className="flex flex-wrap gap-2">
              {teamMembers.map((m) => (
                <Link
                  key={m.userId}
                  to={`/members/${m.userId}`}
                  className="rounded-sm border border-border/60 px-3 py-2 text-sm text-bone hover:border-bone/30 transition"
                >
                  {m.name}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {project.discord_url ? (
          <a
            href={project.discord_url}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex font-mono text-[10px] tracking-[0.22em] uppercase text-accent-blue hover:text-bone"
          >
            Join project Discord →
          </a>
        ) : null}

        {application ? (
          <div className="mt-10 rounded-sm border border-border/60 bg-background/70 p-6">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-display text-lg text-bone">Your application</h2>
              <ApplicationStatusBadge status={application.status} />
              {application.status === "pending" ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditingPitch((v) => !v);
                    setPitch(application.pitch);
                  }}
                  className="font-mono text-[9px] tracking-[0.15em] uppercase text-muted-foreground hover:text-bone"
                >
                  {editingPitch ? "Cancel edit" : "Edit pitch"}
                </button>
              ) : null}
            </div>
            <ApplicationStatusTimeline status={application.status} />
            <ApplicationNextSteps status={application.status} />
            {editingPitch && application.status === "pending" ? (
              <form
                className="mt-4 space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!user) return;
                  setSubmitting(true);
                  void updateApplicationPitch(user.id, application.id, pitch).then(({ error }) => {
                    setSubmitting(false);
                    if (error) toast.error(error);
                    else {
                      toast.success("Pitch updated.");
                      setEditingPitch(false);
                      void getApplicationForProject(user.id, project.id).then(setApplication);
                    }
                  });
                }}
              >
                <Textarea
                  value={pitch}
                  onChange={(e) => setPitch(e.target.value)}
                  rows={6}
                  required
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting}
                  className="font-mono text-[9px] uppercase"
                >
                  Save pitch
                </Button>
              </form>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                {application.pitch}
              </p>
            )}
            <Link
              to="/applications"
              className="mt-4 inline-block text-sm text-accent-blue hover:text-bone"
            >
              View all applications →
            </Link>
          </div>
        ) : canApply ? (
          <form
            onSubmit={onApply}
            className="mt-10 rounded-sm border border-border/60 bg-background/70 p-6 space-y-4"
          >
            <h2 className="font-display text-lg text-bone">Apply to this project</h2>
            <p className="text-sm text-muted-foreground">
              Your profile (bio, background, interests, LinkedIn, GitHub) will be attached for the
              lead.
            </p>
            <div className="space-y-2">
              <Label htmlFor="pitch">Why you? What would you ship in 30 days?</Label>
              <PitchTemplates onSelect={setPitch} />
              <Textarea
                id="pitch"
                required
                rows={5}
                value={pitch}
                onChange={(e) => setPitch(e.target.value)}
                placeholder="Short pitch — specific beats generic."
              />
            </div>
            {profile?.linkedin_url ? (
              <p className="text-xs text-muted-foreground">
                LinkedIn attached:{" "}
                <a
                  href={profile.linkedin_url}
                  className="text-accent-blue hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  {profile.linkedin_url}
                </a>
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Tip: add your LinkedIn in{" "}
                <Link to="/profile" className="text-accent-blue hover:underline">
                  profile settings
                </Link>
                .
              </p>
            )}
            <Button
              type="submit"
              disabled={submitting}
              className="font-mono text-[10px] tracking-[0.2em] uppercase"
            >
              {submitting ? "Submitting…" : "Submit application"}
            </Button>
          </form>
        ) : isFull && project.status === "open" ? (
          <p className="mt-10 text-sm text-muted-foreground font-mono uppercase tracking-wider">
            This project is at capacity. Save it and watch for openings.
          </p>
        ) : project.status !== "open" ? (
          <p className="mt-10 text-sm text-muted-foreground font-mono uppercase tracking-wider">
            This project is not accepting applications.
          </p>
        ) : null}

        {application && user ? (
          <ProjectMemberWorkspace
            project={project}
            application={application}
            teamMembers={teamMembers}
          />
        ) : null}

        <ProjectUpdatesSection
          projectId={project.id}
          canPost={isLead}
          authorId={user?.id}
          authorName={profile?.full_name ?? undefined}
        />

        {isLead ? (
          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              to={`/projects/manage/${project.slug}`}
              className="inline-flex font-mono text-[10px] tracking-[0.25em] uppercase text-accent-green hover:text-bone"
            >
              Manage applications →
            </Link>
            <Link
              to={`/projects/edit/${project.slug}`}
              className="inline-flex font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground hover:text-bone"
            >
              Edit project →
            </Link>
          </div>
        ) : null}

        {related.length > 0 ? (
          <section className="mt-14">
            <h2 className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-4">
              Related threads
            </h2>
            <div className="grid gap-px border border-border/40 bg-border/40">
              {related.map((r) => (
                <Link
                  key={r.id}
                  to={`/projects/${r.slug}`}
                  className="bg-background/75 p-5 hover:bg-bone/5 transition block"
                >
                  <div className="flex gap-2">
                    <ProjectTypeBadge type={r.type} />
                    <ProjectStatusBadge status={r.status} />
                  </div>
                  <h3 className="font-display text-lg text-bone mt-2">{r.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{r.description}</p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </MemberLayout>
  );
}
