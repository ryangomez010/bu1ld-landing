import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { bulkSetContentPublished } from "@/lib/content";
import { useAuth } from "@/lib/auth";
import type { Job, MlEvent, NewsletterIssue, Paper } from "@/lib/types";

type ContentTable = "events" | "papers" | "newsletter_issues" | "jobs";

type BulkItem = { id: string; title: string; published: boolean };

function mapItems(
  table: ContentTable,
  events: MlEvent[],
  papers: Paper[],
  newsletters: NewsletterIssue[],
  jobs: Job[],
): BulkItem[] {
  switch (table) {
    case "events":
      return events.map((e) => ({ id: e.id, title: e.title, published: e.published }));
    case "papers":
      return papers.map((p) => ({ id: p.id, title: p.title, published: p.published }));
    case "newsletter_issues":
      return newsletters.map((n) => ({ id: n.id, title: n.title, published: n.published }));
    case "jobs":
      return jobs.map((j) => ({ id: j.id, title: j.title, published: j.published }));
  }
}

export function AdminBulkPublishTab({
  events,
  papers,
  newsletters,
  jobs,
  onSaved,
}: {
  events: MlEvent[];
  papers: Paper[];
  newsletters: NewsletterIssue[];
  jobs: Job[];
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const [table, setTable] = useState<ContentTable>("papers");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const items = mapItems(table, events, papers, newsletters, jobs);

  const toggleAll = (checked: boolean) => {
    setSelected(checked ? new Set(items.map((i) => i.id)) : new Set());
  };

  const toggleOne = (id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const onBulk = async (publish: boolean) => {
    if (!selected.size) {
      toast.error("Select at least one item.");
      return;
    }
    setBusy(true);
    const { error, count } = await bulkSetContentPublished(table, [...selected], publish, user?.id);
    setBusy(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success(
      `${publish ? "Published" : "Unpublished"} ${count} item${count !== 1 ? "s" : ""}.`,
    );
    setSelected(new Set());
    onSaved();
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground max-w-2xl">
        Bulk publish or unpublish content. Changes are logged in the audit trail.
      </p>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["papers", "Papers"],
            ["events", "Events"],
            ["newsletter_issues", "Newsletter"],
            ["jobs", "Jobs"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setTable(key);
              setSelected(new Set());
            }}
            className={`rounded-sm border px-3 py-1.5 font-mono text-[10px] tracking-[0.15em] uppercase transition ${
              table === key
                ? "border-accent-blue bg-accent-blue/10 text-bone"
                : "border-border/60 text-muted-foreground hover:border-bone/30"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
          <Checkbox
            checked={selected.size === items.length && items.length > 0}
            onCheckedChange={(v) => toggleAll(v === true)}
          />
          Select all ({items.length})
        </label>
        <Button
          type="button"
          size="sm"
          disabled={busy || !selected.size}
          onClick={() => void onBulk(true)}
          className="font-mono text-[9px] tracking-[0.15em] uppercase"
        >
          Publish selected
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy || !selected.size}
          onClick={() => void onBulk(false)}
          className="font-mono text-[9px] tracking-[0.15em] uppercase"
        >
          Unpublish selected
        </Button>
      </div>

      <div className="grid gap-px border border-border/40 bg-border/40 max-h-[480px] overflow-y-auto">
        {items.map((item) => (
          <label
            key={item.id}
            className="flex items-center gap-3 bg-background/75 px-4 py-3 cursor-pointer hover:bg-bone/5"
          >
            <Checkbox
              checked={selected.has(item.id)}
              onCheckedChange={(v) => toggleOne(item.id, v === true)}
            />
            <span className="text-bone text-sm flex-1">{item.title}</span>
            <span
              className={`font-mono text-[8px] tracking-[0.15em] uppercase ${
                item.published ? "text-accent-green" : "text-muted-foreground"
              }`}
            >
              {item.published ? "Live" : "Draft"}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
