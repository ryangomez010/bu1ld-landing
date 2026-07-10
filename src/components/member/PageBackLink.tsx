import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";

export function PageBackLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="mb-6 inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.22em] uppercase text-muted-foreground hover:text-bone transition"
    >
      <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
      {label}
    </Link>
  );
}
