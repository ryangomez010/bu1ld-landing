import { useCallback, useEffect, useState } from "react";
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
  createProjectDataset,
  fetchProjectDatasets,
  type ProjectDataset,
} from "@/lib/project-datasets";
import {
  createProjectDeliverable,
  createProjectExperiment,
  fetchProjectDeliverables,
  fetchProjectExperiments,
  reviewProjectDeliverable,
  updateExperimentStatus,
  type ExperimentStatus,
  type ProjectDeliverable,
  type ProjectExperiment,
} from "@/lib/project-experiments";
import { safeHref } from "@/lib/urls";

export function ProjectWorkspaceExtras({
  projectId,
  userId,
  canEdit = true,
  canManage = false,
}: {
  projectId: string;
  userId?: string;
  /** When false, lists are read-only (accepted collaborators). */
  canEdit?: boolean;
  /** Lead/admin may change experiment status and review deliverables. */
  canManage?: boolean;
}) {
  const [experiments, setExperiments] = useState<ProjectExperiment[]>([]);
  const [deliverables, setDeliverables] = useState<ProjectDeliverable[]>([]);
  const [datasets, setDatasets] = useState<ProjectDataset[]>([]);
  const [expTitle, setExpTitle] = useState("");
  const [expHypothesis, setExpHypothesis] = useState("");
  const [delTitle, setDelTitle] = useState("");
  const [delDescription, setDelDescription] = useState("");
  const [dsName, setDsName] = useState("");
  const [dsUrl, setDsUrl] = useState("");
  const [busy, setBusy] = useState(false);

  const reload = useCallback(() => {
    void Promise.all([
      fetchProjectExperiments(projectId),
      fetchProjectDeliverables(projectId),
      fetchProjectDatasets(projectId),
    ]).then(([exps, dels, dss]) => {
      setExperiments(exps);
      setDeliverables(dels);
      setDatasets(dss);
    });
  }, [projectId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const addExperiment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setBusy(true);
    const { error } = await createProjectExperiment({
      projectId,
      userId,
      title: expTitle,
      hypothesis: expHypothesis,
    });
    setBusy(false);
    if (error) return toast.error(error);
    setExpTitle("");
    setExpHypothesis("");
    toast.success("Experiment logged.");
    reload();
  };

  const addDeliverable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setBusy(true);
    const { error } = await createProjectDeliverable({
      projectId,
      userId,
      title: delTitle,
      description: delDescription,
    });
    setBusy(false);
    if (error) return toast.error(error);
    setDelTitle("");
    setDelDescription("");
    toast.success("Deliverable submitted.");
    reload();
  };

  const addDataset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setBusy(true);
    const { error } = await createProjectDataset({
      projectId,
      userId,
      name: dsName,
      sourceUrl: dsUrl || undefined,
    });
    setBusy(false);
    if (error) return toast.error(error);
    setDsName("");
    setDsUrl("");
    toast.success("Dataset registered.");
    reload();
  };

  return (
    <div id="project-workspace-extras" className="mt-10 space-y-8 border-t border-border/50 pt-8">
      <section>
        <h2 className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
          Experiments ({experiments.length})
        </h2>
        {experiments.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No experiments logged yet. Capture a hypothesis before running work so results stay
            inspectable.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {experiments.map((exp) => {
              const evidence = safeHref(exp.evidence_url);
              return (
                <li key={exp.id} className="rounded-sm border border-border/40 px-3 py-3 text-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <span className="text-bone">{exp.title}</span>
                      <p className="mt-1 text-xs text-muted-foreground">{exp.hypothesis}</p>
                      {evidence ? (
                        <a
                          href={evidence}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-block text-xs text-accent-blue hover:text-bone"
                        >
                          Evidence →
                        </a>
                      ) : null}
                    </div>
                    {canManage ? (
                      <Select
                        value={exp.status}
                        onValueChange={(status) =>
                          void updateExperimentStatus(exp.id, status as ExperimentStatus).then(
                            ({ error }) => {
                              if (error) toast.error(error);
                              else {
                                toast.success("Experiment status updated.");
                                reload();
                              }
                            },
                          )
                        }
                      >
                        <SelectTrigger className="h-8 w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="planned">Planned</SelectItem>
                          <SelectItem value="running">Running</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="abandoned">Abandoned</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="font-mono text-[9px] uppercase text-muted-foreground">
                        {exp.status}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {canEdit && userId ? (
          <form onSubmit={addExperiment} className="mt-4 grid gap-2 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="exp-title">Title</Label>
              <Input
                id="exp-title"
                value={expTitle}
                onChange={(e) => setExpTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="exp-hyp">Hypothesis</Label>
              <Textarea
                id="exp-hyp"
                value={expHypothesis}
                onChange={(e) => setExpHypothesis(e.target.value)}
                rows={2}
                required
              />
            </div>
            <Button
              type="submit"
              size="sm"
              disabled={busy}
              className="font-mono text-[9px] uppercase tracking-[0.14em]"
            >
              Add experiment
            </Button>
          </form>
        ) : null}
      </section>

      <section>
        <h2 className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
          Deliverables ({deliverables.length})
        </h2>
        {deliverables.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No deliverables submitted yet. Authors submit artifacts; leads accept or request
            revision.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {deliverables.map((d) => {
              const artifact = safeHref(d.artifact_url);
              return (
                <li key={d.id} className="rounded-sm border border-border/40 px-3 py-3 text-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <span className="text-bone">{d.title}</span>
                      {d.description ? (
                        <p className="mt-1 text-xs text-muted-foreground">{d.description}</p>
                      ) : null}
                      {artifact ? (
                        <a
                          href={artifact}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-block text-xs text-accent-blue hover:text-bone"
                        >
                          Artifact →
                        </a>
                      ) : null}
                      {d.review_note ? (
                        <p className="mt-2 text-xs text-muted-foreground">Note: {d.review_note}</p>
                      ) : null}
                    </div>
                    <span className="font-mono text-[9px] uppercase text-muted-foreground">
                      {d.status}
                    </span>
                  </div>
                  {canManage && d.status === "submitted" ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() =>
                          void reviewProjectDeliverable(d.id, "accepted").then(({ error }) => {
                            if (error) toast.error(error);
                            else {
                              toast.success("Deliverable accepted.");
                              reload();
                            }
                          })
                        }
                      >
                        Accept
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          void reviewProjectDeliverable(
                            d.id,
                            "revision_requested",
                            "Please revise the artifact and resubmit.",
                          ).then(({ error }) => {
                            if (error) toast.error(error);
                            else {
                              toast.success("Revision requested.");
                              reload();
                            }
                          })
                        }
                      >
                        Request revision
                      </Button>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
        {canEdit && userId ? (
          <form onSubmit={addDeliverable} className="mt-4 grid gap-2">
            <div className="space-y-1">
              <Label htmlFor="del-title">Title</Label>
              <Input
                id="del-title"
                value={delTitle}
                onChange={(e) => setDelTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="del-desc">Description</Label>
              <Textarea
                id="del-desc"
                value={delDescription}
                onChange={(e) => setDelDescription(e.target.value)}
                rows={2}
              />
            </div>
            <Button
              type="submit"
              size="sm"
              disabled={busy}
              className="w-fit font-mono text-[9px] uppercase tracking-[0.14em]"
            >
              Add deliverable
            </Button>
          </form>
        ) : null}
      </section>

      <section>
        <h2 className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
          Datasets ({datasets.length})
        </h2>
        {datasets.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No datasets registered yet. Link the source URL when a dataset supports project work.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {datasets.map((ds) => {
              const source = safeHref(ds.source_url);
              return (
                <li key={ds.id} className="rounded-sm border border-border/40 px-3 py-2 text-sm">
                  <span className="text-bone">{ds.name}</span>
                  <span className="ml-2 font-mono text-[9px] uppercase text-muted-foreground">
                    {ds.version_label}
                  </span>
                  {source ? (
                    <a
                      href={source}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-3 text-xs text-accent-blue hover:text-bone"
                    >
                      Source →
                    </a>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
        {canEdit && userId ? (
          <form onSubmit={addDataset} className="mt-4 grid gap-2 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="ds-name">Name</Label>
              <Input
                id="ds-name"
                value={dsName}
                onChange={(e) => setDsName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ds-url">Source URL</Label>
              <Input
                id="ds-url"
                type="url"
                value={dsUrl}
                onChange={(e) => setDsUrl(e.target.value)}
                placeholder="https://"
              />
            </div>
            <Button
              type="submit"
              size="sm"
              disabled={busy}
              className="font-mono text-[9px] uppercase tracking-[0.14em]"
            >
              Register dataset
            </Button>
          </form>
        ) : null}
      </section>
    </div>
  );
}
