import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { Toaster } from "sonner";
import {
  defaultTelegramState,
  readTelegramState,
  registerTelegramWebhook,
  TelegramContext,
  type TelegramState,
} from "@/lib/telegram";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 15_000,
        refetchOnWindowFocus: false,
      },
    },
  });
}

function loadTelegramSdk(): Promise<void> {
  if (window.Telegram?.WebApp) return Promise.resolve();
  const existing = document.querySelector<HTMLScriptElement>("script[data-telegram-sdk]");
  if (existing) {
    return new Promise((resolve) => {
      existing.addEventListener("load", () => resolve(), { once: true });
      window.setTimeout(() => resolve(), 800);
    });
  }
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-web-app.js";
    script.async = true;
    script.dataset.telegramSdk = "true";
    script.onload = () => resolve();
    script.onerror = () => resolve();
    document.head.appendChild(script);
    window.setTimeout(() => resolve(), 800);
  });
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(makeQueryClient);
  const [telegram, setTelegram] = useState<TelegramState>(defaultTelegramState);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await loadTelegramSdk();
      if (cancelled) return;
      const next = readTelegramState();
      setTelegram(next);
      registerTelegramWebhook().catch(() => undefined);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TelegramContext.Provider value={telegram}>
        {children}
        <Toaster
          theme="dark"
          position="top-center"
          toastOptions={{
            className: "!bg-elevated !text-fg !border-border",
          }}
        />
      </TelegramContext.Provider>
    </QueryClientProvider>
  );
}
