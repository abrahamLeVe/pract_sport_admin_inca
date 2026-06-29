"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, User, ShoppingBag, Loader2 } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";

import { globalSearchAction, GlobalSearchResult } from "@/lib/data/search";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";
import { Button } from "./ui/button";

export function GlobalSearch() {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const [results, setResults] = useState<GlobalSearchResult>({
    athletes: [],
    orders: [],
  });

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // 🔥 2. Creamos la función debounced que ataca a la BD (espera 300ms)
  const debouncedDbSearch = useDebouncedCallback((searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults({ athletes: [], orders: [] });
      return;
    }

    startTransition(async () => {
      const data = await globalSearchAction(searchQuery);
      setResults(data);
    });
  }, 300);

  // 🔥 3. El manejador del input actualiza el texto rápido y llama al debounce
  const handleInputChange = (value: string) => {
    setQuery(value); // El texto se actualiza en pantalla al instante
    debouncedDbSearch(value); // El ataque a la base de datos se retrasa
  };

  const handleSelect = (path: string) => {
    setOpen(false);
    router.push(path);
  };

  return (
    <>
      <Button
        variant={"outline"}
        onClick={() => setOpen(true)}
        className="md:w-64"
      >
        <Search className="h-4 w-4" />
        <span>Buscar...</span>
        <kbd className="ml-auto pointer-events-none inline-flex h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command shouldFilter={false} className="w-full">
          <CommandInput
            placeholder="Busca por DNI, nombre, email o N° de pedido..."
            value={query}
            // 🔥 4. Llamamos a nuestra nueva función
            onValueChange={handleInputChange}
          />
          <CommandList>
            <CommandEmpty>
              {isPending ? (
                <div className="flex justify-center items-center py-6 text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Buscando...
                </div>
              ) : (
                "No se encontraron resultados."
              )}
            </CommandEmpty>

            {!isPending && results.athletes.length > 0 && (
              <CommandGroup heading="Atletas / Inscripciones">
                {results.athletes.map((athlete) => (
                  <CommandItem
                    key={`athlete-${athlete.id}`}
                    onSelect={() =>
                      handleSelect(
                        `/dashboard/registrations/edit/${athlete.id}`,
                      )
                    }
                    className="cursor-pointer"
                  >
                    <User className="mr-2 h-4 w-4 text-blue-500" />
                    <div className="flex flex-col">
                      <span>
                        {athlete.first_name} {athlete.last_name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        DNI/Doc: {athlete.document}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {!isPending && results.orders.length > 0 && (
              <CommandGroup heading="Órdenes de Tienda">
                {results.orders.map((order) => (
                  <CommandItem
                    key={`order-${order.id}`}
                    onSelect={() =>
                      handleSelect(`/dashboard/orders/edit/${order.id}`)
                    }
                    className="cursor-pointer"
                  >
                    <ShoppingBag className="mr-2 h-4 w-4 text-green-500" />
                    <div className="flex flex-col">
                      <span>
                        Pedido #{order.id} - {order.customer_name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {order.customer_email}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
