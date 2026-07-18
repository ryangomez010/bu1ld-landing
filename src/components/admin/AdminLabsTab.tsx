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
import { setLabPublished, upsertLabAdmin } from "@/lib/labs";
import type { Lab } from "@/lib/types";

const COLORS = ["blue", "green", "red", "bone", "violet", "orange"] as const;

export function AdminLabsTab({ labs, onSaved }: { labs: Lab[]; onSaved: () => void }) {
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [tagline, setTagline] = useState("");
  const [summary, setSummary] = useState("");
  const [color, setColor] = useState<string>("bone");
  const [published, setPublished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const resetForm = () => {
    setSlug("");
    setName("");
    setShortName("");
    setTagline("");
    setSummary("");
    setColor("bone");
    setPublished(false);
    setEditingId(null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await upsertLabAdmin(
      {
        slug,
        name,
        short_name: shortName,
        tagline,
        summary,
        color,
        published,
      },
      editingId ?? undefined,
    );
    setSaving(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success(editingId ? "Lab updated." : "Lab saved.");
    resetForm();
    onSaved();
  };

  const startEdit = (lab: Lab) => {
    if (lab.id.startsWith("seed-")) {
      toast.error("This lab is a catalog preview and cannot be edited yet.");
      return;
    }
    setEditingId(lab.id);
    setSlug(lab.slug);
    setName(lab.name);
    setShortName(lab.short_name);
    setTagline(lab.tagline);
    setSummary(lab.summary);
    setColor(lab.color);
    setPublished(lab.published);
  };

  const togglePublish = async (lab: Lab) => {
    const { error } = await setLabPublished(lab.id, !lab.published);
    if (error) toast.error(error);
    else {
      toast.success(lab.published ? "Unpublished." : "Published.");
      onSaved();
    }
  };

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <form onSubmit={onSubmit} className="space-y-4 rounded-sm border border-border/60 p-6">
        <div>
          <h2 className="font-display text-lg text-bone">{editingId ? "Edit lab" : "New lab"}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Publish only when focus, methods, and open roles are ready for the public site.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="lab-slug">Slug</Label>
          <Input
            id="lab-slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
            placeholder="scientific-discovery"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lab-name">Name</Label>
          <Input id="lab-name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lab-short">Short name</Label>
          <Input
            id="lab-short"
            value={shortName}
            onChange={(e) => setShortName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lab-tagline">Tagline</Label>
          <Input id="lab-tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lab-summary">Summary</Label>
          <Textarea
            id="lab-summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={5}
            required
            minLength={20}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Color</Label>
            <Select value={color} onValueChange={setColor}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COLORS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-end gap-2 pb-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
            />
            Published
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="submit"
            disabled={saving}
            className="font-mono text-[10px] tracking-[0.2em] uppercase"
          >
            {saving ? "Saving…" : editingId ? "Update lab" : "Save lab"}
          </Button>
          {editingId ? (
            <Button
              type="button"
              variant="ghost"
              onClick={resetForm}
              className="font-mono text-[10px] tracking-[0.2em] uppercase"
            >
              Cancel edit
            </Button>
          ) : null}
        </div>
      </form>

      <div>
        <h2 className="mb-4 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          Existing ({labs.length})
        </h2>
        <ul className="space-y-3 text-sm">
          {labs.map((lab) => (
            <li key={lab.id} className="rounded-sm border border-border/50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-bone">{lab.short_name}</p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    {lab.slug} · {lab.published ? "published" : "draft"}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{lab.tagline}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => startEdit(lab)}
                    className="font-mono text-[9px] uppercase tracking-[0.14em]"
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => void togglePublish(lab)}
                    className="font-mono text-[9px] uppercase tracking-[0.14em]"
                  >
                    {lab.published ? "Unpublish" : "Publish"}
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
