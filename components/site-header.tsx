"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import React from "react";
import { ModeToggle } from "./mode-toggle";

// 1. Quitamos "new" del diccionario estático general
const routeTranslations: Record<string, string> = {
  dashboard: "Panel",
  users: "Usuarios",
  banners: "Banners",
  settings: "Configuración",
  products: "Productos",
  edit: "Editar",
  categories: "Categorías",
  brands: "Marcas",
  events: "Eventos",
  "race-settings": "Configuración de Competencias",
};

// 2. Creamos un diccionario específico para la palabra "new" basado en la sección madre
const newTranslations: Record<string, string> = {
  users: "Nuevo Usuario",
  banners: "Nuevo Banner",
  products: "Nuevo Producto",
  categories: "Nueva Categoría",
  brands: "Nueva Marca",
  events: "Nuevo Evento",
};

export function SiteHeader() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <header className="flex h-(--header-height) shrink-0 items-center border-b bg-background/95 backdrop-blur transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) sticky top-0 z-50">
      <div className="flex w-full items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1 h-8 w-8" />
          <Separator
            orientation="vertical"
            className="mx-1 data-[orientation=vertical]:h-4 hidden sm:block"
          />

          <Breadcrumb className="hidden sm:block">
            <BreadcrumbList>
              {segments.map((segment, index) => {
                const href = `/${segments.slice(0, index + 1).join("/")}`;
                const isLast = index === segments.length - 1;

                const isNumericId = !isNaN(Number(segment));
                const isEditSegment = segment.toLowerCase() === "edit";
                const isNewSegment = segment.toLowerCase() === "new";

                const shouldNotBeLink = isEditSegment || isNumericId;

                let translatedLabel = "";

                // 3. Lógica condicional: Si el segmento es "new", miramos el segmento anterior
                if (isNewSegment && index > 0) {
                  const parentSegment = segments[index - 1].toLowerCase();
                  // Si el padre está en nuestro diccionario especial (ej. "banners"), usamos "Nuevo Banner"
                  // Si no, le ponemos un genérico "Nuevo"
                  translatedLabel = newTranslations[parentSegment] || "Nuevo";
                } else {
                  // Flujo normal para las demás rutas
                  translatedLabel =
                    routeTranslations[segment.toLowerCase()] ||
                    segment.replace(/[-_]/g, " ").charAt(0).toUpperCase() +
                      segment.slice(1);
                }

                return (
                  <React.Fragment key={href}>
                    <BreadcrumbItem>
                      {isLast ? (
                        <BreadcrumbPage className="font-medium text-foreground">
                          {translatedLabel}
                        </BreadcrumbPage>
                      ) : shouldNotBeLink ? (
                        <span className="text-muted-foreground select-none">
                          {translatedLabel}
                        </span>
                      ) : (
                        <BreadcrumbLink
                          href={href}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {translatedLabel}
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

        <div className="flex items-center gap-2">
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
