"use client";

import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ModeToggle } from "./mode-toggle";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import React from "react";

export function SiteHeader() {
  const pathname = usePathname();

  // Dividimos la ruta actual para generar los Breadcrumbs dinámicamente
  // Ejemplo: /dashboard/users -> ["dashboard", "users"]
  const segments = pathname.split("/").filter(Boolean);

  return (
    <header className="flex h-(--header-height) shrink-0 items-center border-b bg-background/95 backdrop-blur transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) sticky top-0 z-50">
      <div className="flex w-full items-center justify-between px-4 lg:px-6">
        {/* SECCIÓN IZQUIERDA: Navegación y Ubicación Actual */}
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1 h-8 w-8" />
          <Separator
            orientation="vertical"
            className="mx-1 data-[orientation=vertical]:h-4 hidden sm:block"
          />

          {/* Breadcrumbs Dinámicos en lugar de un título estático */}
          <Breadcrumb className="hidden sm:block">
            <BreadcrumbList>
              {segments.map((segment, index) => {
                const href = `/${segments.slice(0, index + 1).join("/")}`;
                const isLast = index === segments.length - 1;

                // Capitalizamos el texto para que se vea limpio (ej: users -> Users)
                const label =
                  segment.charAt(0).toUpperCase() + segment.slice(1);

                return (
                  <React.Fragment key={href}>
                    <BreadcrumbItem>
                      {isLast ? (
                        <BreadcrumbPage className="font-medium text-foreground">
                          {label === "Users" ? "Usuarios" : label}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink
                          href={href}
                          className="capitalize text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {label === "Dashboard" ? "Panel" : label}
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {!isLast && <BreadcrumbSeparator />}
                  </React.Fragment>
                );
              })}
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* SECCIÓN DERECHA: Herramientas del Usuario y Ajustes Globales */}
        <div className="flex items-center gap-2">
          {/* El selector de tema ahora descansa elegantemente a la derecha */}
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
