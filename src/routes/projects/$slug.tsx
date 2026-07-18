import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { InstitutionLayout } from "@/components/institution/InstitutionLayout";
import { clearPitchDraft, loadPitchDraft, savePitchDraft } from "@/lib/application-draft";
import { InterestMatchTags } from "@/components/member/InterestMatchTags";
import { ApplicationNextSteps } from "@/components/member/ApplicationNextSteps";
import { ApplicationStatusTimeline } from "@/components/member/ApplicationStatusTimeline";
import { CapacityBar } from "@/components/member/CapacityBar";
import { ResourceNotFound } from "@/components/member/ResourceNotFound";
import { LoadingState } from "@/components/member/LoadingState";
import { TagList } from "@/components/member/ContentCard";
import { PitchTemplates } from "@/components/member/PitchTemplates";
import { FollowProjectButton } from "@/components/member/FollowProjectButton";
import { ReportContentButton } from "@/components/member/ReportContentButton";
import { SaveToCollectionButton } from "@/components/member/SaveToCollectionButton";
import { MemberLayout } from "@/components/member/MemberLayout";
import { PageBackLink } from "@/components/member/PageBackLink";
import { ProjectMemberWorkspace } from "@/components/member/ProjectMemberWorkspace";
import { ProjectUpdatesSection } from "@/components/member/ProjectUpdatesSection";
import { ProjectEvidenceSection } from "@/components/member/ProjectEvidenceSection";
import { ProjectWorkspaceExtras } from "@/components/member/ProjectWorkspaceExtras";
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
import { memberLink, projectEditLink, projectLink, projectManageLink } from "@/lib/app-paths";
import {
  applyToProject,
  fetchProjectBySlug,
  fetchProjectTeamMembers,
  fetchProjects,
  getApplicationForProject,
  relatedProjects,
  updateApplicationPitch,
} from "@/lib/projects";
import {
  fetchProjectQuestions,
  type ProjectApplicationQuestion,
} from "@/lib/project-application-questions";
import { Input } from "@/components/ui/input";
import { pushRecentView } from "@/lib/recent-views";
import type { Project, ProjectApplication } from "@/lib/types";
import { fetchProjectMembership } from "@/lib/project-collaboration";
import { isAdministrator } from "@/lib/roles";

export const Route = createFileRoute("/projects/$slug")({
  component: ProjectDetailPage,
});

function ProjectDetailPage() {
  return <ProjectDetail />;
}

function ProjectPageLayout({ title, children }: { title: string; children: React.ReactNode }) {
  const { user } = useAuth();
  return user ? (
    <MemberLayout>{children}</MemberLayout>
  ) : (
    <InstitutionLayout
      eyebrow="Published opportunity"
      title={title}
      description="Review the brief, skills, capacity, commitment, status, and verified public output before deciding whether to apply."
    >
      {children}
    </InstitutionLayout>
  );
}

