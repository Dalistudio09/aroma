import { createServerFn } from "@tanstack/react-start";
import { createContext, useContext } from "react";
import { ADMIN_TELEGRAM_ID } from "./constants";

export type TelegramState = {
  ready: boolean
  initData: string
  userId: string | null
  firstName: string
  isAdmin: boolean
  insideTelegram: boolean
};

export const defaultTelegramState: TelegramState = {
  ready: false,
  initData: "",
  userId: null,
  firstName: "",
  isAdmin: false,
  insideTelegram: false,
};

export const TelegramContext = createContext<TelegramState>(defaultTelegramState);

export function useTelegram() {
  return useContext(TelegramContext);
}

export function readTelegramState(): TelegramState {
  const webApp = window.Telegram?.WebApp;
  const initData = webApp?.initData || "";
  const insideTelegram = initData.length > 0;

  if (insideTelegram && webApp) {
    try {
      webApp.ready();
      webApp.expand();
      webApp.setHeaderColor("#100E0C");
      webApp.setBackgroundColor("#100E0C");
    } catch {
      // Older clients may not support theme helpers.
    }
    const user = webApp.initDataUnsafe?.user;
    return {
      ready: true,
      initData,
      userId: user?.id ? String(user.id) : null,
      firstName: user?.first_name ?? "",
      isAdmin: user?.id ? String(user.id) === ADMIN_TELEGRAM_ID : false,
      insideTelegram: true,
    };
  }

  return {
    ready: true,
    initData: "",
    userId: "preview-user",
    firstName: "Гость",
    isAdmin: import.meta.env.DEV,
    insideTelegram: false,
  };
}

export const registerTelegramWebhook = createServerFn({ method: "GET" }).handler(
  async () => {
    const { ensureTelegramWebhook } = await import("./telegram.server");
    return ensureTelegramWebhook();
  },
);

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void
        expand: () => void
        initData: string
        initDataUnsafe?: {
          user?: { id: number; first_name?: string }
        }
        setHeaderColor: (color: string) => void
        setBackgroundColor: (color: string) => void
      }
    }
  }
}
