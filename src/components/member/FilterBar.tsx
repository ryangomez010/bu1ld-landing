import { FilterChip } from "@/components/member/FilterChip";

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
}: {
  options: FilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap gap-2 ${className ?? ""}`}>
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
