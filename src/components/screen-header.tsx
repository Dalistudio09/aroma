import { useRouter } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";

export function ScreenHeader({
  title,
  back,
}: {
  title?: string
  back?: boolean
}) {
  const router = useRouter();
  return (
    <header className="mb-5 flex items-center gap-2">
      {back ? (
        <button
          type="button"
          className="flex size-11 shrink-0 items-center justify-center rounded-md text-fg"
          onClick={() => {
            if (window.history.length > 1) router.history.back();
            else void router.navigate({ to: "/" });
          }}
          aria-label="Назад"
        >
          <ChevronLeft className="size-6" />
        </button>
      ) : null}
      {title ? <h1 className="font-display text-2xl leading-tight text-fg">{title}</h1> : null}
    </header>
  );
}
