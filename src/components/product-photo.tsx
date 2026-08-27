import { useState } from "react";
import { PLACEHOLDER_PHOTO } from "@/lib/constants";
import { cn } from "@/lib/cn";

export function ProductPhoto({
  src,
  alt,
  className,
}: {
  src: string | null
  alt: string
  className?: string
}) {
  const [failed, setFailed] = useState(false);
  const url = !src || failed ? PLACEHOLDER_PHOTO : src;

  return (
    <img
      src={url}
      alt={alt}
      className={cn("h-full w-full object-cover", className)}
      onError={() => setFailed(true)}
    />
  );
}
