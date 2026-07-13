import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
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
import { createProject } from "@/lib/projects";
import type { ProjectType } from "@/lib/types";

export const Route = createFileRoute("/projects/new")({
  component: NewProjectPage,
});

function NewProjectPage() {
  return (
    <RequireMember>
      <RequireProjectLead>
        <NewProjectForm />
      </RequireProjectLead>
    </RequireMember>
  );
}

function NewProjectForm() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ProjectType>("research");
  const [skills, setSkills] = useState("");
  const [tags, setTags] = useState("");
  const [capacity, setCapacity] = useState("5");
  const [discordUrl, setDiscordUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    const { project, error } = await createProject(user.id, profile?.full_name ?? "Lead", {
      title,
      description,
      type,
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
    });
    setSubmitting(false);
    if (error || !project) {
      toast.error(error ?? "Failed to create project.");
      return;
    }
    toast.success("Draft created. Submit it for editorial review when the brief is complete.");
    void navigate({ to: "/projects/manage" });
  };

  return (
    <MemberLayout title="Create project" eyebrow="project lead">
      <p className="text-muted-foreground mb-6 max-w-2xl leading-relaxed -mt-4">
        Start with a clear, private draft. After you specify the question or product goal, skills,
        capacity, and working context, submit it for editorial review. Only approved briefs appear
        in the open project directory.
      </p>
      <form onSubmit={onSubmit} className="max-w-xl space-y-5">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
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
          <Input
            id="skills"
            placeholder="PyTorch, Python, World models"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tags">Tags (comma-separated)</Label>
          <Input
            id="tags"
            placeholder="World models, tokenization"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </div>
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
          <Label htmlFor="discord">Discord URL (optional)</Label>
          <Input
            id="discord"
            placeholder="https://discord.gg/…"
            value={discordUrl}
            onChange={(e) => setDiscordUrl(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={submitting}
            className="font-mono text-[10px] tracking-[0.2em] uppercase"
          >
            {submitting ? "Creating…" : "Create draft"}
          </Button>
          <Link
            to="/projects/manage"
            className="inline-flex items-center font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground hover:text-bone px-4"
          >
            Cancel
          </Link>
        </div>
      </form>
    </MemberLayout>
  );
}
