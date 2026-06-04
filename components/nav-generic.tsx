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

interface NavGenericProps {
  title?: string;
  hideOnCollapse?: boolean;
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
      {title && <SidebarGroupLabel>{title}</SidebarGroupLabel>}

      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.name}>
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
