import { Sidebar } from "./Sidebar";
import { UserMenu } from "./UserMenu";
import { NotificationBell } from "./NotificationBell";

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen" style={{ background: "rgb(8, 7, 18)" }}>
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header
          className="h-[58px] px-6 flex items-center justify-end gap-3 shrink-0"
          style={{
            position: "relative",
            zIndex: 100,
            background: "rgba(12, 10, 28, 0.95)",
            backdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <NotificationBell />

          {/* Divider */}
          <div className="w-px h-5" style={{ background: "rgba(255,255,255,0.07)" }} />

          {/* Avatar + Menu */}
          <UserMenu />
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
