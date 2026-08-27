import { Link } from "@tanstack/react-router";
import { formatTenge } from "@/lib/format";
import type { Product } from "@/lib/types";
import { ProductPhoto } from "./product-photo";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      to="/product/$id"
      params={{ id: String(product.id) }}
      className="group block overflow-hidden rounded-xl bg-surface shadow-border"
    >
      <div className="aspect-portrait overflow-hidden bg-elevated">
        <ProductPhoto src={product.photoUrl} alt={product.name} />
      </div>
      <div className="space-y-1 p-3">
        <h2 className="font-display text-base leading-snug text-fg">{product.name}</h2>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm text-muted">{product.volume}</span>
          <span className="text-sm font-medium tabular-nums text-accent">
            {formatTenge(product.price)}
          </span>
        </div>
      </div>
    </Link>
  );
}
