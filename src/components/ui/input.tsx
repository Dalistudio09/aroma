import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      suppressHydrationWarning
      className={cn(
        "min-h-12 w-full rounded-lg bg-elevated px-4 text-base text-fg shadow-border outline-none placeholder:text-subtle",
        "focus:shadow-[0_0_0_1px_var(--color-accent)]",
        className,
      )}
      {...props}
    />
  );
}
