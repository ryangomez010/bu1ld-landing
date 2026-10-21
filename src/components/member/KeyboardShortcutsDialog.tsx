import { useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const SHORTCUTS = [
  { keys: ["⌘ / Ctrl", "K"], label: "Open command palette" },
  { keys: ["/"], label: "Focus search on the search page" },
  { keys: ["?"], label: "Show keyboard shortcuts" },
  { keys: ["Esc"], label: "Close dialogs" },
] as const;

export function KeyboardShortcutsDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "?" && !e.metaKey && !e.ctrlKey && !e.altKey && !e.defaultPrevented) {
        const target = e.target as HTMLElement | null;
        if (target?.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]'))
          return;
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="glass-strong border-border/60 max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-bone">Keyboard shortcuts</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Keyboard shortcuts work anywhere in the member area — except when you are typing in a
            form field or text area.
          </DialogDescription>
        </DialogHeader>
        <ul className="mt-4 space-y-3">
          {SHORTCUTS.map(({ keys, label }) => (
            <li key={label} className="flex items-center justify-between gap-4">
              <span className="text-sm text-bone">{label}</span>
              <span className="flex items-center gap-1">
                {keys.map((k) => (
                  <kbd key={k} className="kbd">
                    {k}
                  </kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
