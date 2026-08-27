import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listCatalog } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import { CATEGORIES, PAGE_SIZE, type CategoryFilter } from "@/lib/constants";

export const Route = createFileRoute("/")({
  loader: () => listCatalog(),
  component: Home,
});

function Home() {
  const initial = Route.useLoaderData();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const catalog = useQuery({
    queryKey: ["catalog"],
    queryFn: () => listCatalog(),
    initialData: initial,
  });

  const filtered = useMemo(() => {
    const list = catalog.data ?? [];
    const needle = query.trim().toLowerCase();
    return list.filter((product) => {
      const matchesCategory = category === "all" || product.category === category;
      const matchesQuery = !needle || product.name.toLowerCase().includes(needle);
      return matchesCategory && matchesQuery;
    });
  }, [catalog.data, category, query]);

  const shown = filtered.slice(0, visible);

  return (
    <div>
      <header className="mb-5">
        <p className="text-xs uppercase tracking-widest text-subtle">Парфюмерия</p>
        <h1 className="font-display text-4xl leading-none text-fg">Aroma</h1>
      </header>

      <label className="relative mb-4 block">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-subtle" />
        <Input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setVisible(PAGE_SIZE);
          }}
          placeholder="Поиск по названию"
          className="pl-12"
        />
      </label>

      <div className="mb-5 flex gap-1.5">
        {CATEGORIES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setCategory(item.id);
              setVisible(PAGE_SIZE);
            }}
            className={cn(
              "min-h-11 min-w-0 flex-1 rounded-full px-2 text-center text-xs whitespace-nowrap",
              category === item.id
                ? "bg-accent text-accent-fg"
                : "bg-elevated text-muted shadow-border",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {catalog.isLoading && !catalog.data?.length ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="aspect-portrait animate-pulse rounded-xl bg-surface" />
          ))}
        </div>
      ) : shown.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted">Ничего не нашлось</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            {shown.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {filtered.length > visible ? (
            <Button
              variant="secondary"
              className="mt-5 w-full"
              onClick={() => setVisible((value) => value + PAGE_SIZE)}
            >
              Показать ещё
            </Button>
          ) : null}
        </>
      )}
    </div>
  );
}
