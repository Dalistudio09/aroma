import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { ProductPhoto } from "@/components/product-photo";
import { QuantityStepper } from "@/components/quantity-stepper";
import { ScreenHeader } from "@/components/screen-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { cartTotal, useCart } from "@/lib/cart-store";
import { cn } from "@/lib/cn";
import { formatTenge } from "@/lib/format";

export const Route = createFileRoute("/cart")({ component: CartPage });

function CartPage() {
  const navigate = useNavigate();
  const items = useCart((state) => state.items);
  const setQty = useCart((state) => state.setQty);
  const remove = useCart((state) => state.remove);
  const total = cartTotal(items);

  return (
    <div>
      <ScreenHeader title="Корзина" />
      {items.length === 0 ? (
        <div className="py-16 text-center">
          <p className="mb-4 text-sm text-muted">Корзина пуста</p>
          <Link to="/" className={cn(buttonVariants())}>
            В каталог
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.productId}
              className="flex gap-3 rounded-xl bg-surface p-3 shadow-border"
            >
              <div className="size-20 overflow-hidden rounded-md bg-elevated">
                <ProductPhoto src={item.photoUrl} alt={item.name} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-base leading-snug">{item.name}</p>
                <p className="text-sm text-muted">{item.volume}</p>
                <p className="mt-1 text-sm tabular-nums text-accent">
                  {formatTenge(item.price * item.qty)}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <QuantityStepper
                    value={item.qty}
                    min={1}
                    max={item.stock}
                    onChange={(value) => setQty(item.productId, value)}
                  />
                  <button
                    type="button"
                    className="flex size-11 items-center justify-center text-subtle"
                    onClick={() => remove(item.productId)}
                    aria-label="Удалить"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between pt-2">
            <span className="text-muted">Итого</span>
            <span className="font-display text-2xl tabular-nums text-accent">
              {formatTenge(total)}
            </span>
          </div>
          <Button className="w-full" size="lg" onClick={() => void navigate({ to: "/checkout" })}>
            Оформить заказ
          </Button>
        </div>
      )}
    </div>
  );
}
