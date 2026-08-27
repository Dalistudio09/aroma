import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ScreenHeader } from "@/components/screen-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { formatOrderNumber, formatTenge } from "@/lib/format";
import { getMyOrder } from "@/lib/orders";
import { useTelegram } from "@/lib/telegram";

export const Route = createFileRoute("/success/$orderId")({
  component: SuccessPage,
});

function SuccessPage() {
  const { orderId } = Route.useParams();
  const id = Number(orderId);
  const telegram = useTelegram();
  const orderQuery = useQuery({
    queryKey: ["order", id, telegram.initData],
    queryFn: () => getMyOrder({ data: { initData: telegram.initData, id } }),
    enabled: Number.isFinite(id) && telegram.ready,
  });
  const order = orderQuery.data;

  return (
    <div>
      <ScreenHeader title="Готово" />
      <div className="rounded-xl bg-surface px-5 py-8 text-center shadow-border">
        <p className="font-display text-2xl text-fg">Заказ принят.</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Мы напишем вам в Telegram.
        </p>
        <p className="mt-6 text-sm text-subtle">Номер</p>
        <p className="font-display text-3xl text-accent">
          {order ? formatOrderNumber(order.id) : formatOrderNumber(id)}
        </p>
        <p className="mt-4 text-sm text-subtle">Сумма</p>
        <p className="font-display text-2xl tabular-nums text-fg">
          {order ? formatTenge(order.total) : "—"}
        </p>
      </div>
      <div className="mt-5 grid gap-2">
        <Link to="/orders" className={cn(buttonVariants({ variant: "secondary" }), "w-full")}>
          Мои заказы
        </Link>
        <Link to="/" className={cn(buttonVariants(), "w-full")}>
          В каталог
        </Link>
      </div>
    </div>
  );
}
