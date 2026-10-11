import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  ExternalLink,
  FileCheck2,
  FolderKanban,
  Send,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { RequireMember } from "@/components/auth/RequireAuth";
import { EmptyState } from "@/components/member/ContentCard";
import { ListSkeleton } from "@/components/member/LoadingState";
import { MemberLayout } from "@/components/member/MemberLayout";
import { SectionHeader } from "@/components/member/SectionHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import {
  downloadContributionExport,
  fetchMyContributionsForExport,
} from "@/lib/contribution-export";
import { relativeTime } from "@/lib/date";
import {
  fetchMemberWorkspaceContributions,
  fetchMemberWorkspaceProjects,
  fetchProjectMilestones,
  memberWorkspaceStats,
  resubmitContribution,
  submitContribution,
  updateContribution,
  type MemberWorkspaceContribution,
  type MemberWorkspaceProject,
} from "@/lib/project-collaboration";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { CollaborationVisibility, ContributionType, ProjectMilestone } from "@/lib/types";

export const Route = createFileRoute("/workspace")({
  component: WorkspacePage,
  head: () => ({
    meta: [{ title: "My work — The Bu1ld" }, { name: "robots", content: "noindex, nofollow" }],
  }),
});

const CONTRIBUTION_TYPES: ContributionType[] = [
  "research",
  "experiment",
  "code",
  "review",
  "design",
  "product",
  "operations",
];

function WorkspacePage() {
  return (
    <RequireMember>
      <WorkspaceContent />
    </RequireMember>
  );
}

