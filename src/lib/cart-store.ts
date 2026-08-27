import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  productId: number
  name: string
  volume: string
  price: number
  qty: number
  photoUrl: string | null
  stock: number
};

type CartState = {
  items: CartItem[]
  add: (item: Omit<CartItem, "qty">, qty?: number) => void
  setQty: (productId: number, qty: number) => void
  remove: (productId: number) => void
  clear: () => void
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item, qty = 1) => {
        const existing = get().items.find((row) => row.productId === item.productId);
        const nextQty = Math.min(item.stock, (existing?.qty ?? 0) + qty);
        if (nextQty <= 0) return;
        if (existing) {
          set({
            items: get().items.map((row) =>
              row.productId === item.productId
                ? { ...item, qty: nextQty }
                : row,
            ),
          });
          return;
        }
        set({ items: [...get().items, { ...item, qty: nextQty }] });
      },
      setQty: (productId, qty) => {
        if (qty <= 0) {
          set({ items: get().items.filter((row) => row.productId !== productId) });
          return;
        }
        set({
          items: get().items.map((row) =>
            row.productId === productId
              ? { ...row, qty: Math.min(row.stock, qty) }
              : row,
          ),
        });
      },
      remove: (productId) => {
        set({ items: get().items.filter((row) => row.productId !== productId) });
      },
      clear: () => set({ items: [] }),
    }),
    { name: "aroma-cart" },
  ),
);

export function cartCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.qty, 0);
}

export function cartTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.qty, 0);
}
