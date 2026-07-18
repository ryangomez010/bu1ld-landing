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
import { createProject } from "@/lib/projects";
import type { Lab, ProjectType } from "@/lib/types";

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
  const [weeklyHours, setWeeklyHours] = useState("");
  const [discordUrl, setDiscordUrl] = useState("");
  const [labId, setLabId] = useState("none");
  const [labs, setLabs] = useState<Lab[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void fetchPublishedLabs().then((rows) =>
      setLabs(rows.filter((l) => !l.id.startsWith("seed-"))),
    );
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    const hoursParsed = weeklyHours.trim() ? Number(weeklyHours) : null;
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
      weekly_commitment_hours:
        hoursParsed != null && Number.isFinite(hoursParsed) ? hoursParsed : null,
      discord_url: discordUrl || null,
      lab_id: labId === "none" ? null : labId,
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
        {labs.length > 0 ? (
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
          <Label htmlFor="weeklyHours">Expected hours / week (optional)</Label>
          <Input
            id="weeklyHours"
            type="number"
            min={1}
            max={60}
            value={weeklyHours}
            onChange={(e) => setWeeklyHours(e.target.value)}
            placeholder="e.g. 8"
          />
          <p className="text-xs text-muted-foreground">
            Shown on the listing so builders can match commitment before applying.
          </p>
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
