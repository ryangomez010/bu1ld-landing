import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { RequireMember } from "@/components/auth/RequireAuth";
import { RequireProjectLead } from "@/components/auth/RequireProjectLead";
import { MemberLayout } from "@/components/member/MemberLayout";
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
import { fetchPublishedLabs } from "@/lib/labs";
import { fetchProjectBySlug, updateProject } from "@/lib/projects";
import { projectManageLink } from "@/lib/app-paths";
import type { Lab, Project, ProjectStatus, ProjectType } from "@/lib/types";

export const Route = createFileRoute("/projects/edit/$slug")({
  component: EditProjectPage,
});

function EditProjectPage() {
  return (
    <RequireMember>
      <RequireProjectLead>
        <EditProjectForm />
      </RequireProjectLead>
    </RequireMember>
  );
}

function EditProjectForm() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ProjectType>("research");
  const [status, setStatus] = useState<ProjectStatus>("open");
  const [skills, setSkills] = useState("");
  const [tags, setTags] = useState("");
  const [capacity, setCapacity] = useState("5");
  const [weeklyHours, setWeeklyHours] = useState("");
  const [discordUrl, setDiscordUrl] = useState("");
  const [workspaceLinksText, setWorkspaceLinksText] = useState("");
  const [labId, setLabId] = useState("none");
  const [labs, setLabs] = useState<Lab[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchPublishedLabs().then((rows) =>
      setLabs(rows.filter((l) => !l.id.startsWith("seed-"))),
    );
  }, []);

  useEffect(() => {
    void fetchProjectBySlug(slug).then((p) => {
      setProject(p);
      if (p) {
        setTitle(p.title);
        setDescription(p.description);
        setType(p.type);
        setStatus(p.status);
        setSkills(p.skills_needed.join(", "));
        setTags(p.tags.join(", "));
        setCapacity(String(p.capacity));
        setWeeklyHours(p.weekly_commitment_hours != null ? String(p.weekly_commitment_hours) : "");
        setDiscordUrl(p.discord_url ?? "");
        setWorkspaceLinksText(
          (p.workspace_links ?? []).map((l) => `${l.label} | ${l.url}`).join("\n"),
        );
        setLabId(p.lab_id && !p.lab_id.startsWith("seed-") ? p.lab_id : "none");
      }
      setLoading(false);
    });
  }, [slug]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    setSubmitting(true);
    const workspace_links = workspaceLinksText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [label, ...rest] = line.split("|");
        const url = rest.join("|").trim();
        return { label: label.trim(), url };
      })
      .filter((l) => l.label && l.url);

    const hoursParsed = weeklyHours.trim() ? Number(weeklyHours) : null;
    const { error } = await updateProject(project.id, {
      title,
      description,
      type,
      status,
      skills_needed: skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      tags: tags
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      capacity: Number(capacity) || 5,
      weekly_commitment_hours:
        hoursParsed != null && Number.isFinite(hoursParsed) ? hoursParsed : null,
      discord_url: discordUrl || null,
      workspace_links,
      lab_id: labId === "none" ? null : labId,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Project updated.");
    void navigate({ to: `/projects/manage/${project.slug}` });
  };

  if (loading) {
    return (
      <MemberLayout>
        <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground animate-pulse">
          Loading…
        </p>
      </MemberLayout>
    );
  }

  if (!project) {
    return (
      <MemberLayout title="Not found">
        <Link to="/projects/manage" className="text-accent-blue text-sm">
          ← My projects
        </Link>
      </MemberLayout>
    );
  }

  if (project.lead_id !== user?.id && profile?.role !== "admin") {
    return (
      <MemberLayout title="Project access denied" eyebrow="project lead">
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
          You can edit only projects you lead. Project roles do not grant access to another
          lead&apos;s private brief or management controls.
        </p>
        <Link to="/projects/manage" className="mt-5 inline-block text-sm text-accent-blue">
          ← My projects
        </Link>
      </MemberLayout>
    );
  }

  return (
    <MemberLayout title="Edit project" eyebrow="project lead">
      <form onSubmit={onSubmit} className="max-w-xl space-y-5 -mt-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as ProjectType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="research">Research</SelectItem>
                <SelectItem value="startup">Startup</SelectItem>
                <SelectItem value="program">Program</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as ProjectStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Open accepts applications. Active keeps the workspace available but closes intake.
              Closed preserves the project as a read-only alumni record.
            </p>
          </div>
        </div>
        {labs.length > 0 || labId !== "none" ? (
          <div className="space-y-2">
            <Label>Lab (optional)</Label>
            <Select value={labId} onValueChange={setLabId}>
              <SelectTrigger>
                <SelectValue placeholder="No lab" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No lab</SelectItem>
                {labs.map((lab) => (
                  <SelectItem key={lab.id} value={lab.id}>
                    {lab.short_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            required
            rows={6}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="skills">Skills needed (comma-separated)</Label>
          <Input id="skills" value={skills} onChange={(e) => setSkills(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tags">Tags (comma-separated)</Label>
          <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="capacity">Team capacity</Label>
            <Input
              id="capacity"
              type="number"
              min={1}
              max={50}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="weeklyHours">Expected hours / week</Label>
            <Input
              id="weeklyHours"
              type="number"
              min={1}
              max={60}
              value={weeklyHours}
              onChange={(e) => setWeeklyHours(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="discord">Discord URL</Label>
            <Input
              id="discord"
              placeholder="https://discord.gg/…"
              value={discordUrl}
              onChange={(e) => setDiscordUrl(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="workspace">Workspace links (one per line: Label | /path or URL)</Label>
          <Textarea
            id="workspace"
            rows={4}
            placeholder={"Paper thread | /papers/residual-event-tokenization\nResearch | /research"}
            value={workspaceLinksText}
            onChange={(e) => setWorkspaceLinksText(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Shown to accepted members in the project workspace panel.
          </p>
        </div>
        <p className="rounded-sm border border-border/50 bg-bone/[0.02] p-4 text-xs leading-relaxed text-muted-foreground">
          Publication is controlled by institutional review. Edit the brief and submit revisions
          from My projects; administrators publish or archive the public listing.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button
            type="submit"
            disabled={submitting}
            className="font-mono text-[10px] tracking-[0.2em] uppercase"
          >
            {submitting ? "Saving…" : "Save changes"}
          </Button>
          <Link
            {...projectManageLink(project.slug)}
            className="inline-flex items-center font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground hover:text-bone px-4"
          >
            Cancel
          </Link>
        </div>
      </form>
    </MemberLayout>
  );
}
