import { Link } from "@tanstack/react-router";

import { ConfirmButton } from "@/components/member/ConfirmButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type AdminContentRowProps = {
  title: string;
  published: boolean;
  draftLabel?: string;
  viewHref?: string;
  editing: boolean;
  editFields: React.ReactNode;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onTogglePublish: () => void;
  onDelete: () => void;
};

export function AdminContentRow({
  title,
  published,
  draftLabel = "draft",
  viewHref,
  editing,
  editFields,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onTogglePublish,
  onDelete,
}: AdminContentRowProps) {
  return (
    <li className="border-b border-border/40 pb-3 text-bone admin-row-hover px-2 -mx-2 rounded-sm">
      {editing ? (
        <div className="space-y-2 mb-2">
          {editFields}
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={onSaveEdit}
              className="font-mono text-[9px] uppercase"
            >
              Save
            </Button>
            <button
              type="button"
              onClick={onCancelEdit}
              className="font-mono text-[9px] uppercase text-muted-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <span>{title}</span>
          {!published ? (
            <span className="font-mono text-[8px] uppercase text-accent-red">{draftLabel}</span>
          ) : null}
        </div>
      )}
      <div className="mt-2 flex flex-wrap gap-3 font-mono text-[9px] uppercase tracking-[0.15em]">
        {viewHref ? (
          <Link to={viewHref} className="text-accent-blue">
            view
          </Link>
        ) : null}
        {!editing ? (
          <button
            type="button"
            onClick={onStartEdit}
            className="text-muted-foreground hover:text-bone"
          >
            edit
          </button>
        ) : null}
        <button
          type="button"
          onClick={onTogglePublish}
          className="text-muted-foreground hover:text-bone"
        >
          {published ? "unpublish" : "publish"}
        </button>
        <ConfirmButton
          title={`Delete “${title}”?`}
          description="This permanently removes this content item."
          confirmLabel="Delete"
          destructive
          onConfirm={onDelete}
          trigger={
            <button type="button" className="text-accent-red hover:text-bone">
              delete
            </button>
          }
        />
      </div>
    </li>
  );
}

export function AdminEditTitleSummary({
  title,
  summary,
  onTitle,
  onSummary,
}: {
  title: string;
  summary: string;
  onTitle: (v: string) => void;
  onSummary: (v: string) => void;
}) {
  return (
    <>
      <Input value={title} onChange={(e) => onTitle(e.target.value)} />
      <Textarea value={summary} onChange={(e) => onSummary(e.target.value)} rows={2} />
    </>
  );
}
