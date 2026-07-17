"use client";

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  Table as TanstackTable,
} from "@tanstack/react-table";
import * as React from "react";
import { Download } from "lucide-react"; // 🔥 Icono añadido
import { exportToCsv } from "@/lib/utils"; // 🔥 Utilidad añadida

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "./ui/label";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  exportFilename?: string; // 🔥 NUEVO: Si se envía, aparece el botón de exportar
  renderSelectionActions?: (
    selectedIds: any[],
    clearSelection: () => void,
  ) => React.ReactNode;
  renderCustomFilters?: (table: TanstackTable<TData>) => React.ReactNode;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Buscar...",
  exportFilename,
  renderSelectionActions,
  renderCustomFilters,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedIds = selectedRows.map((row) => (row.original as any).id);
  const clearSelection = () => table.toggleAllPageRowsSelected(false);

  // 🔥 NUEVO: Lógica de exportación
  const handleExport = () => {
    if (!exportFilename) return;

    // Obtenemos solo las filas filtradas actuales
    const rows = table.getFilteredRowModel().rows;

    // Ignoramos las columnas de acciones, checkboxes y detalles visuales
    const visibleColumns = table
      .getVisibleLeafColumns()
      .filter(
        (col) =>
          col.id !== "actions" && col.id !== "select" && col.id !== "details",
      );

    const exportData = rows.map((row) => {
      const rowData: Record<string, any> = {};
      visibleColumns.forEach((col) => {
        // Obtenemos el valor crudo subyacente
        let value = row.getValue(col.id);

        // Si la data original es un objeto JSON, lo stringificamos
        if (typeof value === "object" && value !== null) {
          value = JSON.stringify(value);
        }

        // Usamos el nombre de la cabecera si es un string, sino su ID
        const colHeader =
          typeof col.columnDef.header === "string"
            ? col.columnDef.header
            : col.id;
        rowData[colHeader] = value ?? "";
      });
      return rowData;
    });

    exportToCsv(exportFilename, exportData);
  };

  return (
    <div className="space-y-4">
      {/* ================= BARRA SUPERIOR ================= */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Label className="sr-only" htmlFor="search"></Label>

        <div className="flex flex-1 items-center gap-2 w-full sm:w-auto">
          {searchKey ? (
            <Input
              type="search"
              id="search"
              placeholder={searchPlaceholder}
              value={
                (table.getColumn(searchKey)?.getFilterValue() as string) ?? ""
              }
              onChange={(event) =>
                table.getColumn(searchKey)?.setFilterValue(event.target.value)
              }
              className="max-w-sm"
            />
          ) : null}

          {renderCustomFilters && renderCustomFilters(table)}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {selectedIds.length > 0 && renderSelectionActions && (
            <div className="flex items-center gap-2 mr-2">
              {renderSelectionActions(selectedIds, clearSelection)}
            </div>
          )}

          {/* 🔥 BOTÓN DE EXPORTAR (Solo se muestra si se pasa el prop exportFilename) */}
          {exportFilename && (
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Columnas</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  const title =
                    typeof column.columnDef.header === "string"
                      ? column.columnDef.header
                      : column.id.replace("_", " ");

                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {title}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ================= TABLA DE DATOS ================= */}
      <div className="rounded-md border w-full overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader className="bg-muted/50">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No hay resultados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ================= PAGINACIÓN ================= */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} de{" "}
          {table.getFilteredRowModel().rows.length} fila(s) seleccionada(s).
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
}
