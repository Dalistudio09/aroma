import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "min-h-12 w-full appearance-none rounded-lg bg-elevated px-4 text-base text-fg shadow-border outline-none",
        "focus:shadow-[0_0_0_1px_var(--color-accent)]",
        className,
      )}
      {...props}
    />
  );
}
