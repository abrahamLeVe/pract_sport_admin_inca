"use client";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";

// 📝 Definimos las propiedades elásticas que aceptará nuestro componente único
interface NavGenericProps {
  title?: string; // Opcional: Si lo mandas, dibuja el título gris arriba
  hideOnCollapse?: boolean; // Opcional: Si es true, oculta todo el grupo cuando el Sidebar sea solo iconos
  items: {
    name: string;
    url: string;
    icon?: React.ReactNode;
  }[];
}

export function NavGeneric({
  title,
  hideOnCollapse = false,
  items,
}: NavGenericProps) {
  return (
    <SidebarGroup
      className={hideOnCollapse ? "group-data-[collapsible=icon]:hidden" : ""}
    >
      {/* 🏷️ Solo renderiza el título si pasaste la propiedad 'title' */}
      {title && <SidebarGroupLabel>{title}</SidebarGroupLabel>}

      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.name}>
              {/* 💡 Si no se oculta al colapsar, el tooltip ayuda a saber qué menú es */}
              <SidebarMenuButton
                tooltip={hideOnCollapse ? undefined : item.name}
                asChild
              >
                <Link href={item.url}>
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
