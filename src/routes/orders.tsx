import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ScreenHeader } from "@/components/screen-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { ORDER_STATUS_LABEL } from "@/lib/constants";
import { formatOrderNumber, formatTenge } from "@/lib/format";
import { listMyOrders } from "@/lib/orders";
import { useTelegram } from "@/lib/telegram";

export const Route = createFileRoute("/orders")({ component: OrdersPage });

function OrdersPage() {
  const telegram = useTelegram();
  const ordersQuery = useQuery({
    queryKey: ["my-orders", telegram.initData],
    queryFn: () => listMyOrders({ data: { initData: telegram.initData } }),
    enabled: telegram.ready,
  });
  const orders = ordersQuery.data ?? [];

  return (
    <div>
      <ScreenHeader title="Мои заказы" />
      {ordersQuery.isLoading ? (
        <p className="text-sm text-muted">Загружаем…</p>
      ) : orders.length === 0 ? (
        <div className="py-12 text-center">
          <p className="mb-4 text-sm text-muted">Пока нет заказов</p>
          <Link to="/" className={cn(buttonVariants())}>
            Выбрать аромат
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <article key={order.id} className="rounded-xl bg-surface p-4 shadow-border">
              <div className="flex items-center justify-between gap-3">
                <p className="font-display text-lg">{formatOrderNumber(order.id)}</p>
                <span className="rounded-full bg-elevated px-3 py-1 text-xs text-muted">
                  {ORDER_STATUS_LABEL[order.status]}
                </span>
              </div>
              <p className="mt-1 text-xs text-subtle">
                {new Date(order.createdAt).toLocaleString("ru-RU", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <ul className="mt-3 space-y-1 text-sm text-muted">
                {order.items.map((item) => (
                  <li key={`${order.id}-${item.productId}`}>
                    {item.name}, {item.volume} × {item.qty}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm tabular-nums text-accent">{formatTenge(order.total)}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
