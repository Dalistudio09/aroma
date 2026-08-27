import { Link, useRouterState } from "@tanstack/react-router";
import { ClipboardList, Droplets, Settings2, ShoppingBag } from "lucide-react";
import type { ReactNode } from "react";
import { cartCount, useCart } from "@/lib/cart-store";
import { cn } from "@/lib/cn";
import { useTelegram } from "@/lib/telegram";

export function Shell({ children }: { children: ReactNode }) {
  const { isAdmin, ready } = useTelegram();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const items = useCart((state) => state.items);
  const count = cartCount(items);

  const tabs = [
    { to: "/", label: "Каталог", icon: Droplets, match: pathname === "/" || pathname.startsWith("/product/") },
    { to: "/orders", label: "Заказы", icon: ClipboardList, match: pathname.startsWith("/orders") || pathname.startsWith("/success") },
    { to: "/cart", label: "Корзина", icon: ShoppingBag, match: pathname.startsWith("/cart") || pathname.startsWith("/checkout") },
    ...(ready && isAdmin
      ? [{ to: "/admin", label: "Админ", icon: Settings2, match: pathname.startsWith("/admin") }]
      : []),
  ] as const;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col">
      <main className="flex-1 px-4 pb-28 pt-[max(1rem,env(safe-area-inset-top))]">
        {children}
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-bg/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-lg px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={cn(
                  "relative flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-xs tracking-wide",
                  tab.match ? "text-accent" : "text-subtle",
                )}
              >
                <span className="relative">
                  <Icon className="size-5" strokeWidth={1.7} />
                  {tab.to === "/cart" && count > 0 ? (
                    <span className="absolute -right-2.5 -top-1.5 min-w-4 rounded-full bg-accent px-1 text-center text-xs font-medium leading-4 text-accent-fg tabular-nums">
                      {count}
                    </span>
                  ) : null}
                </span>
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
