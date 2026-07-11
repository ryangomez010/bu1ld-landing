import { useState } from "react";
import { toast } from "sonner";

import { AdminContentRow } from "@/components/admin/AdminContentRow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createJob, deleteJob, setJobPublished, updateJobAdmin } from "@/lib/projects";
import type { Job } from "@/lib/types";

export function AdminJobsTab({ jobs, onSaved }: { jobs: Job[]; onSaved: () => void }) {
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState("");
  const [source, setSource] = useState<Job["source"]>("internal");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCompany, setEditCompany] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await createJob({ title, company, description, source });
    setSaving(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Job published.");
    setTitle("");
    setCompany("");
    setDescription("");
    onSaved();
  };

  return (
    <div className="grid lg:grid-cols-2 gap-10">
      <form onSubmit={onSubmit} className="space-y-4 rounded-sm border border-border/60 p-6">
        <h2 className="font-display text-lg text-bone">New job listing</h2>
        <div className="space-y-2">
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Company</Label>
          <Input value={company} onChange={(e) => setCompany(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Source</Label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value as Job["source"])}
            className="w-full rounded-sm border border-border/60 bg-background px-3 py-2 text-sm"
          >
            <option value="internal">Internal (The Bu1ld)</option>
            <option value="external">External (vetted)</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            required
          />
        </div>
        <Button
          type="submit"
          disabled={saving}
          className="font-mono text-[10px] tracking-[0.2em] uppercase"
        >
          {saving ? "Saving…" : "Publish job"}
        </Button>
      </form>
      <div>
        <h2 className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-4">
          Existing ({jobs.length})
        </h2>
        <ul className="space-y-3 text-sm">
          {jobs.map((j) => (
            <AdminContentRow
              key={j.id}
              title={`${j.title} (${j.source})`}
              published={j.published}
              viewHref={`/jobs/${j.slug}`}
              editing={editingId === j.id}
              editFields={
                <>
                  <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                  <Input
                    value={editCompany}
                    onChange={(e) => setEditCompany(e.target.value)}
                    placeholder="Company"
                  />
                  <Textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={4}
                  />
                </>
              }
              onStartEdit={() => {
                setEditingId(j.id);
                setEditTitle(j.title);
                setEditCompany(j.company);
                setEditDescription(j.description);
              }}
              onCancelEdit={() => setEditingId(null)}
              onSaveEdit={() => {
                void updateJobAdmin(j.id, {
                  title: editTitle,
                  company: editCompany,
                  description: editDescription,
                }).then(({ error }) => {
                  if (error) toast.error(error);
                  else {
                    toast.success("Job updated.");
                    setEditingId(null);
                    onSaved();
                  }
                });
              }}
              onTogglePublish={() =>
                void setJobPublished(j.id, !j.published).then(({ error }) => {
                  if (error) toast.error(error);
                  else {
                    toast.success(j.published ? "Unpublished." : "Published.");
                    onSaved();
                  }
                })
              }
              onDelete={() => {
                void deleteJob(j.id).then(({ error }) => {
                  if (error) toast.error(error);
                  else {
                    toast.success("Deleted.");
                    onSaved();
                  }
                });
              }}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}
