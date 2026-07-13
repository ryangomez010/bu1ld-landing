import { useState } from "react";
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
  createProgram,
  deleteProgramAdmin,
  reviewProgramApplication,
  setProgramPublished,
  updateProgramAdmin,
} from "@/lib/programs";
import type { Program, ProgramApplication, ProgramType } from "@/lib/types";

export function AdminProgramsTab({
  programs,
  applications,
  onSaved,
}: {
  programs: Program[];
  applications: ProgramApplication[];
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [programType, setProgramType] = useState<ProgramType>("cohort");
  const [summary, setSummary] = useState("");
  const [instructions, setInstructions] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [capacity, setCapacity] = useState("");
  const [applicationsOpenAt, setApplicationsOpenAt] = useState("");
  const [applicationsCloseAt, setApplicationsCloseAt] = useState("");
  const [outcomes, setOutcomes] = useState("");
  const [saving, setSaving] = useState(false);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSummary, setEditSummary] = useState("");
  const [editInstructions, setEditInstructions] = useState("");
  const [editOutcomes, setEditOutcomes] = useState("");
  const [editApplicationsCloseAt, setEditApplicationsCloseAt] = useState("");
  const [editCapacity, setEditCapacity] = useState("");

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const { error } = await createProgram({
      title,
      programType,
      summary,
      applicationInstructions: instructions,
      startsAt: startsAt || undefined,
      endsAt: endsAt || undefined,
      applicationsOpenAt: applicationsOpenAt || undefined,
      applicationsCloseAt: applicationsCloseAt || undefined,
      outcomes,
      capacity: capacity ? Number(capacity) : null,
    });
    setSaving(false);
    if (error) return toast.error(error);
    setTitle("");
    setSummary("");
    setInstructions("");
    setStartsAt("");
    setEndsAt("");
    setCapacity("");
    setApplicationsOpenAt("");
    setApplicationsCloseAt("");
    setOutcomes("");
    toast.success("Program saved as draft.");
    onSaved();
  };

  const decide = async (
    application: ProgramApplication,
    status: "accepted" | "declined" | "waitlist",
  ) => {
    const { error } = await reviewProgramApplication(
      application.id,
      status,
      reviewNotes[application.id],
    );
    if (error) return toast.error(error);
    toast.success(`Application ${status}.`);
    onSaved();
  };

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <form onSubmit={onSubmit} className="space-y-4 rounded-sm border border-border/60 p-6">
        <div>
          <h2 className="font-display text-lg text-bone">New program</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Publish only after dates, capacity, and the application process are confirmed.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="program-title">Title</Label>
          <Input
            id="program-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Format</Label>
          <Select
            value={programType}
            onValueChange={(value) => setProgramType(value as ProgramType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cohort">Cohort</SelectItem>
              <SelectItem value="fellowship">Fellowship</SelectItem>
              <SelectItem value="workshop">Workshop</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="program-summary">Specific outcome and scope</Label>
          <Textarea
            id="program-summary"
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            minLength={20}
            rows={4}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="program-instructions">Application and working instructions</Label>
          <Textarea
            id="program-instructions"
            value={instructions}
            onChange={(event) => setInstructions(event.target.value)}
            rows={5}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Starts</Label>
            <Input
              type="date"
              value={startsAt}
              onChange={(event) => setStartsAt(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Ends</Label>
            <Input type="date" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Places</Label>
            <Input
              type="number"
              min="1"
              max="200"
              value={capacity}
              onChange={(event) => setCapacity(event.target.value)}
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Applications open</Label>
            <Input
              type="datetime-local"
              value={applicationsOpenAt}
              onChange={(event) => setApplicationsOpenAt(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Applications close</Label>
            <Input
              type="datetime-local"
              value={applicationsCloseAt}
              onChange={(event) => setApplicationsCloseAt(event.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="program-outcomes">Expected outputs and completion bar</Label>
          <Textarea
            id="program-outcomes"
            value={outcomes}
            onChange={(event) => setOutcomes(event.target.value)}
            rows={4}
          />
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save draft"}
        </Button>
      </form>
      <div>
        <h2 className="mb-4 font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
          Programs ({programs.length})
        </h2>
        <div className="space-y-3">
          {programs.map((program) => (
            <article key={program.id} className="rounded-sm border border-border/50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[8px] uppercase text-accent-green">
                    {program.program_type} · {program.published ? "published" : "draft"}
                  </p>
                  <h3 className="mt-2 text-sm text-bone">{program.title}</h3>
                  {editingId === program.id ? (
                    <div className="mt-3 space-y-3">
                      <Textarea
                        value={editSummary}
                        onChange={(event) => setEditSummary(event.target.value)}
                        rows={3}
                        aria-label="Program summary"
                      />
                      <Textarea
                        value={editInstructions}
                        onChange={(event) => setEditInstructions(event.target.value)}
                        rows={3}
                        aria-label="Application instructions"
                      />
                      <Textarea
                        value={editOutcomes}
                        onChange={(event) => setEditOutcomes(event.target.value)}
                        rows={3}
                        aria-label="Expected outcomes"
                      />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Input
                          type="datetime-local"
                          value={editApplicationsCloseAt}
                          onChange={(event) => setEditApplicationsCloseAt(event.target.value)}
                          aria-label="Applications close"
                        />
                        <Input
                          type="number"
                          min="1"
                          max="200"
                          value={editCapacity}
                          onChange={(event) => setEditCapacity(event.target.value)}
                          aria-label="Capacity"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() =>
                            void updateProgramAdmin(program.id, {
                              summary: editSummary,
                              applicationInstructions: editInstructions,
                              outcomes: editOutcomes,
                              applicationsCloseAt: editApplicationsCloseAt,
                              capacity: editCapacity ? Number(editCapacity) : null,
                            }).then(({ error }) => {
                              if (error) toast.error(error);
                              else {
                                toast.success("Program updated.");
                                setEditingId(null);
                                onSaved();
                              }
                            })
                          }
                        >
                          Save changes
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                        {program.summary}
                      </p>
                      {program.outcomes ? (
                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                          <span className="text-bone">Output:</span> {program.outcomes}
                        </p>
                      ) : null}
                    </>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      void setProgramPublished(program.id, !program.published).then(({ error }) => {
                        if (error) toast.error(error);
                        else {
                          toast.success(program.published ? "Unpublished." : "Published.");
                          onSaved();
                        }
                      })
                    }
                  >
                    {program.published ? "Unpublish" : "Publish"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingId(program.id);
                      setEditSummary(program.summary);
                      setEditInstructions(program.application_instructions ?? "");
                      setEditOutcomes(program.outcomes ?? "");
                      setEditApplicationsCloseAt(program.applications_close_at?.slice(0, 16) ?? "");
                      setEditCapacity(program.capacity?.toString() ?? "");
                    }}
                  >
                    Edit
                  </Button>
                  {!program.published ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-accent-red"
                      onClick={() =>
                        void deleteProgramAdmin(program.id).then(({ error }) => {
                          if (error) toast.error(error);
                          else {
                            toast.success("Draft deleted.");
                            onSaved();
                          }
                        })
                      }
                    >
                      Delete
                    </Button>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
          {programs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No programs yet.</p>
          ) : null}
        </div>
      </div>
      <section className="lg:col-span-2 border-t border-border/60 pt-8">
        <div className="mb-5">
          <h2 className="font-display text-lg text-bone">Programme applications</h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Decisions are private to the applicant. Accepting is capacity-aware; when a programme is
            full, the application can be waitlisted or declined with a clear note.
          </p>
        </div>
        <div className="space-y-4">
          {applications.map((application) => (
            <article key={application.id} className="rounded-sm border border-border/60 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent-green">
                    {application.program_title ?? "Programme"} · {application.status}
                  </p>
                  <h3 className="mt-2 text-base text-bone">
                    {application.applicant_name ?? "Member"}
                  </h3>
                  {application.applicant_background ? (
                    <p className="mt-1 font-mono text-[8px] uppercase text-muted-foreground">
                      {application.applicant_background}
                    </p>
                  ) : null}
                </div>
                <p className="font-mono text-[9px] uppercase text-muted-foreground">
                  {new Date(application.created_at).toLocaleDateString()}
                </p>
              </div>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {application.statement}
              </p>
              {application.review_note ? (
                <p className="mt-3 border-l-2 border-accent-blue/50 pl-3 text-sm text-muted-foreground">
                  Prior note: {application.review_note}
                </p>
              ) : null}
              <div className="mt-4 space-y-2">
                <Label htmlFor={`program-review-${application.id}`}>Private decision note</Label>
                <Textarea
                  id={`program-review-${application.id}`}
                  rows={2}
                  value={reviewNotes[application.id] ?? ""}
                  onChange={(event) =>
                    setReviewNotes((current) => ({
                      ...current,
                      [application.id]: event.target.value,
                    }))
                  }
                  placeholder="Optional for acceptance; explain a waitlist or decline clearly."
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {application.status !== "accepted" ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void decide(application, "accepted")}
                  >
                    Accept
                  </Button>
                ) : null}
                {application.status !== "waitlist" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void decide(application, "waitlist")}
                  >
                    Waitlist
                  </Button>
                ) : null}
                {application.status !== "declined" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-accent-red"
                    onClick={() => void decide(application, "declined")}
                  >
                    Decline
                  </Button>
                ) : null}
              </div>
            </article>
          ))}
          {applications.length === 0 ? (
            <p className="text-sm text-muted-foreground">No programme applications yet.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
