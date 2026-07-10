import { FilterChip } from "@/components/member/FilterChip";
import { cn } from "@/lib/utils";

export type FilterOption<T extends string> = {
  value: T;
  label: string;
  count?: number;
};

export function FilterBar<T extends string>({
  options,
  value,
  onChange,
  className,
  sticky,
}: {
  options: FilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  sticky?: boolean;
}) {
  return (
    <div className={cn("flex flex-wrap gap-2", sticky && "filter-bar-sticky", className)}>
      {options.map((opt) => (
        <FilterChip
          key={opt.value}
          active={value === opt.value}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
          {opt.count != null && opt.count > 0 ? ` (${opt.count})` : ""}
        </FilterChip>
      ))}
    </div>
  );
}
