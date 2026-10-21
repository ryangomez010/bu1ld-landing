import { Link, type LinkProps } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";

import { cn } from "@/lib/utils";

export function PageBackLink({
  to,
  label,
  className,
  search,
}: {
  to: NonNullable<LinkProps["to"]>;
  label: string;
  className?: string;
  search?: LinkProps["search"];
}) {
  return (
    <Link
      to={to}
      search={search}
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
