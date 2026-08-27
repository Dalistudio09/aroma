import { createFileRoute } from "@tanstack/react-router";
import {
  ensureTelegramWebhook,
  handleTelegramUpdate,
} from "@/lib/telegram.server";

export const Route = createFileRoute("/api/telegram")({
  server: {
    handlers: {
      GET: async () => {
        const result = await ensureTelegramWebhook();
        return Response.json(result);
      },
      POST: async ({ request }) => {
        try {
          const update = (await request.json()) as {
            message?: { chat?: { id?: number }; text?: string };
          };
          await handleTelegramUpdate(update);
        } catch {
          // Always 200 so Telegram does not retry forever.
        }
        return Response.json({ ok: true });
      },
    },
  },
});
