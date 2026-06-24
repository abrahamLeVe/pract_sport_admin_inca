import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "@/auth";
import { getNotificationList } from "../actions/notifications";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const session = await auth();
  const alerts = await getNotificationList();

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar
        variant="inset"
        user={{
          name: session?.user?.name || "Usuario",
          email: session?.user?.email || "",
          avatar: "",
          role: session?.user?.role,
        }}
      />

      <SidebarInset>
        <SiteHeader initialAlerts={alerts} />
        <div className="@container/main">
          <div className="px-4 lg:px-6 py-4 md:py-6 max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
