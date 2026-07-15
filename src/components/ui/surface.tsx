/* eslint-disable react-refresh/only-export-components -- UI primitive modules intentionally export variant helpers. */
import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const surfaceVariants = cva("panel relative", {
  variants: {
    variant: {
      default: "",
      glass: "glass",
      subtle: "glass-subtle",
    },
    radius: {
      sm: "rounded-sm",
      md: "rounded-xl",
      lg: "rounded-2xl",
    },
    padding: {
      none: "",
      sm: "p-4",
      md: "p-6",
      lg: "p-8",
    },
    interactive: {
      true: "panel-interactive surface-card-interactive",
      false: "",
    },
  },
  defaultVariants: {
    variant: "default",
    radius: "md",
    padding: "md",
    interactive: false,
  },
});

export interface SurfaceProps
  extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof surfaceVariants> {}

export function Surface({
  className,
  variant,
  radius,
  padding,
  interactive,
  ...props
}: SurfaceProps) {
  return (
    <div
      className={cn(surfaceVariants({ variant, radius, padding, interactive }), className)}
      {...props}
    />
  );
}

export { surfaceVariants };
