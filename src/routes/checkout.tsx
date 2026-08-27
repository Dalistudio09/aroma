import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/screen-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cartTotal, useCart } from "@/lib/cart-store";
import { cn } from "@/lib/cn";
import { formatTenge } from "@/lib/format";
import { createOrder } from "@/lib/orders";
import { useTelegram } from "@/lib/telegram";

export const Route = createFileRoute("/checkout")({ component: CheckoutPage });

function CheckoutPage() {
  const navigate = useNavigate();
  const telegram = useTelegram();
  const items = useCart((state) => state.items);
  const clear = useCart((state) => state.clear);
  const total = cartTotal(items);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [fulfillment, setFulfillment] = useState<"delivery" | "pickup">("delivery");
  const [address, setAddress] = useState("");
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (telegram.firstName) setName((current) => current || telegram.firstName);
  }, [telegram.firstName]);

  const mutation = useMutation({
    mutationFn: () =>
      createOrder({
        data: {
          initData: telegram.initData,
          customerName: name,
          phone,
          fulfillment,
          address,
          comment,
          items: items.map((item) => ({ productId: item.productId, qty: item.qty })),
        },
      }),
    onSuccess: (order) => {
      clear();
      void navigate({
        to: "/success/$orderId",
        params: { orderId: String(order.id) },
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Не удалось оформить заказ");
    },
  });

  if (items.length === 0) {
    return (
      <div>
        <ScreenHeader title="Оформление" back />
        <p className="mb-4 text-sm text-muted">Корзина пуста</p>
        <Link to="/" className={cn(buttonVariants())}>
          В каталог
        </Link>
      </div>
    );
  }

  return (
    <div>
      <ScreenHeader title="Оформление" back />
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate();
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="name">Имя</Label>
          <Input
            id="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            autoComplete="name"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Телефон</Label>
          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            placeholder="+7"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            required
            autoComplete="tel"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Получение</Label>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { id: "delivery", label: "Доставка" },
                { id: "pickup", label: "Самовывоз" },
              ] as const
            ).map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setFulfillment(option.id)}
                className={cn(
                  "min-h-12 rounded-lg text-sm",
                  fulfillment === option.id
                    ? "bg-accent text-accent-fg"
                    : "bg-elevated text-muted shadow-border",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        {fulfillment === "delivery" ? (
          <div className="space-y-1.5">
            <Label htmlFor="address">Адрес</Label>
            <Input
              id="address"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              required
              placeholder="Город, улица, дом"
            />
          </div>
        ) : null}
        <div className="space-y-1.5">
          <Label htmlFor="comment">Комментарий</Label>
          <Textarea
            id="comment"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Необязательно"
          />
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className="text-muted">Сумма</span>
          <span className="font-display text-2xl tabular-nums text-accent">
            {formatTenge(total)}
          </span>
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? "Отправляем…" : "Подтвердить заказ"}
        </Button>
      </form>
    </div>
  );
}
