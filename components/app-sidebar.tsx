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
  ImageIcon,
  ProductLoadingIcon,
  Settings01Icon,
  Settings05Icon,
  TimelineEventIcon,
  UserGroupIcon,
  List,
  RegisterIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

// Organizamos los datos en grupos claros
const data = {
  // Operaciones diarias (Todos los roles)
  sales: [
    {
      name: "Dashboard",
      url: "/dashboard",
      icon: <HugeiconsIcon icon={DashboardSquare01Icon} />,
    },
    {
      name: "Pedidos",
      url: "/dashboard/orders",
      icon: <HugeiconsIcon icon={List} />,
    },
    {
      name: "Registros",
      url: "/dashboard/registrations",
      icon: <HugeiconsIcon icon={RegisterIcon} />,
    },
  ],
  // Catálogo y Contenido (Vendedores/Admin)
  catalog: [
    {
      name: "Productos",
      url: "/dashboard/products",
      icon: <HugeiconsIcon icon={ProductLoadingIcon} />,
    },
    {
      name: "Categorías",
      url: "/dashboard/categories",
      icon: <HugeiconsIcon icon={Folder01Icon} />,
    },
    {
      name: "Marcas",
      url: "/dashboard/brands",
      icon: <HugeiconsIcon icon={BrandfetchIcon} />,
    },
    {
      name: "Banners",
      url: "/dashboard/banners",
      icon: <HugeiconsIcon icon={ImageIcon} />,
    },
  ],
  // Configuración de Sistema (Solo Super Admin)
  admin: [
    {
      name: "Usuarios",
      url: "/dashboard/users",
      icon: <HugeiconsIcon icon={UserGroupIcon} />,
    },
    {
      name: "Eventos",
      url: "/dashboard/events",
      icon: <HugeiconsIcon icon={TimelineEventIcon} />,
    },
    {
      name: "Club Settings",
      url: "/dashboard/settings",
      icon: <HugeiconsIcon icon={Settings05Icon} />,
    },
    {
      name: "Competencias",
      url: "/dashboard/race-settings",
      icon: <HugeiconsIcon icon={Settings01Icon} />,
    },
    {
      name: "Variables Store",
      url: "/dashboard/store-settings",
      icon: <HugeiconsIcon icon={Settings05Icon} />,
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
      <SidebarHeader>{/* ... tu logo ... */}</SidebarHeader>
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
      <SidebarContent>
        {/* Renderizado de grupos */}
        <NavGeneric title="Operaciones" items={data.sales} />
        <NavGeneric title="Catálogo" items={data.catalog} />

        {user.role === "SUPERADMIN" && (
          <NavGeneric
            title="Administración"
            items={data.admin}
            hideOnCollapse={true}
          />
        )}
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
