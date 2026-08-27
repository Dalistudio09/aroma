import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full rounded-lg bg-elevated px-4 py-3 text-base text-fg shadow-border outline-none placeholder:text-subtle",
        "focus:shadow-[0_0_0_1px_var(--color-accent)]",
        className,
      )}
      {...props}
    />
  );
}
