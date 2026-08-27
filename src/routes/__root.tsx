import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AppProviders } from "@/components/providers";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { Shell } from "@/components/shell";
import { AuthProvider } from "@/lib/auth/provider";
import appCss from "../styles.css?url";

const APP_NAME = "Aroma";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1" },
      { title: APP_NAME },
      { name: "theme-color", content: "#100E0C" },
      { name: "description", content: "Aroma — парфюмерия в Telegram. Распив и готовые флаконы." },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Outfit:wght@400;500;600&display=swap",
      },
    ],
  }),
  component: RootDocument,
});

function RootDocument() {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="antialiased">
        <PreviewHostBridge />
        <AuthProvider>
          <AppProviders>
            <Shell>
              <Outlet />
            </Shell>
          </AppProviders>
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  );
}
