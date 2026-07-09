import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { RequireAuth } from "@/components/auth/RequireAuth";
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
import { fetchProjectBySlug, updateProject } from "@/lib/projects";
import type { Project, ProjectStatus, ProjectType } from "@/lib/types";

export const Route = createFileRoute("/projects/edit/$slug")({
  component: EditProjectPage,
});

function EditProjectPage() {
  return (
    <RequireAuth>
      <RequireProjectLead>
        <EditProjectForm />
      </RequireProjectLead>
    </RequireAuth>
  );
}

function EditProjectForm() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ProjectType>("research");
  const [status, setStatus] = useState<ProjectStatus>("open");
  const [skills, setSkills] = useState("");
  const [tags, setTags] = useState("");
  const [capacity, setCapacity] = useState("5");
  const [discordUrl, setDiscordUrl] = useState("");
  const [published, setPublished] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

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
        setDiscordUrl(p.discord_url ?? "");
        setPublished(p.published);
      }
      setLoading(false);
    });
  }, [slug]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    setSubmitting(true);
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
      discord_url: discordUrl || null,
      published,
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
          </div>
        </div>
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
            <Label htmlFor="discord">Discord URL</Label>
            <Input
              id="discord"
              placeholder="https://discord.gg/…"
              value={discordUrl}
              onChange={(e) => setDiscordUrl(e.target.value)}
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
          />
          Published on project board
        </label>
        <div className="flex flex-wrap gap-3">
          <Button
            type="submit"
            disabled={submitting}
            className="font-mono text-[10px] tracking-[0.2em] uppercase"
          >
            {submitting ? "Saving…" : "Save changes"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={submitting}
            onClick={() => {
              setPublished(false);
              void (async () => {
                setSubmitting(true);
                const { error } = await updateProject(project.id, { published: false });
                setSubmitting(false);
                if (error) toast.error(error);
                else {
                  toast.success("Project unpublished.");
                  void navigate({ to: "/projects/manage" });
                }
              })();
            }}
            className="font-mono text-[10px] tracking-[0.2em] uppercase text-accent-red"
          >
            Unpublish
          </Button>
          <Link
            to={`/projects/manage/${project.slug}`}
            className="inline-flex items-center font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground hover:text-bone px-4"
          >
            Cancel
          </Link>
        </div>
      </form>
    </MemberLayout>
  );
}