function WorkspaceContent() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<MemberWorkspaceProject[]>([]);
  const [contributions, setContributions] = useState<MemberWorkspaceContribution[]>([]);
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [projectId, setProjectId] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [contributionType, setContributionType] = useState<ContributionType>("research");
  const [milestoneId, setMilestoneId] = useState("none");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [visibility, setVisibility] = useState<CollaborationVisibility>("team");

  const reloadContributions = useCallback(async () => {
    if (!user) return;
    try {
      setContributions(await fetchMemberWorkspaceContributions(user.id));
      setLoadError(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Contribution records could not be loaded.";
      setLoadError(message);
      toast.error(message);
    }
  }, [user]);

  const loadWorkspace = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setLoadError(null);
    const [projectResult, contributionResult] = await Promise.allSettled([
      fetchMemberWorkspaceProjects(user.id),
      fetchMemberWorkspaceContributions(user.id),
    ]);
    if (projectResult.status === "fulfilled") {
      setProjects(projectResult.value);
      setProjectId((current) =>
        projectResult.value.some((project) => project.id === current)
          ? current
          : projectResult.value[0]?.id || "",
      );
    }
    if (contributionResult.status === "fulfilled") {
      setContributions(contributionResult.value);
    }
    const failure = [projectResult, contributionResult].find(
      (result): result is PromiseRejectedResult => result.status === "rejected",
    );
    if (failure) {
      setLoadError(
        failure.reason instanceof Error
          ? failure.reason.message
          : "The member workspace could not be loaded.",
      );
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  useEffect(() => {
    if (!projectId) {
      setMilestones([]);
      return;
    }
    setMilestoneId("none");
    void fetchProjectMilestones(projectId).then(setMilestones);
  }, [projectId]);

  const stats = useMemo(() => memberWorkspaceStats(contributions), [contributions]);
  const selectedProject = projects.find((project) => project.id === projectId) ?? null;
  const selectedProjectContributions = contributions.filter(
    (contribution) => contribution.project_id === projectId,
  );
  const activeMilestones = milestones.filter((milestone) => milestone.status !== "completed");

  const saveContribution = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !projectId) return;
    setSubmitting(true);
    const { error } = await submitContribution(user.id, {
      projectId,
      milestoneId: milestoneId === "none" ? null : milestoneId,
      contributionType,
      title,
      summary,
      evidenceUrl,
      visibility,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error);
      return;
    }
    setTitle("");
    setSummary("");
    setEvidenceUrl("");
    setMilestoneId("none");
    setVisibility("team");
    toast.success("Contribution submitted for independent verification.");
    await reloadContributions();
  };

  const exportContributions = async () => {
    if (!user) return;
    const { rows, error } = await fetchMyContributionsForExport(user.id);
    if (error) {
      toast.error(error);
      return;
    }
    downloadContributionExport(rows);
    toast.success(`Exported ${rows.length} contribution${rows.length === 1 ? "" : "s"}.`);
  };

  return (
    <MemberLayout title="My work" eyebrow="member evidence workspace">
      <div className="-mt-4 mb-8 flex flex-wrap items-start justify-between gap-4">
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Record what you actually did, attach the artifact, and submit it for review. A submission
          is not a verified outcome until an eligible reviewer accepts the evidence.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void exportContributions()}
          disabled={!isSupabaseConfigured}
        >
          <Download className="mr-2 h-4 w-4" />
          Export evidence log
        </Button>
      </div>

      {loading ? (
        <ListSkeleton rows={5} />
      ) : !isSupabaseConfigured ? (
        <EmptyState
          title="Live member data is not connected"
          body="This workspace is intentionally fail-closed. Configure Supabase before memberships, submissions, or verification records can be read or changed."
          icon={AlertCircle}
        />
      ) : loadError ? (
        <EmptyState
          title="Member workspace unavailable"
          body={`${loadError} No membership or evidence state was changed.`}
          icon={AlertCircle}
          action={
            <Button type="button" variant="outline" onClick={() => void loadWorkspace()}>
              Retry workspace
            </Button>
          }
        />
      ) : projects.length === 0 ? (
        <EmptyState
          title="No active project workspace yet"
          body="Workspace access comes from a durable project membership. Apply to an open project or accept a project invitation; an application alone does not grant evidence access."
          icon={FolderKanban}
          action={
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/projects" className="cta-link">
                Browse projects
              </Link>
              <Link to="/invitations" className="cta-link cta-link-green">
                View invitations
              </Link>
            </div>
          }
        />
      ) : (
        <div className="space-y-10">
          <section
            className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"
            aria-label="Evidence totals"
          >
            <WorkspaceMetric label="All submissions" value={stats.total} tone="blue" />
            <WorkspaceMetric label="Awaiting review" value={stats.submitted} tone="violet" />
            <WorkspaceMetric label="Verified" value={stats.verified} tone="green" />
            <WorkspaceMetric label="Needs changes" value={stats.needsChanges} tone="red" />
          </section>

          {stats.needsChanges > 0 ? (
            <div className="rounded-xl border border-accent-red/30 bg-accent-red/5 p-4">
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-accent-red">
                Revision required
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {stats.needsChanges} submission{stats.needsChanges === 1 ? " has" : "s have"} a
                reviewer note. Revise the evidence below and resubmit it before treating the work as
                complete.
              </p>
            </div>
          ) : null}

          <section>
            <SectionHeader
              title="Project workspace"
              accent="blue"
              description="Choose a durable membership. Project roles and access are enforced by row-level security, not by this interface."
            />
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {projects.map((project) => {
                const selected = project.id === projectId;
                const count = contributions.filter(
                  (contribution) => contribution.project_id === project.id,
                ).length;
                return (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => setProjectId(project.id)}
                    aria-pressed={selected}
                    className={`panel panel-interactive rounded-xl p-5 text-left ${
                      selected ? "border-accent-blue/60 bg-accent-blue/5" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-accent-blue">
                        {project.member_role}
                      </span>
                      <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground">
                        {count} submission{count === 1 ? "" : "s"}
                      </span>
                    </div>
                    <p className="mt-3 font-display text-lg text-bone">{project.title}</p>
                    <p className="mt-2 text-xs capitalize text-muted-foreground">
                      {project.type} · {project.status} · {project.membership_status}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          {selectedProject ? (
            <section className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <div className="panel glass rounded-2xl p-6 md:p-7">
                <SectionHeader
                  title="Submit evidence"
                  accent="green"
                  description={`Add a concrete artifact to ${selectedProject.title}. Team visibility stays inside the project; public evidence appears externally only after verification.`}
                />
                <form className="space-y-5" onSubmit={(event) => void saveContribution(event)}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="workspace-type">Contribution type</Label>
                      <Select
                        value={contributionType}
                        onValueChange={(value) => setContributionType(value as ContributionType)}
                      >
                        <SelectTrigger id="workspace-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CONTRIBUTION_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              <span className="capitalize">{type}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="workspace-milestone">Milestone</Label>
                      <Select value={milestoneId} onValueChange={setMilestoneId}>
                        <SelectTrigger id="workspace-milestone">
                          <SelectValue placeholder="No milestone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No milestone</SelectItem>
                          {activeMilestones.map((milestone) => (
                            <SelectItem key={milestone.id} value={milestone.id}>
                              {milestone.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="workspace-title">Specific result</Label>
                    <Input
                      id="workspace-title"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder="Reproduced baseline under fixed seed 42"
                      minLength={3}
                      maxLength={160}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="workspace-summary">Method, result, and limitation</Label>
                    <Textarea
                      id="workspace-summary"
                      value={summary}
                      onChange={(event) => setSummary(event.target.value)}
                      placeholder="State what you ran or built, the observed result, the comparison or acceptance criterion, and what this evidence does not establish."
                      rows={7}
                      minLength={20}
                      maxLength={4000}
                      required
                    />
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      Synthetic checks, local runs, and partial results should be labeled exactly as
                      such. Negative results are valid evidence.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="workspace-evidence">Evidence URL</Label>
                    <Input
                      id="workspace-evidence"
                      type="url"
                      value={evidenceUrl}
                      onChange={(event) => setEvidenceUrl(event.target.value)}
                      placeholder="https://github.com/…/commit/… or immutable artifact"
                    />
                  </div>

                  <fieldset className="space-y-2">
                    <legend className="text-sm font-medium text-bone">Visibility</legend>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {(["team", "public"] as const).map((option) => (
                        <label
                          key={option}
                          className={`cursor-pointer rounded-lg border p-3 text-sm transition ${
                            visibility === option
                              ? "border-accent-blue/60 bg-accent-blue/5 text-bone"
                              : "border-border/50 text-muted-foreground hover:border-bone/30"
                          }`}
                        >
                          <input
                            className="sr-only"
                            type="radio"
                            name="visibility"
                            value={option}
                            checked={visibility === option}
                            onChange={() => setVisibility(option)}
                          />
                          <span className="capitalize">{option}</span>
                          <span className="mt-1 block text-[11px] leading-relaxed text-muted-foreground">
                            {option === "team"
                              ? "Visible to authorized project collaborators."
                              : "Eligible for the public evidence archive only after verification."}
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <Button type="submit" className="w-full" disabled={submitting}>
                    <Send className="mr-2 h-4 w-4" />
                    {submitting ? "Submitting…" : "Submit for verification"}
                  </Button>
                </form>
              </div>

              <div>
                <SectionHeader
                  title="Evidence log"
                  accent="violet"
                  description={`Your submissions for ${selectedProject.title}. Reviewer decisions and revision notes remain attached to each record.`}
                  action={
                    <Link
                      to="/projects/$slug"
                      params={{ slug: selectedProject.slug }}
                      className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent-blue hover:text-bone"
                    >
                      Open project →
                    </Link>
                  }
                />
                {selectedProjectContributions.length === 0 ? (
                  <EmptyState
                    title="No evidence submitted"
                    body="Add the first concrete result for this project. The record will remain submitted until another eligible member verifies it."
                    icon={FileCheck2}
                  />
                ) : (
                  <div className="space-y-3">
                    {selectedProjectContributions.map((contribution) => (
                      <ContributionCard
                        key={contribution.id}
                        contribution={contribution}
                        onUpdated={reloadContributions}
                      />
                    ))}
                  </div>
                )}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </MemberLayout>
  );
}

function WorkspaceMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "blue" | "green" | "red" | "violet";
}) {
  const toneClass = {
    blue: "text-accent-blue",
    green: "text-accent-green",
    red: "text-accent-red",
    violet: "text-accent-violet",
  }[tone];
  return (
    <div className="panel rounded-xl p-4">
      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
      <p className={`mt-2 font-display text-3xl ${toneClass}`}>{value}</p>
    </div>
  );
}

function ContributionCard({
  contribution,
  onUpdated,
}: {
  contribution: MemberWorkspaceContribution;
  onUpdated: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState(contribution.title);
  const [summary, setSummary] = useState(contribution.summary);
  const [evidenceUrl, setEvidenceUrl] = useState(contribution.evidence_url ?? "");
  const isVerified = contribution.verification_status === "verified";
  const needsChanges = contribution.verification_status === "needs_changes";
  const statusClass = isVerified
    ? "border-accent-green/30 bg-accent-green/10 text-accent-green"
    : needsChanges
      ? "border-accent-red/30 bg-accent-red/10 text-accent-red"
      : "border-accent-violet/30 bg-accent-violet/10 text-accent-violet";

  const revise = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    let { error } = await updateContribution(contribution.id, { title, summary, evidenceUrl });
    if (!error) ({ error } = await resubmitContribution(contribution.id));
    setSaving(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Contribution revised and resubmitted.");
    setEditing(false);
    await onUpdated();
  };

  return (
    <article className="panel glass-subtle rounded-xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-accent-blue">
            {contribution.contribution_type}
            {contribution.milestone_title ? ` · ${contribution.milestone_title}` : ""}
          </p>
          <h3 className="mt-2 font-display text-lg text-bone">{contribution.title}</h3>
        </div>
        <span
          className={`rounded-full border px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.16em] ${statusClass}`}
        >
          {contribution.verification_status.replace("_", " ")}
        </span>
      </div>

      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
        {contribution.summary}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground">
          {relativeTime(contribution.created_at)} · {contribution.visibility}
        </span>
        {contribution.evidence_url ? (
          <a
            href={contribution.evidence_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-accent-blue hover:text-bone"
          >
            Open evidence <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <span className="text-xs text-muted-foreground">No external artifact attached</span>
        )}
      </div>

      {contribution.verification_note ? (
        <div
          className={`mt-4 border-l-2 pl-3 text-xs leading-relaxed text-muted-foreground ${
            needsChanges ? "border-accent-red/60" : "border-accent-green/60"
          }`}
        >
          <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-bone">
            Reviewer note
          </p>
          <p className="mt-1">{contribution.verification_note}</p>
        </div>
      ) : null}

      {isVerified ? (
        <p className="mt-4 inline-flex items-center gap-2 text-xs text-accent-green">
          <CheckCircle2 className="h-4 w-4" /> Independently verified
        </p>
      ) : null}

      {needsChanges && !editing ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="mt-4"
          onClick={() => setEditing(true)}
        >
          Revise evidence
        </Button>
      ) : null}

      {needsChanges && editing ? (
        <form
          className="mt-5 space-y-3 border-t border-border/50 pt-5"
          onSubmit={(event) => void revise(event)}
        >
          <div className="space-y-2">
            <Label htmlFor={`revision-title-${contribution.id}`}>Specific result</Label>
            <Input
              id={`revision-title-${contribution.id}`}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              minLength={3}
              maxLength={160}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`revision-summary-${contribution.id}`}>Revised evidence summary</Label>
            <Textarea
              id={`revision-summary-${contribution.id}`}
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              minLength={20}
              maxLength={4000}
              rows={6}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`revision-url-${contribution.id}`}>Evidence URL</Label>
            <Input
              id={`revision-url-${contribution.id}`}
              type="url"
              value={evidenceUrl}
              onChange={(event) => setEvidenceUrl(event.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? "Resubmitting…" : "Save and resubmit"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}
    </article>
  );
}
