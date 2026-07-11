import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";

import { cn } from "@/lib/utils";

export function PageBackLink({
  to,
  label,
  className,
}: {
  to: string;
  label: string;
  className?: string;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "mb-6 inline-flex items-center gap-1.5 label-sm text-muted-foreground hover:text-bone transition-colors",
        className,
      )}
    >
      <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
      {label}
    </Link>
  );
}
