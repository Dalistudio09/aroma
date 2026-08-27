import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ProductPhoto } from "@/components/product-photo";
import { QuantityStepper } from "@/components/quantity-stepper";
import { ScreenHeader } from "@/components/screen-header";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-store";
import { formatTenge } from "@/lib/format";
import { getProduct } from "@/lib/catalog";

export const Route = createFileRoute("/product/$id")({
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const productId = Number(id);
  const [qty, setQty] = useState(1);
  const add = useCart((state) => state.add);
  const productQuery = useQuery({
    queryKey: ["product", productId],
    queryFn: () => getProduct({ data: { id: productId } }),
    enabled: Number.isFinite(productId),
  });
  const product = productQuery.data;

  if (productQuery.isLoading) {
    return (
      <div>
        <ScreenHeader back />
        <div className="h-80 animate-pulse rounded-xl bg-surface" />
      </div>
    );
  }

  if (!product) {
    return (
      <div>
        <ScreenHeader back />
        <p className="text-sm text-muted">Товар не найден или скрыт.</p>
      </div>
    );
  }

  const outOfStock = product.stock <= 0;
  const notes = [
    { label: "Верхние ноты", value: product.topNotes },
    { label: "Средние ноты", value: product.heartNotes },
    { label: "Базовые ноты", value: product.baseNotes },
  ].filter((row) => row.value.trim());

  return (
    <div>
      <ScreenHeader back />
      <div className="overflow-hidden rounded-xl bg-surface shadow-border">
        <div className="h-80 bg-elevated">
          <ProductPhoto src={product.photoUrl} alt={product.name} />
        </div>
      </div>

      <div className="mt-5 space-y-5">
        <div>
          <h2 className="font-display text-3xl leading-none text-fg">{product.name}</h2>
          <p className="mt-2 text-sm tracking-wide text-subtle">{product.brand}</p>
          {product.family ? (
            <p className="mt-1 text-sm text-muted">{product.family}</p>
          ) : null}
        </div>

        {product.description ? (
          <p className="text-sm leading-relaxed text-muted">{product.description}</p>
        ) : null}

        {notes.length > 0 ? (
          <dl className="space-y-3 rounded-xl bg-surface px-4 py-4 shadow-border">
            {notes.map((row) => (
              <div key={row.label}>
                <dt className="text-xs uppercase tracking-widest text-subtle">{row.label}</dt>
                <dd className="mt-1 text-sm text-fg">{row.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        <div className="flex items-end justify-between gap-3">
          <p className="text-muted">{product.volume}</p>
          <p className="font-display text-2xl tabular-nums text-accent">
            {formatTenge(product.price)}
          </p>
        </div>

        <p className="text-sm text-subtle">
          {outOfStock ? "Нет в наличии" : `Остаток: ${product.stock}`}
        </p>

        <div className="flex items-center justify-between gap-3 pt-1">
          <QuantityStepper
            value={qty}
            min={1}
            max={Math.max(1, product.stock)}
            onChange={setQty}
          />
          <Button
            className="flex-1"
            disabled={outOfStock}
            onClick={() => {
              add(
                {
                  productId: product.id,
                  name: product.name,
                  volume: product.volume,
                  price: product.price,
                  photoUrl: product.photoUrl,
                  stock: product.stock,
                },
                qty,
              );
              toast.success("Добавлено в корзину");
            }}
          >
            В корзину
          </Button>
        </div>
      </div>
    </div>
  );
}
