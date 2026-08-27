import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/cn";

export function AdminTabs() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const tabs = [
    { to: "/admin", label: "Заказы", exact: true },
    { to: "/admin/products", label: "Товары", exact: false },
  ] as const;

  return (
    <div className="mb-5 grid grid-cols-2 gap-2">
      {tabs.map((tab) => {
        const active = tab.exact ? pathname === tab.to : pathname.startsWith(tab.to);
        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={cn(
              "flex min-h-11 items-center justify-center rounded-lg text-sm",
              active ? "bg-accent text-accent-fg" : "bg-elevated text-muted shadow-border",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
