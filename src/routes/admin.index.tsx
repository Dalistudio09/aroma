import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AdminTabs } from "@/components/admin-tabs";
import { ScreenHeader } from "@/components/screen-header";
import { Select } from "@/components/ui/select";
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABEL,
  type OrderStatus,
} from "@/lib/constants";
import { formatOrderNumber, formatTenge } from "@/lib/format";
import { listAllOrders, updateOrderStatus } from "@/lib/orders";
import { useTelegram } from "@/lib/telegram";

export const Route = createFileRoute("/admin/")({ component: AdminOrdersPage });

function AdminOrdersPage() {
  const telegram = useTelegram();
  const queryClient = useQueryClient();
  const ordersQuery = useQuery({
    queryKey: ["admin-orders", telegram.initData],
    queryFn: () => listAllOrders({ data: { initData: telegram.initData } }),
    enabled: telegram.ready && telegram.isAdmin,
  });
  const statusMutation = useMutation({
    mutationFn: (input: { id: number; status: OrderStatus }) =>
      updateOrderStatus({
        data: { initData: telegram.initData, id: input.id, status: input.status },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
  });

  const orders = ordersQuery.data ?? [];

  return (
    <div>
      <ScreenHeader title="Админ" />
      <AdminTabs />
      {ordersQuery.isLoading ? (
        <p className="text-sm text-muted">Загружаем заказы…</p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-muted">Заказов пока нет</p>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <article key={order.id} className="space-y-3 rounded-xl bg-surface p-4 shadow-border">
              <div className="flex items-center justify-between gap-3">
                <p className="font-display text-lg">{formatOrderNumber(order.id)}</p>
                <p className="text-sm tabular-nums text-accent">{formatTenge(order.total)}</p>
              </div>
              <dl className="space-y-1 text-sm text-muted">
                <div>Имя: {order.customerName}</div>
                <div>Телефон: {order.phone}</div>
                <div>Получение: {order.fulfillment === "delivery" ? "доставка" : "самовывоз"}</div>
                {order.address ? <div>Адрес: {order.address}</div> : null}
                {order.comment ? <div>Комментарий: {order.comment}</div> : null}
              </dl>
              <ul className="space-y-1 text-sm text-fg">
                {order.items.map((item) => (
                  <li key={`${order.id}-${item.productId}`}>
                    {item.name}, {item.volume} × {item.qty} — {formatTenge(item.price * item.qty)}
                  </li>
                ))}
              </ul>
              <Select
                value={order.status}
                onChange={(event) =>
                  statusMutation.mutate({
                    id: order.id,
                    status: event.target.value as OrderStatus,
                  })
                }
              >
                {ORDER_STATUSES.map((status) => (
                  <option key={status.id} value={status.id}>
                    {ORDER_STATUS_LABEL[status.id]}
                  </option>
                ))}
              </Select>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
