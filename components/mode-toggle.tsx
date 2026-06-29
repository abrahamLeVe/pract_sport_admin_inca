"use client";

import { Monitor, Moon, Sun } from "lucide-react"; // Importamos Monitor para el tema del sistema
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ModeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost" /* Cambiado a ghost para un aspecto más limpio y minimalista */
          size="icon"
          className="relative hover:bg-accent hover:text-accent-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
        >
          {/* Icono de Sol: Gira y desaparece en modo oscuro */}
          <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all duration-300 dark:scale-0 dark:-rotate-90 text-amber-500" />

          {/* Icono de Luna: Gira y aparece en modo oscuro */}
          <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all duration-300 dark:scale-100 dark:rotate-0 text-blue-400" />

          <span className="sr-only">Cambiar tema</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-40 mt-1 p-1 animate-in fade-in-50 slide-in-from-top-1 rounded-xl"
      >
        {/* Opción Modo Claro */}
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className="flex items-center gap-2 cursor-pointer rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-accent"
        >
          <Sun className="h-4 w-4 text-amber-500" />
          <span>Claro</span>
        </DropdownMenuItem>

        {/* Opción Modo Oscuro */}
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className="flex items-center gap-2 cursor-pointer rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-accent"
        >
          <Moon className="h-4 w-4 text-blue-400" />
          <span>Oscuro</span>
        </DropdownMenuItem>

        {/* Opción Sistema */}
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className="flex items-center gap-2 cursor-pointer rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-accent"
        >
          <Monitor className="h-4 w-4 text-muted-foreground" />
          <span>Sistema</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
