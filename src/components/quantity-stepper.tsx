import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/cn";

export function QuantityStepper({
  value,
  min = 1,
  max,
  onChange,
}: {
  value: number
  min?: number
  max: number
  onChange: (value: number) => void
}) {
  return (
    <div className="inline-flex items-center rounded-lg bg-elevated shadow-border">
      <button
        type="button"
        className={cn(
          "flex size-11 items-center justify-center text-fg",
          value <= min && "opacity-30",
        )}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        aria-label="Меньше"
      >
        <Minus className="size-4" />
      </button>
      <span className="min-w-8 text-center text-sm tabular-nums">{value}</span>
      <button
        type="button"
        className={cn(
          "flex size-11 items-center justify-center text-fg",
          value >= max && "opacity-30",
        )}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        aria-label="Больше"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
