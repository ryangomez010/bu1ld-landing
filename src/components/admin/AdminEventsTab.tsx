import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { slugify } from "@/data/seed/content";
import { deleteContentRow, setContentPublished, updateEventAdmin } from "@/lib/content";
import { getSupabase } from "@/lib/supabase";
import type { EventResource, MlEvent } from "@/lib/types";
import { eventLink } from "@/lib/app-paths";

export function AdminEventsTab({ events, onSaved }: { events: MlEvent[]; onSaved: () => void }) {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [topics, setTopics] = useState("");
  const [prepNotes, setPrepNotes] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [url, setUrl] = useState("");
  const [deadlinesText, setDeadlinesText] = useState("");
  const [resourcesText, setResourcesText] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSummary, setEditSummary] = useState("");

  const parseDeadlines = () =>
    deadlinesText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [label, date] = line.split("|").map((s) => s.trim());
        return label && date ? { label, date } : null;
      })
      .filter(Boolean) as { label: string; date: string }[];

  const parseResources = () =>
    resourcesText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [label, resourceUrl, kind] = line.split("|").map((s) => s.trim());
        return label && resourceUrl
          ? { label, url: resourceUrl, kind: (kind || "other") as EventResource["kind"] }
          : null;
      })
      .filter(Boolean) as EventResource[];

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getSupabase();
    if (!supabase) {
      toast.error("Event publishing is temporarily unavailable.");
      return;
    }
    setSaving(true);
    const slug = slugify(title);
    const { error } = await supabase.from("events").insert({
      slug,
      title,
      summary: summary || null,
      topics: topics
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      prep_notes: prepNotes || null,
      location: location || null,
      start_date: startDate || null,
      end_date: endDate || null,
      url: url || null,
      resources: parseResources(),
      deadlines: parseDeadlines(),
      published: false,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Event saved as draft.");
    setTitle("");
    setSummary("");
    setTopics("");
    setPrepNotes("");
    setLocation("");
    setStartDate("");
    setEndDate("");
    setUrl("");
    setDeadlinesText("");
    setResourcesText("");
    onSaved();
  };

  const togglePublish = async (ev: MlEvent) => {
    const { error } = await setContentPublished("events", ev.id, !ev.published);
    if (error) toast.error(error);
    else {
      toast.success(ev.published ? "Unpublished." : "Published.");
      onSaved();
    }
  };

  const onDelete = async (ev: MlEvent) => {
    const { error } = await deleteContentRow("events", ev.id);
    if (error) toast.error(error);
    else {
      toast.success("Deleted.");
      onSaved();
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-10">
      <form onSubmit={onSubmit} className="space-y-4 rounded-sm border border-border/60 p-6">
        <h2 className="font-display text-lg text-bone">New event</h2>
        <div className="space-y-2">
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Summary</Label>
          <Textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            minLength={20}
            rows={3}
            required
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Location</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Official URL</Label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Start date</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>End date</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Topics (comma-separated)</Label>
          <Input value={topics} onChange={(e) => setTopics(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Deadlines (one per line: Label | YYYY-MM-DD)</Label>
          <Textarea
            value={deadlinesText}
            onChange={(e) => setDeadlinesText(e.target.value)}
            rows={3}
            placeholder="Abstract | 2026-09-01"
          />
        </div>
        <div className="space-y-2">
          <Label>Resources (one per line: Label | URL | kind)</Label>
          <Textarea
            value={resourcesText}
            onChange={(e) => setResourcesText(e.target.value)}
            rows={3}
            placeholder="CFP | https://… | cfp"
          />
        </div>
        <div className="space-y-2">
          <Label>Preparation notes, acceptance criteria, or reading list</Label>
          <Textarea
            value={prepNotes}
            onChange={(e) => setPrepNotes(e.target.value)}
            rows={6}
            placeholder="Name the technical theme, accepted paper or project targets, review expectations, and exact source links members should use before attending."
          />
        </div>
        <Button
          type="submit"
          disabled={saving}
          className="font-mono text-[10px] tracking-[0.2em] uppercase"
        >
          {saving ? "Saving…" : "Save as draft"}
        </Button>
      </form>
      <div>
        <h2 className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-4">
          Existing ({events.length})
        </h2>
        <ul className="space-y-3 text-sm">
          {events.map((ev) => (
            <li key={ev.id} className="border-b border-border/40 pb-3 text-bone">
              {editingId === ev.id ? (
                <div className="space-y-2 mb-2">
                  <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                  <Textarea
                    value={editSummary}
                    onChange={(e) => setEditSummary(e.target.value)}
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        void updateEventAdmin(ev.id, {
                          title: editTitle,
                          summary: editSummary || null,
                        }).then(({ error }) => {
                          if (error) toast.error(error);
                          else {
                            toast.success("Event updated.");
                            setEditingId(null);
                            onSaved();
                          }
                        });
                      }}
                      className="font-mono text-[9px] uppercase"
                    >
                      Save
                    </Button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="font-mono text-[9px] uppercase text-muted-foreground"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <span>{ev.title}</span>
                  {!ev.published ? (
                    <span className="font-mono text-[8px] uppercase text-accent-red">draft</span>
                  ) : null}
                </div>
              )}
              <div className="mt-2 flex flex-wrap gap-3 font-mono text-[9px] uppercase tracking-[0.15em]">
                <Link {...eventLink(ev.slug)} className="text-accent-blue">
                  view
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(ev.id);
                    setEditTitle(ev.title);
                    setEditSummary(ev.summary ?? "");
                  }}
                  className="text-muted-foreground hover:text-bone"
                >
                  edit
                </button>
                <button
                  type="button"
                  onClick={() => void togglePublish(ev)}
                  className="text-muted-foreground hover:text-bone"
                >
                  {ev.published ? "unpublish" : "publish"}
                </button>
                <button
                  type="button"
                  onClick={() => void onDelete(ev)}
                  className="text-accent-red hover:text-bone"
                >
                  delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