function ProjectDetail() {
  const { slug } = Route.useParams();
  const { user, profile } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [application, setApplication] = useState<ProjectApplication | null>(null);
  const [related, setRelated] = useState<Project[]>([]);
  const [teamMembers, setTeamMembers] = useState<Array<{ name: string; userId: string }>>([]);
  const [isCollaborator, setIsCollaborator] = useState(false);
  const [pitch, setPitch] = useState("");
  const [editingPitch, setEditingPitch] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<ProjectApplicationQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    void Promise.all([fetchProjectBySlug(slug), fetchProjects()]).then(([p, all]) => {
      setProject(p);
      if (p) {
        setRelated(relatedProjects(p, all));
        void fetchProjectTeamMembers(p.id).then(setTeamMembers);
        void fetchProjectQuestions(p.id).then(setQuestions);
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
    void fetchProjectMembership(project.id, user.id).then((membership) => {
      setIsCollaborator(membership?.status === "active" || membership?.status === "paused");
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
    for (const q of questions) {
      if (q.required && !answers[q.id]?.trim().length) {
        toast.error("Answer all required application questions.");
        return;
      }
    }
    setSubmitting(true);
    const { error } = await applyToProject(
      user.id,
      project,
      pitch,
      profile,
      questions.map((q) => ({ questionId: q.id, answer: answers[q.id] ?? "" })),
    );
    setSubmitting(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Application submitted.");
    clearPitchDraft(user.id, project.id);
    void getApplicationForProject(user.id, project.id).then(setApplication);
    setPitch("");
    setAnswers({});
  };

  if (loading) {
    return (
      <ProjectPageLayout title="Loading project">
        <LoadingState />
      </ProjectPageLayout>
    );
  }

  if (!project) {
    return (
      <ProjectPageLayout title="Project not found">
        <ResourceNotFound
          title="Project not found"
          body="This project may have been removed or the link is outdated."
          backTo="/projects"
          backLabel="← Back to projects"
        />
      </ProjectPageLayout>
    );
  }

  const isFull = project.team_count >= project.capacity;
  const canApply = Boolean(user) && project.status === "open" && !application && !isFull;
  const isLead = project.lead_id === user?.id || isAdministrator(profile);

  return (
    <ProjectPageLayout title={project.title}>
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
        {user ? (
          <h1 className="mt-4 font-display text-4xl tracking-tight text-bone">{project.title}</h1>
        ) : (
          <h2 className="mt-4 font-display text-4xl tracking-tight text-bone">{project.title}</h2>
        )}
        {!project.published && project.lead_id === user?.id ? (
          <div className="mt-4 max-w-3xl rounded-sm border border-accent-blue/30 bg-accent-blue/5 p-4 text-sm leading-relaxed text-muted-foreground">
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent-blue">
              {project.publication_status === "submitted"
                ? "Editorial review in progress"
                : project.publication_status === "changes_requested"
                  ? "Revisions requested"
                  : "Private draft"}
            </p>
            <p className="mt-2">
              {project.publication_note ??
                "Only you and administrators can see this brief until it is approved for the project directory."}
            </p>
          </div>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center gap-3">
          {user ? (
            <>
              <SaveToCollectionButton
                itemType="project"
                itemSlug={project.slug}
                itemTitle={project.title}
              />
              <FollowProjectButton projectId={project.id} />
              <ReportContentButton contentType="project" contentSlug={project.slug} />
            </>
          ) : null}
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
          {project.lead_name ? `Lead: ${project.lead_name}` : "The Bu1ld collective"} ·{" "}
          {project.team_count}/{project.capacity} builders
          {project.weekly_commitment_hours ? ` · ~${project.weekly_commitment_hours} hrs/week` : ""}
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
                  {...memberLink(m.userId)}
                  className="rounded-sm border border-border/60 px-3 py-2 text-sm text-bone hover:border-bone/30 transition"
                >
                  {m.name}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {user && project.discord_url ? (
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
            <ApplicationNextSteps status={application.status} projectSlug={project.slug} />
            {application.review_note ? (
              <div className="mt-4 rounded-sm border border-border/50 bg-background/50 p-4">
                <p className="font-mono text-[8px] tracking-[0.2em] uppercase text-muted-foreground">
                  Note from the project lead
                </p>
                <p className="mt-2 text-sm leading-relaxed text-foreground/90">
                  {application.review_note}
                </p>
              </div>
            ) : null}
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
        ) : !user && project.status === "open" && !isFull ? (
          <section className="mt-10 rounded-sm border border-accent-blue/30 bg-accent-blue/5 p-6">
            <h2 className="font-display text-xl text-bone">Apply through a member profile</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Create an account, complete your skills and availability, then return here to submit a
              project-specific pitch. The lead reviews applications inside the private project
              workspace.
            </p>
            <div className="mt-5 flex flex-wrap gap-4">
              <Link
                to="/signup"
                search={{ redirect: `/projects/${project.slug}` }}
                className="rounded-sm bg-bone px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-background"
              >
                Create account
              </Link>
              <Link
                to="/login"
                search={{ redirect: `/projects/${project.slug}` }}
                className="px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-accent-blue"
              >
                Log in to apply
              </Link>
            </div>
          </section>
        ) : canApply ? (
          <form
            onSubmit={onApply}
            className="mt-10 rounded-sm border border-border/60 bg-background/70 p-6 space-y-4"
          >
            <h2 className="font-display text-lg text-bone">Apply to this project</h2>
            <p className="text-sm text-muted-foreground">
              Submitting attaches your full profile to the lead's review queue: display name, bio,
              background, interest tags, GitHub, and LinkedIn. The pitch below is the only free-text
              field — be specific about what you would ship in the first 30 days.
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
                placeholder="Name the thread, cite one relevant repo or paper, and list a concrete 30-day deliverable — not a generic interest statement."
              />
            </div>
            {questions.map((q) => (
              <div key={q.id} className="space-y-2">
                <Label htmlFor={`q-${q.id}`}>
                  {q.prompt}
                  {q.required ? " *" : ""}
                </Label>
                <Input
                  id={`q-${q.id}`}
                  required={q.required}
                  value={answers[q.id] ?? ""}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                />
              </div>
            ))}
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
          projectSlug={project.slug}
          projectTitle={project.title}
          canPost={isLead || isCollaborator}
          authorId={user?.id}
          authorName={profile?.full_name ?? undefined}
        />

        <ProjectEvidenceSection
          projectId={project.id}
          userId={user?.id}
          canManage={isLead}
          isCollaborator={isCollaborator}
        />

        {isLead || isCollaborator ? (
          <ProjectWorkspaceExtras
            projectId={project.id}
            userId={user?.id}
            canEdit={isLead || isCollaborator}
            canManage={isLead}
          />
        ) : null}

        {isLead ? (
          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              {...projectManageLink(project.slug)}
              className="inline-flex font-mono text-[10px] tracking-[0.25em] uppercase text-accent-green hover:text-bone"
            >
              Manage applications →
            </Link>
            <Link
              {...projectEditLink(project.slug)}
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
                  {...projectLink(r.slug)}
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
    </ProjectPageLayout>
  );
}
