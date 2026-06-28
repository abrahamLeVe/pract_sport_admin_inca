import { auth } from "@/auth";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getUserByIdAction } from "@/lib/data/users";
import { getNotificationList } from "../actions/notifications";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const session = await auth();
  const alerts = await getNotificationList();
  let freshUser = null;
  if (session?.user?.id) {
    const userRes = await getUserByIdAction(Number(session?.user?.id));
    freshUser = userRes;
  }
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
          name: freshUser?.name || session?.user?.name || "",
          email: session?.user?.email || "",
          image: freshUser?.image || session?.user?.image || "",
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
