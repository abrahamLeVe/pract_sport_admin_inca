import {
  deleteVariantAction,
  toggleVariantStatusAction,
} from "@/app/actions/variants";
import { DeleteActionItem } from "@/components/delete-action-item";
import { ToggleStatusActionItem } from "@/components/toggle-status-action-item";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProductVariant } from "@/validations/variants";
import { MoreHorizontal } from "lucide-react";
import { EditVariantDialog } from "./edit-variant-dialog";
import { RegisterVariantDialog } from "./register-variant-dialog";
import { getVariantsByProductIdAction } from "@/lib/data/variant";

interface VariantsTableProps {
  productId: number;
}

export async function VariantsTable({ productId }: VariantsTableProps) {
  const variants: ProductVariant[] =
    await getVariantsByProductIdAction(productId);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight">
            Tallas y Colores (Variantes)
          </h2>
          <p className="text-sm text-muted-foreground">
            Gestiona el inventario específico para cada talla y color.
          </p>
        </div>
        <RegisterVariantDialog productId={productId} />
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16 text-center">N°</TableHead>
              <TableHead>Talla</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-12 text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {variants.length > 0 ? (
              variants.map((variant, index) => (
                <TableRow key={variant.id}>
                  <TableCell className="text-center">{index + 1}</TableCell>

                  <TableCell className="font-medium">
                    {variant.size || (
                      <span className="text-muted-foreground italic">-</span>
                    )}
                  </TableCell>

                  <TableCell>
                    {variant.color || (
                      <span className="text-muted-foreground italic">-</span>
                    )}
                  </TableCell>

                  <TableCell className="text-muted-foreground text-sm">
                    {variant.sku || <span className="italic">N/A</span>}
                  </TableCell>

                  <TableCell>{variant.stock} un.</TableCell>

                  <TableCell>
                    <Badge
                      variant={
                        variant.status === "activo" ? "default" : "secondary"
                      }
                    >
                      {variant.status}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="p-2 hover:bg-accent rounded-md">
                        <span className="sr-only">Abrir menú</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Opciones</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <EditVariantDialog variant={variant} />

                        <ToggleStatusActionItem
                          id={variant.id}
                          itemName={`Talla ${variant.size || "Única"} - Color ${variant.color || "N/A"}`}
                          itemType="variante"
                          currentStatus={variant.status}
                          action={toggleVariantStatusAction}
                        />

                        <DeleteActionItem
                          id={variant.id}
                          itemName={`Talla ${variant.size} - Color ${variant.color}`}
                          itemType="variante"
                          action={deleteVariantAction}
                          warningText="Se borrará el stock asociado a esta combinación."
                        />
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground"
                >
                  No hay variantes registradas. Este producto utiliza el stock
                  general.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
