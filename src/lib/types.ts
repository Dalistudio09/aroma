import type { CategoryId, OrderStatus } from "./constants";

export type Product = {
  id: number
  name: string
  category: CategoryId
  volume: string
  price: number
  brand: string
  family: string
  description: string
  topNotes: string
  heartNotes: string
  baseNotes: string
  stock: number
  photoUrl: string | null
  active: boolean
};

export type OrderItem = {
  productId: number
  name: string
  volume: string
  price: number
  qty: number
};

export type Order = {
  id: number
  telegramUserId: string
  customerName: string
  phone: string
  fulfillment: "delivery" | "pickup"
  address: string | null
  comment: string | null
  items: OrderItem[]
  total: number
  status: OrderStatus
  createdAt: string
};

export type Identity = {
  telegramId: string
  firstName: string
  isAdmin: boolean
};
