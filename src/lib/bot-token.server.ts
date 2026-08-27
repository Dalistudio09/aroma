export function telegramBotToken(): string | undefined {
  const fromEnv = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (fromEnv) return fromEnv;
  return undefined;
}

export function isPublicHttpsOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    if (url.protocol !== "https:") return false;
    const host = url.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return false;
    return true;
  } catch {
    return false;
  }
}

export function canUseTelegramWebhook(origin: string): boolean {
  if (!isPublicHttpsOrigin(origin)) return false;
  try {
    const host = new URL(origin).hostname.toLowerCase();
    if (host === "grok.com" || host.endsWith(".grok.com")) return false;
    if (host === "grok-sandbox.com" || host.endsWith(".grok-sandbox.com")) return false;
    return true;
  } catch {
    return false;
  }
}
