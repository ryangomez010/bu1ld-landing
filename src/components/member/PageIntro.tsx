import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function PageIntro({
  children,
  className,
  tight,
}: {
  children: ReactNode;
  className?: string;
  /** Pull up under MemberLayout page header */
  tight?: boolean;
}) {
  return <p className={cn("page-intro", tight && "page-intro-tight", className)}>{children}</p>;
}
