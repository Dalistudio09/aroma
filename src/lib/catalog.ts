import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { SEED_PRODUCTS } from "@/lib/catalog-seed";
import { PLACEHOLDER_PHOTO } from "@/lib/constants";
import { mapProduct, type ProductRow } from "@/lib/db-map";
import type { Product } from "@/lib/types";

const identitySchema = z.object({
  initData: z.string().optional(),
});

const categorySchema = z.enum(["women", "men", "unisex"]);

async function ensureCatalogSeed() {
  const sql = await getSql();
  const counts = await sql<{ n: number }>`select count(*)::int as n from products`;
  if ((counts[0]?.n ?? 0) === 0) {
    for (const product of SEED_PRODUCTS) {
      await sql`
        insert into products (
          name, category, volume, price, description, stock, photo_url, active,
          brand, family, top_notes, heart_notes, base_notes
        )
        values (
          ${product.name},
          ${product.category},
          ${product.volume},
          ${product.price},
          ${product.description},
          ${product.stock},
          ${product.photoUrl},
          ${true},
          ${product.brand},
          ${product.family},
          ${product.topNotes},
          ${product.heartNotes},
          ${product.baseNotes}
        )
      `;
    }
    return;
  }

  for (const product of SEED_PRODUCTS) {
    await sql`
      update products
      set
        brand = ${product.brand},
        family = ${product.family},
        description = ${product.description},
        top_notes = ${product.topNotes},
        heart_notes = ${product.heartNotes},
        base_notes = ${product.baseNotes}
      where name = ${product.name}
        and coalesce(top_notes, '') = ''
    `;
  }
}

async function requireAdmin(initData: string | undefined) {
  const { requireAdmin: check } = await import("./identity.server");
  return check(initData);
}

export const listCatalog = createServerFn({ method: "GET" }).handler(async () => {
  await ensureCatalogSeed();
  const sql = await getSql();
  const rows = await sql<ProductRow>`
    select id, name, category, volume, price, description, stock, photo_url, active,
           brand, family, top_notes, heart_notes, base_notes
    from products
    where active = true
    order by id asc
  `;
  return rows.map(mapProduct);
});

export const listAllProducts = createServerFn({ method: "POST" })
  .validator(identitySchema)
  .handler(async ({ data }) => {
    await requireAdmin(data.initData);
    await ensureCatalogSeed();
    const sql = await getSql();
    const rows = await sql<ProductRow>`
      select id, name, category, volume, price, description, stock, photo_url, active,
           brand, family, top_notes, heart_notes, base_notes
      from products
      order by id desc
    `;
    return rows.map(mapProduct);
  });

export const getProduct = createServerFn({ method: "GET" })
  .validator(z.object({ id: z.number() }))
  .handler(async ({ data }) => {
    await ensureCatalogSeed();
    const sql = await getSql();
    const rows = await sql<ProductRow>`
      select id, name, category, volume, price, description, stock, photo_url, active,
           brand, family, top_notes, heart_notes, base_notes
      from products
      where id = ${data.id}
      limit 1
    `;
    const product = rows[0] ? mapProduct(rows[0]) : null;
    if (!product || !product.active) return null;
    return product;
  });

export const getProductAdmin = createServerFn({ method: "POST" })
  .validator(z.object({ initData: z.string().optional(), id: z.number() }))
  .handler(async ({ data }) => {
    await requireAdmin(data.initData);
    await ensureCatalogSeed();
    const sql = await getSql();
    const rows = await sql<ProductRow>`
      select id, name, category, volume, price, description, stock, photo_url, active,
           brand, family, top_notes, heart_notes, base_notes
      from products
      where id = ${data.id}
      limit 1
    `;
    return rows[0] ? mapProduct(rows[0]) : null;
  });

const productInputSchema = z.object({
  initData: z.string().optional(),
  name: z.string().trim().min(1, "Укажите название"),
  category: categorySchema,
  volume: z.string().trim().min(1, "Укажите объём"),
  price: z.number().int().min(0),
  brand: z.string().trim(),
  family: z.string().trim(),
  description: z.string().trim(),
  topNotes: z.string().trim(),
  heartNotes: z.string().trim(),
  baseNotes: z.string().trim(),
  stock: z.number().int().min(0),
  photoUrl: z.string().trim(),
  active: z.boolean(),
});

function normalizePhoto(url: string): string | null {
  const trimmed = url.trim();
  return trimmed ? trimmed : null;
}

export const createProduct = createServerFn({ method: "POST" })
  .validator(productInputSchema)
  .handler(async ({ data }): Promise<Product> => {
    await requireAdmin(data.initData);
    const sql = await getSql();
    const photo = normalizePhoto(data.photoUrl);
    const brand = data.brand.trim() || "Aroma";
    const rows = await sql<ProductRow>`
      insert into products (
        name, category, volume, price, description, stock, photo_url, active,
        brand, family, top_notes, heart_notes, base_notes
      )
      values (
        ${data.name},
        ${data.category},
        ${data.volume},
        ${data.price},
        ${data.description},
        ${data.stock},
        ${photo},
        ${data.active},
        ${brand},
        ${data.family},
        ${data.topNotes},
        ${data.heartNotes},
        ${data.baseNotes}
      )
      returning id, name, category, volume, price, description, stock, photo_url, active,
                brand, family, top_notes, heart_notes, base_notes
    `;
    const created = rows[0];
    if (!created) throw new Error("Не удалось сохранить товар");
    return mapProduct(created);
  });

export const updateProduct = createServerFn({ method: "POST" })
  .validator(productInputSchema.extend({ id: z.number() }))
  .handler(async ({ data }): Promise<Product> => {
    await requireAdmin(data.initData);
    const sql = await getSql();
    const photo = normalizePhoto(data.photoUrl);
    const brand = data.brand.trim() || "Aroma";
    const rows = await sql<ProductRow>`
      update products
      set
        name = ${data.name},
        category = ${data.category},
        volume = ${data.volume},
        price = ${data.price},
        description = ${data.description},
        stock = ${data.stock},
        photo_url = ${photo},
        active = ${data.active},
        brand = ${brand},
        family = ${data.family},
        top_notes = ${data.topNotes},
        heart_notes = ${data.heartNotes},
        base_notes = ${data.baseNotes}
      where id = ${data.id}
      returning id, name, category, volume, price, description, stock, photo_url, active,
                brand, family, top_notes, heart_notes, base_notes
    `;
    const updated = rows[0];
    if (!updated) throw new Error("Товар не найден");
    return mapProduct(updated);
  });

export const setProductActive = createServerFn({ method: "POST" })
  .validator(z.object({ initData: z.string().optional(), id: z.number(), active: z.boolean() }))
  .handler(async ({ data }) => {
    await requireAdmin(data.initData);
    const sql = await getSql();
    const rows = await sql<ProductRow>`
      update products
      set active = ${data.active}
      where id = ${data.id}
      returning id, name, category, volume, price, description, stock, photo_url, active,
                brand, family, top_notes, heart_notes, base_notes
    `;
    const updated = rows[0];
    if (!updated) throw new Error("Товар не найден");
    return mapProduct(updated);
  });

export { PLACEHOLDER_PHOTO };
