"use client";

import * as React from "react";

import { NavGeneric } from "@/components/nav-generic";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  BrandfetchIcon,
  CommandIcon,
  DashboardSquare01Icon,
  Folder01Icon,
  HelpCircleIcon,
  ImageIcon,
  ProductLoadingIcon,
  SearchIcon,
  Settings05Icon,
  TimelineEventIcon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

const data = {
  navMain: [
    {
      name: "Dashboard",
      url: "/dashboard",
      icon: <HugeiconsIcon icon={DashboardSquare01Icon} strokeWidth={2} />,
    },
    {
      name: "Banners",
      url: "/dashboard/banners",
      icon: <HugeiconsIcon icon={ImageIcon} strokeWidth={2} />,
    },
    {
      name: "Categorías",
      url: "/dashboard/categories",
      icon: <HugeiconsIcon icon={Folder01Icon} strokeWidth={2} />,
    },
    {
      name: "Marcas",
      url: "/dashboard/brands",
      icon: <HugeiconsIcon icon={BrandfetchIcon} strokeWidth={2} />,
    },
    {
      name: "Productos",
      url: "/dashboard/products",
      icon: <HugeiconsIcon icon={ProductLoadingIcon} strokeWidth={2} />,
    },
  ],
  navSuperadmin: [
    {
      name: "Gestión de Usuarios",
      url: "/dashboard/users",
      icon: <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} />,
    },
    {
      name: "Configuración del Club",
      url: "/dashboard/settings",
      icon: <HugeiconsIcon icon={Settings05Icon} strokeWidth={2} />,
    },
    {
      name: "Eventos",
      url: "/dashboard/events",
      icon: <HugeiconsIcon icon={TimelineEventIcon} strokeWidth={2} />,
    },
    {
      name: "Search",
      url: "#",
      icon: <HugeiconsIcon icon={SearchIcon} strokeWidth={2} />,
    },
  ],
};

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: {
    name: string;
    email: string;
    avatar?: string;
    role?: string;
  };
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link href="/dashboard">
                <HugeiconsIcon
                  icon={CommandIcon}
                  strokeWidth={2}
                  className="size-5!"
                />
                <span className="text-base font-semibold">Inka Team Admin</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavGeneric items={data.navMain} />

        {user.role === "SUPERADMIN" && (
          <NavGeneric
            title="Administración"
            hideOnCollapse={true}
            items={data.navSuperadmin}
          />
        )}
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
