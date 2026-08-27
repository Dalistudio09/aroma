import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getRequest } from "@tanstack/react-start/server";
import {
  canUseTelegramWebhook,
  isPublicHttpsOrigin,
  telegramBotToken,
} from "./bot-token.server";
import { formatTenge } from "./format";
import type { Order } from "./types";

const ORIGIN_FILE = join(process.cwd(), ".grok/telegram-webapp-url");

const globalRef = globalThis as typeof globalThis & {
  __aromaPublicOrigin__?: string
};

function botToken(): string | undefined {
  return telegramBotToken();
}

function readStoredOrigin(): string | undefined {
  if (globalRef.__aromaPublicOrigin__) return globalRef.__aromaPublicOrigin__;
  try {
    if (!existsSync(ORIGIN_FILE)) return undefined;
    const value = readFileSync(ORIGIN_FILE, "utf8").trim().replace(/\/$/, "");
    if (isPublicHttpsOrigin(value)) {
      globalRef.__aromaPublicOrigin__ = value;
      return value;
    }
  } catch {
    // ignore
  }
  return undefined;
}

function rememberOrigin(origin: string) {
  if (!isPublicHttpsOrigin(origin)) return;
  globalRef.__aromaPublicOrigin__ = origin;
  try {
    writeFileSync(ORIGIN_FILE, origin, "utf8");
  } catch {
    // ignore
  }
}

export function publicOrigin(): string {
  const fromEnv = process.env.TELEGRAM_WEBAPP_URL?.trim().replace(/\/$/, "");
  if (fromEnv) {
    rememberOrigin(fromEnv);
    return fromEnv;
  }
  try {
    const request = getRequest();
    const host =
      request.headers.get("x-forwarded-host") ??
      request.headers.get("host") ??
      "localhost:8080";
    const proto = request.headers.get("x-forwarded-proto") ?? "https";
    const origin = `${proto}://${host.split(",")[0]!.trim()}`.replace(/\/$/, "");
    if (isPublicHttpsOrigin(origin)) rememberOrigin(origin);
    return readStoredOrigin() || origin;
  } catch {
    return readStoredOrigin() || "https://localhost";
  }
}

async function telegramCall(method: string, payload: Record<string, unknown>) {
  const token = botToken();
  if (!token) return { ok: false as const, description: "no bot token" };
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  return (await response.json()) as { ok: boolean; description?: string };
}

function startKeyboard(origin: string) {
  const url = isPublicHttpsOrigin(origin) ? origin : readStoredOrigin();
  if (!url || !isPublicHttpsOrigin(url)) return undefined;
  return {
    inline_keyboard: [[{ text: "Открыть магазин", web_app: { url } }]],
  };
}

async function sendStartPhoto(
  chatId: number | string,
  caption: string,
  replyMarkup: ReturnType<typeof startKeyboard>,
) {
  const token = botToken();
  if (!token) return { ok: false as const, description: "no bot token" };

  try {
    const bytes = readFileSync(join(process.cwd(), "public/bot-cover.jpg"));
    const form = new FormData();
    form.set("chat_id", String(chatId));
    form.set("caption", caption);
    form.set("photo", new Blob([new Uint8Array(bytes)], { type: "image/jpeg" }), "bot-cover.jpg");
    if (replyMarkup) form.set("reply_markup", JSON.stringify(replyMarkup));
    const response = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
      method: "POST",
      body: form,
    });
    return (await response.json()) as { ok: boolean; description?: string };
  } catch (error) {
    return {
      ok: false as const,
      description: error instanceof Error ? error.message : "photo upload failed",
    };
  }
}

export async function sendStartMessage(chatId: number | string) {
  const origin = publicOrigin();
  const caption = [
    "Aroma",
    "Парфюмерия в Telegram",
    "",
    "Женские, мужские и унисекс ароматы.",
    "Найдите нужный, оформите заказ за пару минут.",
  ].join("\n");
  const replyMarkup = startKeyboard(origin);

  const photo = await sendStartPhoto(chatId, caption, replyMarkup);
  if (photo.ok) return photo;

  if (replyMarkup) {
    const retry = await sendStartPhoto(chatId, caption, undefined);
    if (retry.ok) {
      await telegramCall("sendMessage", {
        chat_id: chatId,
        text: "Открыть магазин",
        reply_markup: replyMarkup,
      });
      return retry;
    }
  }

  const text = await telegramCall("sendMessage", {
    chat_id: chatId,
    text: caption,
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  });
  return text;
}

export async function notifyAdminAboutOrder(order: Order) {
  const lines = [
    `Новый заказ #${order.id}`,
    `Имя: ${order.customerName}`,
    `Телефон: ${order.phone}`,
    `Получение: ${order.fulfillment === "delivery" ? "доставка" : "самовывоз"}`,
    `Адрес: ${order.address?.trim() || "—"}`,
    "Состав:",
    ...order.items.map(
      (item) =>
        `• ${item.name}, ${item.volume} × ${item.qty} — ${formatTenge(item.price * item.qty)}`,
    ),
    `Сумма: ${formatTenge(order.total)}`,
    `Комментарий: ${order.comment?.trim() || "—"}`,
    "Статус: новый",
  ];
  await telegramCall("sendMessage", {
    chat_id: 743736933,
    text: lines.join("\n"),
  });
}

export async function ensureTelegramWebhook() {
  const token = botToken();
  if (!token) return { ok: false as const, reason: "no-token" };
  const origin = publicOrigin();
  if (!canUseTelegramWebhook(origin)) {
    return { ok: false as const, reason: "preview-origin", url: `${origin}/api/telegram` };
  }
  const result = await telegramCall("setWebhook", {
    url: `${origin}/api/telegram`,
    allowed_updates: ["message"],
  });
  return { ok: result.ok, reason: result.description ?? "ok", url: `${origin}/api/telegram` };
}

export async function handleTelegramUpdate(update: {
  message?: { chat?: { id?: number }; text?: string };
}) {
  const text = (update.message?.text ?? "").trim();
  const chatId = update.message?.chat?.id;
  if (!chatId) return;
  if (text === "/start" || text.startsWith("/start@") || text.startsWith("/start ")) {
    await sendStartMessage(chatId);
  }
}
