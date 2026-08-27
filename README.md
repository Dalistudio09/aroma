# Aroma

Telegram Mini App парфюмерного магазина: каталог, корзина, заказы и админка.

## Локальный запуск

```bash
npm install
npm run dev
```

Приложение: http://localhost:8080

Локально, без `DATABASE_URL`, используется встроенная база PGLite только для предпросмотра. Каталог из 18 ароматов создаётся при старте.

## Переменные окружения

На Vercel задайте ключи в Project Settings → Environment Variables.

| Переменная | Назначение |
|---|---|
| `DATABASE_URL` | **Обязательно на Vercel.** Postgres (Neon). Без него запись заказов и товаров не работает. |
| `TELEGRAM_BOT_TOKEN` | Токен бота от [@BotFather](https://t.me/BotFather) |
| `TELEGRAM_WEBAPP_URL` | Публичный HTTPS-адрес, например `https://your-app.vercel.app` |

В продакшене PGlite не используется. Все сохранения идут в Postgres по `DATABASE_URL`.

## Деплой на Vercel

1. Залейте этот репозиторий на GitHub (`package.json` в корне).
2. Import Project в Vercel, Root Directory — корень репозитория.
3. Build Command: `npm run build`.
4. Добавьте `DATABASE_URL`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBAPP_URL` для Production.
5. После первого деплоя поставьте `TELEGRAM_WEBAPP_URL` равным URL Vercel и сделайте Redeploy.
6. Откройте `https://your-app.vercel.app/api/telegram` один раз — бот зарегистрирует webhook.
7. В BotFather: `/setdomain` на домен Vercel.
8. Напишите боту `/start` — придут фото, текст и кнопка «Открыть магазин».

Админ панели: Telegram ID `743736933`.

## Стек

TanStack Start, React 19, Tailwind v4, Postgres (Neon), Telegram Bot API.
