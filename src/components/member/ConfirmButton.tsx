import type { ReactNode } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function ConfirmButton({
  trigger,
  title,
  description,
  confirmLabel = "Confirm",
  onConfirm,
  destructive,
}: {
  trigger: ReactNode;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
  destructive?: boolean;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent className="bg-background border-border/60">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display text-bone">{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="font-mono text-[10px] tracking-[0.15em] uppercase">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => void onConfirm()}
            className={`font-mono text-[10px] tracking-[0.15em] uppercase ${
              destructive ? "bg-accent-red hover:bg-accent-red/90" : ""
            }`}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
