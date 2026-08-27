const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
if (!token) {
  console.error("TELEGRAM_BOT_TOKEN is not set");
  process.exit(1);
}
const localHook = "http://127.0.0.1:8080/api/telegram";
let offset = 0;

async function loop() {
  while (true) {
    try {
      const url = new URL(`https://api.telegram.org/bot${token}/getUpdates`);
      url.searchParams.set("timeout", "50");
      url.searchParams.set("offset", String(offset));
      url.searchParams.set("allowed_updates", JSON.stringify(["message"]));
      const response = await fetch(url);
      const data = await response.json();
      if (data.error_code === 409) {
        await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`);
        await sleep(2_000);
        continue;
      }
      if (!data.ok) {
        await sleep(3_000);
        continue;
      }
      for (const update of data.result ?? []) {
        offset = Number(update.update_id) + 1;
        await fetch(localHook, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(update),
        }).catch(() => undefined);
      }
    } catch {
      await sleep(3_000);
    }
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

void loop();
