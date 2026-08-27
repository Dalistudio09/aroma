export const ADMIN_TELEGRAM_ID = "743736933";
export const PAGE_SIZE = 12;
export const PLACEHOLDER_PHOTO = "/products/placeholder.jpg";

export const CATEGORIES = [
  { id: "all", label: "Все" },
  { id: "women", label: "Жен" },
  { id: "men", label: "Муж" },
  { id: "unisex", label: "Унисекс" },
] as const;

export type CategoryId = "women" | "men" | "unisex";
export type CategoryFilter = "all" | CategoryId;

export const CATEGORY_LABEL: Record<CategoryId, string> = {
  women: "Женские",
  men: "Мужские",
  unisex: "Унисекс",
};

export const ORDER_STATUSES = [
  { id: "new", label: "новый" },
  { id: "in_progress", label: "в работе" },
  { id: "shipped", label: "отправлен" },
  { id: "issued", label: "выдан" },
  { id: "cancelled", label: "отменён" },
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number]["id"];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  new: "новый",
  in_progress: "в работе",
  shipped: "отправлен",
  issued: "выдан",
  cancelled: "отменён",
};
