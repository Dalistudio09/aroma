import type { CategoryId, OrderStatus } from "./constants";
import type { Order, OrderItem, Product } from "./types";

export type ProductRow = {
  id: number
  name: string
  category: string
  volume: string
  price: number | string
  description: string
  stock: number | string
  photo_url: string | null
  active: boolean | string | number
  brand?: string | null
  family?: string | null
  top_notes?: string | null
  heart_notes?: string | null
  base_notes?: string | null
};

export type OrderRow = {
  id: number
  telegram_user_id: string
  customer_name: string
  phone: string
  fulfillment: string
  address: string | null
  comment: string | null
  items_json: string
  total: number | string
  status: string
  created_at: string | Date
};

function asBool(value: boolean | string | number): boolean {
  return value === true || value === "t" || value === "true" || value === 1 || value === "1";
}

export function mapProduct(row: ProductRow): Product {
  return {
    id: Number(row.id),
    name: row.name,
    category: row.category as CategoryId,
    volume: row.volume,
    price: Number(row.price),
    brand: row.brand?.trim() || "Aroma",
    family: row.family ?? "",
    description: row.description ?? "",
    topNotes: row.top_notes ?? "",
    heartNotes: row.heart_notes ?? "",
    baseNotes: row.base_notes ?? "",
    stock: Number(row.stock),
    photoUrl: row.photo_url,
    active: asBool(row.active),
  };
}

export function mapOrder(row: OrderRow): Order {
  let items: OrderItem[] = [];
  try {
    const parsed = JSON.parse(row.items_json) as OrderItem[];
    if (Array.isArray(parsed)) items = parsed;
  } catch {
    items = [];
  }
  return {
    id: Number(row.id),
    telegramUserId: row.telegram_user_id,
    customerName: row.customer_name,
    phone: row.phone,
    fulfillment: row.fulfillment === "delivery" ? "delivery" : "pickup",
    address: row.address,
    comment: row.comment,
    items,
    total: Number(row.total),
    status: row.status as OrderStatus,
    createdAt: new Date(row.created_at).toISOString(),
  };
}
