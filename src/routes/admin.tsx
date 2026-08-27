import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ScreenHeader } from "@/components/screen-header";
import { useTelegram } from "@/lib/telegram";

export const Route = createFileRoute("/admin")({ component: AdminLayout });

function AdminLayout() {
  const telegram = useTelegram();

  if (telegram.ready && !telegram.isAdmin) {
    return (
      <div>
        <ScreenHeader title="Админ" />
        <p className="text-sm text-muted">Нет доступа</p>
      </div>
    );
  }

  return <Outlet />;
}
