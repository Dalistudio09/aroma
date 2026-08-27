import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { mapOrder, mapProduct, type OrderRow, type ProductRow } from "@/lib/db-map";
import type { Order, OrderItem } from "@/lib/types";

const identitySchema = z.object({
  initData: z.string().optional(),
});

const statusSchema = z.enum([
  "new",
  "in_progress",
  "shipped",
  "issued",
  "cancelled",
]);

async function identity(initData: string | undefined) {
  const { resolveIdentity } = await import("./identity.server");
  return resolveIdentity(initData);
}

async function requireAdmin(initData: string | undefined) {
  const { requireAdmin: check } = await import("./identity.server");
  return check(initData);
}

export const listMyOrders = createServerFn({ method: "POST" })
  .validator(identitySchema)
  .handler(async ({ data }) => {
    const user = await identity(data.initData);
    const sql = await getSql();
    const rows = await sql<OrderRow>`
      select id, telegram_user_id, customer_name, phone, fulfillment, address, comment, items_json, total, status, created_at
      from orders
      where telegram_user_id = ${user.telegramId}
      order by id desc
    `;
    return rows.map(mapOrder);
  });

export const listAllOrders = createServerFn({ method: "POST" })
  .validator(identitySchema)
  .handler(async ({ data }) => {
    await requireAdmin(data.initData);
    const sql = await getSql();
    const rows = await sql<OrderRow>`
      select id, telegram_user_id, customer_name, phone, fulfillment, address, comment, items_json, total, status, created_at
      from orders
      order by id desc
    `;
    return rows.map(mapOrder);
  });

export const getMyOrder = createServerFn({ method: "POST" })
  .validator(z.object({ initData: z.string().optional(), id: z.number() }))
  .handler(async ({ data }) => {
    const user = await identity(data.initData);
    const sql = await getSql();
    const rows = await sql<OrderRow>`
      select id, telegram_user_id, customer_name, phone, fulfillment, address, comment, items_json, total, status, created_at
      from orders
      where id = ${data.id}
      limit 1
    `;
    const order = rows[0] ? mapOrder(rows[0]) : null;
    if (!order) return null;
    if (!user.isAdmin && order.telegramUserId !== user.telegramId) return null;
    return order;
  });

export const createOrder = createServerFn({ method: "POST" })
  .validator(
    z.object({
      initData: z.string().optional(),
      customerName: z.string().trim().min(1, "Укажите имя"),
      phone: z.string().trim().min(6, "Укажите телефон"),
      fulfillment: z.enum(["delivery", "pickup"]),
      address: z.string().trim(),
      comment: z.string().trim(),
      items: z
        .array(
          z.object({
            productId: z.number(),
            qty: z.number().int().min(1),
          }),
        )
        .min(1, "Корзина пуста"),
    }),
  )
  .handler(async ({ data }): Promise<Order> => {
    const user = await identity(data.initData);
    if (data.fulfillment === "delivery" && !data.address) {
      throw new Error("Укажите адрес доставки");
    }

    const sql = await getSql();
    const lines: OrderItem[] = [];
    let total = 0;

    for (const item of data.items) {
      const rows = await sql<ProductRow>`
        select id, name, category, volume, price, description, stock, photo_url, active
        from products
        where id = ${item.productId}
        limit 1
      `;
      const product = rows[0] ? mapProduct(rows[0]) : null;
      if (!product || !product.active) {
        throw new Error("Один из товаров больше недоступен");
      }
      if (product.stock < item.qty) {
        throw new Error(`Недостаточно «${product.name}» — осталось ${product.stock}`);
      }
      const updated = await sql<{ id: number }>`
        update products
        set stock = stock - ${item.qty}
        where id = ${product.id} and stock >= ${item.qty}
        returning id
      `;
      if (!updated[0]) {
        throw new Error(`Недостаточно «${product.name}»`);
      }
      lines.push({
        productId: product.id,
        name: product.name,
        volume: product.volume,
        price: product.price,
        qty: item.qty,
      });
      total += product.price * item.qty;
    }

    const inserted = await sql<OrderRow>`
      insert into orders (
        telegram_user_id, customer_name, phone, fulfillment, address, comment, items_json, total, status
      )
      values (
        ${user.telegramId},
        ${data.customerName},
        ${data.phone},
        ${data.fulfillment},
        ${data.fulfillment === "delivery" ? data.address : null},
        ${data.comment || null},
        ${JSON.stringify(lines)},
        ${total},
        ${"new"}
      )
      returning id, telegram_user_id, customer_name, phone, fulfillment, address, comment, items_json, total, status, created_at
    `;
    const saved = inserted[0];
    if (!saved) throw new Error("Не удалось сохранить заказ");
    const order = mapOrder(saved);

    try {
      const { notifyAdminAboutOrder } = await import("./telegram.server");
      await notifyAdminAboutOrder(order);
    } catch {
      // Order stays saved even if Telegram is down.
    }

    return order;
  });

export const updateOrderStatus = createServerFn({ method: "POST" })
  .validator(
    z.object({
      initData: z.string().optional(),
      id: z.number(),
      status: statusSchema,
    }),
  )
  .handler(async ({ data }) => {
    await requireAdmin(data.initData);
    const sql = await getSql();
    const rows = await sql<OrderRow>`
      update orders
      set status = ${data.status}
      where id = ${data.id}
      returning id, telegram_user_id, customer_name, phone, fulfillment, address, comment, items_json, total, status, created_at
    `;
    const updated = rows[0];
    if (!updated) throw new Error("Заказ не найден");
    return mapOrder(updated);
  });
