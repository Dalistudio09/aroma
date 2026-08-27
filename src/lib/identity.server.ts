import { createHmac, timingSafeEqual } from "node:crypto";
import { telegramBotToken } from "./bot-token.server";
import { ADMIN_TELEGRAM_ID } from "./constants";
import type { Identity } from "./types";

function botToken(): string | undefined {
  return telegramBotToken();
}

function verifyInitData(initData: string, token: string): boolean {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return false;
  params.delete("hash");
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  const secretKey = createHmac("sha256", "WebAppData").update(token).digest();
  const computed = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
  try {
    const a = Buffer.from(computed, "hex");
    const b = Buffer.from(hash, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function parseUser(initData: string): { id: number; first_name?: string } | null {
  try {
    const params = new URLSearchParams(initData);
    const raw = params.get("user");
    if (!raw) return null;
    const user = JSON.parse(raw) as { id?: number; first_name?: string };
    if (typeof user.id !== "number") return null;
    return { id: user.id, first_name: user.first_name };
  } catch {
    return null;
  }
}

export function resolveIdentity(initData: string | undefined): Identity {
  const token = botToken();
  const trimmed = initData?.trim() ?? "";

  if (trimmed) {
    if (token && !verifyInitData(trimmed, token)) {
      throw new Error("Недействительная сессия Telegram");
    }
    const user = parseUser(trimmed);
    if (user) {
      const telegramId = String(user.id);
      return {
        telegramId,
        firstName: user.first_name ?? "",
        isAdmin: telegramId === ADMIN_TELEGRAM_ID,
      };
    }
  }

  const preview = process.env.NODE_ENV !== "production";
  return {
    telegramId: "preview-user",
    firstName: "Гость",
    isAdmin: preview,
  };
}

export function requireAdmin(initData: string | undefined): Identity {
  const identity = resolveIdentity(initData);
  if (!identity.isAdmin) {
    throw new Error("Нет доступа");
  }
  return identity;
}
