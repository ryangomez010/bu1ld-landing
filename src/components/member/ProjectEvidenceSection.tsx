import { useCallback, useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";

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
import {
  createMilestone,
  fetchProjectContributions,
  fetchProjectMilestones,
  submitContribution,
  resubmitContribution,
  updateContribution,
  updateMilestoneStatus,
  verifyContribution,
} from "@/lib/project-collaboration";
import type { ContributionType, ProjectContribution, ProjectMilestone } from "@/lib/types";

const CONTRIBUTION_TYPES: ContributionType[] = [
  "research",
  "experiment",
  "code",
  "review",
  "design",
  "product",
  "operations",
];

export function ProjectEvidenceSection({
  projectId,
  userId,
  canManage,
  isCollaborator,
}: {
  projectId: string;
  userId?: string;
  canManage: boolean;
  isCollaborator: boolean;
}) {
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [contributions, setContributions] = useState<ProjectContribution[]>([]);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [showContributionForm, setShowContributionForm] = useState(false);
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [milestoneDescription, setMilestoneDescription] = useState("");
  const [milestoneDueDate, setMilestoneDueDate] = useState("");
  const [milestoneVisibility, setMilestoneVisibility] = useState<"team" | "public">("team");
  const [contributionTitle, setContributionTitle] = useState("");
  const [contributionSummary, setContributionSummary] = useState("");
  const [contributionType, setContributionType] = useState<ContributionType>("research");
  const [contributionMilestoneId, setContributionMilestoneId] = useState("none");
  const [contributionVisibility, setContributionVisibility] = useState<"team" | "public">("team");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [editingContributionId, setEditingContributionId] = useState<string | null>(null);
  const [editContributionTitle, setEditContributionTitle] = useState("");
  const [editContributionSummary, setEditContributionSummary] = useState("");
  const [editContributionEvidence, setEditContributionEvidence] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reload = useCallback(() => {
    void Promise.all([
      fetchProjectMilestones(projectId),
      fetchProjectContributions(projectId),
    ]).then(([nextMilestones, nextContributions]) => {
      setMilestones(nextMilestones);
      setContributions(nextContributions);
    });
  }, [projectId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const saveMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSubmitting(true);
    const { error } = await createMilestone(userId, {
      projectId,
      title: milestoneTitle,
      description: milestoneDescription,
      dueDate: milestoneDueDate || undefined,
      visibility: milestoneVisibility,
    });
    setSubmitting(false);
    if (error) return toast.error(error);
    toast.success("Milestone created.");
    setMilestoneTitle("");
    setMilestoneDescription("");
    setMilestoneDueDate("");
    setShowMilestoneForm(false);
    reload();
  };

  const saveContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSubmitting(true);
    const { error } = await submitContribution(userId, {
      projectId,
      milestoneId: contributionMilestoneId === "none" ? null : contributionMilestoneId,
      contributionType,
      title: contributionTitle,
      summary: contributionSummary,
      evidenceUrl,
      visibility: contributionVisibility,
    });
    setSubmitting(false);
    if (error) return toast.error(error);
    toast.success("Contribution submitted for verification.");
    setContributionTitle("");
    setContributionSummary("");
    setEvidenceUrl("");
    setContributionMilestoneId("none");
    setShowContributionForm(false);
    reload();
  };

  if (!isCollaborator && !canManage) return null;

  return (
    <section className="mt-10 rounded-sm border border-border/60 bg-background/70 p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-accent-green">
            Collaboration record
          </p>
          <h2 className="mt-2 font-display text-xl text-bone">Milestones and contributions</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            This is the project’s internal evidence trail. Contributions are attributed to members
            and verified by a project lead before they are treated as completed work.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canManage ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setShowMilestoneForm((v) => !v)}
            >
              Add milestone
            </Button>
          ) : null}
          <Button type="button" size="sm" onClick={() => setShowContributionForm((v) => !v)}>
            Record contribution
          </Button>
        </div>
      </div>

      {showMilestoneForm ? (
        <form
          onSubmit={saveMilestone}
          className="mt-5 grid gap-3 rounded-sm border border-border/50 p-4"
        >
          <Label htmlFor="milestone-title">Milestone title</Label>
          <Input
            id="milestone-title"
            value={milestoneTitle}
            onChange={(e) => setMilestoneTitle(e.target.value)}
            required
          />
          <Label htmlFor="milestone-description">Success condition</Label>
          <Textarea
            id="milestone-description"
            value={milestoneDescription}
            onChange={(e) => setMilestoneDescription(e.target.value)}
            required
            rows={3}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="milestone-due-date">Target date (optional)</Label>
              <Input
                id="milestone-due-date"
                type="date"
                value={milestoneDueDate}
                onChange={(e) => setMilestoneDueDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Visibility</Label>
              <Select
                value={milestoneVisibility}
                onValueChange={(value) => setMilestoneVisibility(value as "team" | "public")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="team">Team only</SelectItem>
                  <SelectItem value="public">Public evidence</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button type="submit" size="sm" disabled={submitting} className="w-fit">
            {submitting ? "Saving…" : "Create milestone"}
          </Button>
        </form>
      ) : null}

      {showContributionForm ? (
        <form
          onSubmit={saveContribution}
          className="mt-5 grid gap-3 rounded-sm border border-accent-blue/25 bg-accent-blue/[0.03] p-4"
        >
          <Label htmlFor="contribution-type">Contribution type</Label>
          <Select
            value={contributionType}
            onValueChange={(v) => setContributionType(v as ContributionType)}
          >
            <SelectTrigger id="contribution-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONTRIBUTION_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {milestones.length > 0 ? (
            <>
              <Label>Related milestone</Label>
              <Select value={contributionMilestoneId} onValueChange={setContributionMilestoneId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No milestone</SelectItem>
                  {milestones.map((milestone) => (
                    <SelectItem key={milestone.id} value={milestone.id}>
                      {milestone.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          ) : null}
          <Label htmlFor="contribution-title">What did you deliver?</Label>
          <Input
            id="contribution-title"
            value={contributionTitle}
            onChange={(e) => setContributionTitle(e.target.value)}
            required
          />
          <Label htmlFor="contribution-summary">Method, result, and limitation</Label>
          <Textarea
            id="contribution-summary"
            value={contributionSummary}
            onChange={(e) => setContributionSummary(e.target.value)}
            required
            rows={4}
          />
          <Label htmlFor="contribution-evidence">Evidence link (optional)</Label>
          <Input
            id="contribution-evidence"
            type="url"
            placeholder="https://github.com/… or experiment report"
            value={evidenceUrl}
            onChange={(e) => setEvidenceUrl(e.target.value)}
          />
          <Label>Visibility</Label>
          <Select
            value={contributionVisibility}
            onValueChange={(value) => setContributionVisibility(value as "team" | "public")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="team">Team only</SelectItem>
              <SelectItem value="public">Public evidence</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" size="sm" disabled={submitting} className="w-fit">
            {submitting ? "Submitting…" : "Submit contribution"}
          </Button>
        </form>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground">
            Milestones
          </h3>
          <div className="mt-3 space-y-2">
            {milestones.length === 0 ? (
              <p className="text-sm text-muted-foreground">No milestones have been recorded yet.</p>
            ) : (
              milestones.map((milestone) => (
                <article key={milestone.id} className="rounded-sm border border-border/50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-bone">{milestone.title}</p>
                    <span className="font-mono text-[8px] uppercase text-muted-foreground">
                      {milestone.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {milestone.description}
                  </p>
                  {milestone.due_date ? (
                    <p className="mt-2 font-mono text-[8px] uppercase text-muted-foreground">
                      Target {new Date(`${milestone.due_date}T00:00:00`).toLocaleDateString()}
                    </p>
                  ) : null}
                  {canManage ? (
                    <Select
                      value={milestone.status}
                      onValueChange={(status) =>
                        void updateMilestoneStatus(
                          milestone.id,
                          status as ProjectMilestone["status"],
                        ).then(({ error }) => {
                          if (error) toast.error(error);
                          else reload();
                        })
                      }
                    >
                      <SelectTrigger className="mt-3 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planned">Planned</SelectItem>
                        <SelectItem value="in_progress">In progress</SelectItem>
                        <SelectItem value="blocked">Blocked</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : null}
                </article>
              ))
            )}
          </div>
        </div>
        <div>
          <h3 className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground">
            Contributions
          </h3>
          <div className="mt-3 space-y-2">
            {contributions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No contributions have been submitted yet.
              </p>
            ) : (
              contributions.map((contribution) => (
                <article key={contribution.id} className="rounded-sm border border-border/50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-bone">{contribution.title}</p>
                    <span className="font-mono text-[8px] uppercase text-muted-foreground">
                      {contribution.verification_status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-[8px] uppercase text-accent-blue">
                    {contribution.contribution_type}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {contribution.summary}
                  </p>
                  {contribution.evidence_url ? (
                    <a
                      href={contribution.evidence_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs text-accent-blue hover:text-bone"
                    >
                      Evidence <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : null}
                  {contribution.verification_note ? (
                    <p className="mt-3 border-l-2 border-accent-blue/50 pl-3 text-xs leading-relaxed text-muted-foreground">
                      Review note: {contribution.verification_note}
                    </p>
                  ) : null}
                  {contribution.contributor_id === userId &&
                  contribution.verification_status === "needs_changes" ? (
                    editingContributionId === contribution.id ? (
                      <form
                        className="mt-3 space-y-2 border-t border-border/40 pt-3"
                        onSubmit={(event) => {
                          event.preventDefault();
                          setSubmitting(true);
                          void updateContribution(contribution.id, {
                            title: editContributionTitle,
                            summary: editContributionSummary,
                            evidenceUrl: editContributionEvidence,
                          }).then(async ({ error }) => {
                            if (!error) ({ error } = await resubmitContribution(contribution.id));
                            setSubmitting(false);
                            if (error) toast.error(error);
                            else {
                              toast.success("Contribution revised and resubmitted.");
                              setEditingContributionId(null);
                              reload();
                            }
                          });
                        }}
                      >
                        <Input
                          value={editContributionTitle}
                          onChange={(event) => setEditContributionTitle(event.target.value)}
                          aria-label="Contribution title"
                          required
                        />
                        <Textarea
                          value={editContributionSummary}
                          onChange={(event) => setEditContributionSummary(event.target.value)}
                          aria-label="Contribution summary"
                          rows={4}
                          required
                        />
                        <Input
                          type="url"
                          value={editContributionEvidence}
                          onChange={(event) => setEditContributionEvidence(event.target.value)}
                          aria-label="Evidence URL"
                        />
                        <div className="flex gap-2">
                          <Button type="submit" size="sm" disabled={submitting}>
                            {submitting ? "Resubmitting…" : "Save and resubmit"}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingContributionId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="mt-3"
                        onClick={() => {
                          setEditingContributionId(contribution.id);
                          setEditContributionTitle(contribution.title);
                          setEditContributionSummary(contribution.summary);
                          setEditContributionEvidence(contribution.evidence_url ?? "");
                        }}
                      >
                        Revise contribution
                      </Button>
                    )
                  ) : null}
                  {canManage && contribution.verification_status === "submitted" ? (
                    <div className="mt-3 space-y-2 border-t border-border/40 pt-3">
                      <Textarea
                        value={reviewNotes[contribution.id] ?? ""}
                        onChange={(event) =>
                          setReviewNotes((current) => ({
                            ...current,
                            [contribution.id]: event.target.value,
                          }))
                        }
                        rows={2}
                        aria-label={`Review note for ${contribution.title}`}
                        placeholder="Explain what was verified, or specify the revision required."
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() =>
                            void verifyContribution(
                              contribution.id,
                              "verified",
                              reviewNotes[contribution.id],
                            ).then(({ error }) => {
                              if (error) toast.error(error);
                              else {
                                toast.success("Contribution verified.");
                                reload();
                              }
                            })
                          }
                        >
                          Verify
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            void verifyContribution(
                              contribution.id,
                              "needs_changes",
                              reviewNotes[contribution.id],
                            ).then(({ error }) => {
                              if (error) toast.error(error);
                              else {
                                toast.success("Revision request recorded.");
                                reload();
                              }
                            })
                          }
                        >
                          Request changes
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </article>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
