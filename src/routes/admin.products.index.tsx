import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminTabs } from "@/components/admin-tabs";
import { ProductPhoto } from "@/components/product-photo";
import { ScreenHeader } from "@/components/screen-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { CATEGORY_LABEL } from "@/lib/constants";
import { formatTenge } from "@/lib/format";
import { listAllProducts, setProductActive } from "@/lib/catalog";
import { useTelegram } from "@/lib/telegram";

export const Route = createFileRoute("/admin/products/")({
  component: AdminProductsPage,
});

function AdminProductsPage() {
  const telegram = useTelegram();
  const queryClient = useQueryClient();
  const productsQuery = useQuery({
    queryKey: ["admin-products", telegram.initData],
    queryFn: () => listAllProducts({ data: { initData: telegram.initData } }),
    enabled: telegram.ready && telegram.isAdmin,
  });
  const hideMutation = useMutation({
    mutationFn: (input: { id: number; active: boolean }) =>
      setProductActive({
        data: { initData: telegram.initData, id: input.id, active: input.active },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      void queryClient.invalidateQueries({ queryKey: ["catalog"] });
    },
  });

  const products = productsQuery.data ?? [];

  return (
    <div>
      <ScreenHeader title="Товары" />
      <AdminTabs />
      <Link
        to="/admin/products/$id"
        params={{ id: "new" }}
        className={cn(buttonVariants(), "mb-4 w-full")}
      >
        Добавить товар
      </Link>
      {productsQuery.isLoading ? (
        <p className="text-sm text-muted">Загружаем товары…</p>
      ) : (
        <div className="space-y-3">
          {products.map((product) => (
            <article
              key={product.id}
              className="flex gap-3 rounded-xl bg-surface p-3 shadow-border"
            >
              <div className="size-20 overflow-hidden rounded-md bg-elevated">
                <ProductPhoto src={product.photoUrl} alt={product.name} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-base leading-snug">{product.name}</p>
                <p className="text-xs text-subtle">
                  {CATEGORY_LABEL[product.category]} · {product.volume}
                </p>
                <p className="mt-1 text-sm tabular-nums text-accent">
                  {formatTenge(product.price)} · остаток {product.stock}
                </p>
                <p className="text-xs text-muted">{product.active ? "активен" : "скрыт"}</p>
                <div className="mt-2 flex gap-2">
                  <Link
                    to="/admin/products/$id"
                    params={{ id: String(product.id) }}
                    className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
                  >
                    Изменить
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      hideMutation.mutate({ id: product.id, active: !product.active })
                    }
                  >
                    {product.active ? "Скрыть" : "Показать"}
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
