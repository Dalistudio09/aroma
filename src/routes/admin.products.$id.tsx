import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/screen-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORY_LABEL, type CategoryId } from "@/lib/constants";
import {
  createProduct,
  getProductAdmin,
  updateProduct,
} from "@/lib/catalog";
import { useTelegram } from "@/lib/telegram";

export const Route = createFileRoute("/admin/products/$id")({
  component: ProductFormPage,
});

function ProductFormPage() {
  const { id } = Route.useParams();
  const isNew = id === "new";
  const productId = Number(id);
  const telegram = useTelegram();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [category, setCategory] = useState<CategoryId>("women");
  const [volume, setVolume] = useState("10 мл");
  const [price, setPrice] = useState("0");
  const [brand, setBrand] = useState("Aroma");
  const [family, setFamily] = useState("");
  const [description, setDescription] = useState("");
  const [topNotes, setTopNotes] = useState("");
  const [heartNotes, setHeartNotes] = useState("");
  const [baseNotes, setBaseNotes] = useState("");
  const [stock, setStock] = useState("0");
  const [photoUrl, setPhotoUrl] = useState("");
  const [active, setActive] = useState(true);

  const existing = useQuery({
    queryKey: ["admin-product", productId, telegram.initData],
    queryFn: () =>
      getProductAdmin({ data: { initData: telegram.initData, id: productId } }),
    enabled: telegram.ready && telegram.isAdmin && !isNew && Number.isFinite(productId),
  });

  useEffect(() => {
    const product = existing.data;
    if (!product) return;
    setName(product.name);
    setCategory(product.category);
    setVolume(product.volume);
    setPrice(String(product.price));
    setBrand(product.brand || "Aroma");
    setFamily(product.family);
    setDescription(product.description);
    setTopNotes(product.topNotes);
    setHeartNotes(product.heartNotes);
    setBaseNotes(product.baseNotes);
    setStock(String(product.stock));
    setPhotoUrl(product.photoUrl ?? "");
    setActive(product.active);
  }, [existing.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        initData: telegram.initData,
        name,
        category,
        volume,
        price: Number(price),
        brand,
        family,
        description,
        topNotes,
        heartNotes,
        baseNotes,
        stock: Number(stock),
        photoUrl,
        active,
      };
      if (isNew) return createProduct({ data: payload });
      return updateProduct({ data: { ...payload, id: productId } });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      await queryClient.invalidateQueries({ queryKey: ["catalog"] });
      toast.success(isNew ? "Товар добавлен" : "Сохранено");
      void navigate({ to: "/admin/products" });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Не удалось сохранить");
    },
  });

  if (telegram.ready && !telegram.isAdmin) {
    return (
      <div>
        <ScreenHeader title="Товар" back />
        <p className="text-sm text-muted">Нет доступа</p>
      </div>
    );
  }

  return (
    <div>
      <ScreenHeader title={isNew ? "Новый товар" : "Товар"} back />
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          saveMutation.mutate();
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="product-name">Название</Label>
          <Input
            id="product-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="product-category">Категория</Label>
          <Select
            id="product-category"
            value={category}
            onChange={(event) => setCategory(event.target.value as CategoryId)}
          >
            {(Object.keys(CATEGORY_LABEL) as CategoryId[]).map((key) => (
              <option key={key} value={key}>
                {CATEGORY_LABEL[key]}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="product-volume">Объём</Label>
          <Input
            id="product-volume"
            value={volume}
            onChange={(event) => setVolume(event.target.value)}
            required
            placeholder="10 мл"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="product-price">Цена, ₸</Label>
          <Input
            id="product-price"
            type="number"
            min={0}
            inputMode="numeric"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="product-brand">Бренд</Label>
          <Input
            id="product-brand"
            value={brand}
            onChange={(event) => setBrand(event.target.value)}
            placeholder="Aroma"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="product-family">Семейство</Label>
          <Input
            id="product-family"
            value={family}
            onChange={(event) => setFamily(event.target.value)}
            placeholder="древесно-фруктовые"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="product-description">Описание</Label>
          <Textarea
            id="product-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="product-top">Верхние ноты</Label>
          <Input
            id="product-top"
            value={topNotes}
            onChange={(event) => setTopNotes(event.target.value)}
            placeholder="инжир, бергамот"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="product-heart">Средние ноты</Label>
          <Input
            id="product-heart"
            value={heartNotes}
            onChange={(event) => setHeartNotes(event.target.value)}
            placeholder="зелень, молоко"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="product-base">Базовые ноты</Label>
          <Input
            id="product-base"
            value={baseNotes}
            onChange={(event) => setBaseNotes(event.target.value)}
            placeholder="дерево, мускус"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="product-stock">Остаток</Label>
          <Input
            id="product-stock"
            type="number"
            min={0}
            inputMode="numeric"
            value={stock}
            onChange={(event) => setStock(event.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="product-photo">Фото URL</Label>
          <Input
            id="product-photo"
            value={photoUrl}
            onChange={(event) => setPhotoUrl(event.target.value)}
            placeholder="Если пусто — аккуратная заглушка"
          />
        </div>
        <label className="flex min-h-12 items-center gap-3 rounded-lg bg-elevated px-4 shadow-border">
          <input
            type="checkbox"
            checked={active}
            onChange={(event) => setActive(event.target.checked)}
            className="size-5 accent-accent"
          />
          <span className="text-sm">{active ? "Активен" : "Скрыт"}</span>
        </label>
        <Button type="submit" size="lg" className="w-full" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? "Сохраняем…" : "Сохранить"}
        </Button>
      </form>
    </div>
  );
}
