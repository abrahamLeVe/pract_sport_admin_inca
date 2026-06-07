"use client";

import { deleteEventCategoryAction } from "@/app/actions/event-categories";
import { DeleteActionItem } from "@/components/delete-action-item";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EventCategoriesTableProps } from "@/validations/event-categories";
import { Plus } from "lucide-react";
import Link from "next/link";

export function EventCategoriesTable({
  categories,
  eventId,
}: EventCategoriesTableProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Categorías de Competencia</h2>
        <Button asChild size="sm">
          <Link href={`/dashboard/events/edit/${eventId}/categories/new`}>
            <Plus className="h-4 w-4 mr-2" /> Agregar Categoría
          </Link>
        </Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Edad</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Cupos</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length > 0 ? (
              categories.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell className="font-medium">{cat.name}</TableCell>
                  <TableCell>
                    {cat.min_age || 0} - {cat.max_age || "∞"}
                  </TableCell>
                  <TableCell>S/ {Number(cat.price).toFixed(2)}</TableCell>
                  <TableCell>{cat.cupos}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link
                          href={`/dashboard/events/edit/${eventId}/categories/edit/${cat.id}`}
                        >
                          Editar
                        </Link>
                      </Button>
                      <DeleteActionItem
                        id={cat.id}
                        itemName={cat.name}
                        itemType="categoría"
                        action={() =>
                          deleteEventCategoryAction(cat.id, eventId)
                        }
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-6 text-muted-foreground"
                >
                  No hay categorías registradas para este evento.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
