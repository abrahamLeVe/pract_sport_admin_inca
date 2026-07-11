"use client";

import {
  createEventCategoryAction,
  deleteEventCategoryAction,
  updateEventCategoryAction,
} from "@/app/actions/events/categories";
import { DataTable } from "@/components/data-table";
import { TrashActionItem } from "@/components/trash-action-item";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EventCategoriesTableProps } from "@/validations/events";
import { ColumnDef } from "@tanstack/react-table";
import { Pencil, Plus } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

export function EventCategoriesTable({
  eventId,
  categories,
  distances,
  genders,
  ageCategories,
}: EventCategoriesTableProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  const [modalData, setModalData] = useState({
    distance_id: "",
    gender_id: "",
    age_category_id: "",
    min_age: "",
    max_age: "",
    price: "0",
    cupos: "0",
  });

  const handleAction = async (prevState: any, formData: FormData) => {
    if (formData.get("id")) {
      return updateEventCategoryAction(prevState, formData);
    }
    return createEventCategoryAction(prevState, formData);
  };

  const [state, formAction, isPending] = useActionState(handleAction, {
    success: false,
    message: "",
    data: {},
  });

  useEffect(() => {
    if (!state.message) return;
    if (state.success) {
      toast.success(state.message);
      setIsOpen(false);
      setEditingItem(null);
    } else {
      toast.error(state.message);
    }
  }, [state]);

  const openDialog = (item?: any) => {
    if (item) {
      setModalData({
        distance_id: item.distance_id.toString(),
        gender_id: item.gender_id.toString(),
        age_category_id: item.age_category_id.toString(),
        min_age: item.applied_min_age.toString(),
        max_age: item.applied_max_age.toString(),
        price: item.price.toString(),
        cupos: item.cupos.toString(),
      });
    } else {
      setModalData({
        distance_id: "",
        gender_id: "",
        age_category_id: "",
        min_age: "",
        max_age: "",
        price: "0",
        cupos: "0",
      });
    }
    setEditingItem(item || null);
    setIsOpen(true);
  };

  const handleDeleteWrapper = async (id: number) =>
    deleteEventCategoryAction(id, eventId);

  // 🔥 DEFINICIÓN DE COLUMNAS PARA EL DATATABLE
  const columns: ColumnDef<any>[] = [
    {
      id: "categoria", // ID para el buscador
      accessorFn: (row) =>
        `${row.distance_name} ${row.gender_name} ${row.age_category_name}`,
      header: "Categoría / Edades",
      cell: ({ row }) => {
        const cat = row.original;
        return (
          <div className="flex flex-col gap-1">
            <span className="font-medium">{`${cat.distance_name} - ${cat.gender_name} - ${cat.age_category_name}`}</span>
            <span className="text-xs text-muted-foreground">
              Edades: {cat.applied_min_age} a {cat.applied_max_age} años
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "price",
      header: () => <div className="text-center">Precio</div>,
      cell: ({ row }) => (
        <div className="text-center font-semibold">S/ {row.original.price}</div>
      ),
    },
    {
      id: "cupos",
      header: () => <div className="text-center">Cupos</div>,
      cell: ({ row }) => {
        const cat = row.original;
        return (
          <div className="flex flex-col items-center">
            <span className="font-medium">
              {cat.registered_count} /{" "}
              {Number(cat.cupos) === 0 ? "∞" : cat.cupos}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {Number(cat.cupos) === 0 ? "Inscritos" : "Cupos usados"}
            </span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Acciones</div>,
      cell: ({ row }) => {
        const cat = row.original;
        return (
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="icon" onClick={() => openDialog(cat)}>
              <Pencil className="w-4 h-4" />
            </Button>
            <TrashActionItem
              id={cat.id}
              action={handleDeleteWrapper}
              disabled={cat.registered_count > 0}
              title="¿Eliminar Categoría?"
              description={
                cat.registered_count > 0
                  ? "No puedes eliminar esta categoría porque ya tiene atletas inscritos."
                  : "Se enviará a la papelera este evento."
              }
              variant="ghost"
              size="icon"
            />
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4 bg-card p-6 rounded-lg border shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Lista de Categorías</h2>
        <Dialog
          open={isOpen}
          onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) setEditingItem(null);
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="w-4 h-4 mr-2" /> Nueva Categoría
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Editar Categoría" : "Agregar Categoría"}
              </DialogTitle>
              <DialogDescription></DialogDescription>
            </DialogHeader>

            <form
              key={editingItem ? `edit-${editingItem.id}` : "create"}
              action={formAction}
              className="space-y-4 mt-4"
            >
              <input type="hidden" name="event_id" value={eventId} />
              {editingItem && (
                <input type="hidden" name="id" value={editingItem.id} />
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="distance_id">Distancia</Label>
                  <input
                    type="hidden"
                    name="distance_id"
                    value={modalData.distance_id}
                  />
                  <Select
                    name="ui_distance_id"
                    value={modalData.distance_id}
                    onValueChange={(val) =>
                      setModalData({ ...modalData, distance_id: val })
                    }
                    required
                    disabled={isPending}
                  >
                    <SelectTrigger id="distance_id">
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {distances.map((d) => (
                        <SelectItem key={d.id} value={d.id.toString()}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormError error={state.zodErrors?.distance_id} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender_id">Género</Label>
                  <input
                    type="hidden"
                    name="gender_id"
                    value={modalData.gender_id}
                  />

                  <Select
                    name="ui_gender_id"
                    value={modalData.gender_id}
                    onValueChange={(val) =>
                      setModalData({ ...modalData, gender_id: val })
                    }
                    required
                    disabled={isPending}
                  >
                    <SelectTrigger id="gender_id">
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {genders.map((g) => (
                        <SelectItem key={g.id} value={g.id.toString()}>
                          {g.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormError error={state.zodErrors?.gender_id} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age_category_id">Edad (Maestra)</Label>
                  <input
                    type="hidden"
                    name="age_category_id"
                    value={modalData.age_category_id}
                  />
                  <Select
                    name="ui_age_category_id"
                    value={modalData.age_category_id}
                    onValueChange={(val) => {
                      const ageCat = ageCategories.find(
                        (a) => a.id.toString() === val,
                      );
                      setModalData({
                        ...modalData,
                        age_category_id: val,
                        min_age: ageCat?.default_min_age.toString() || "",
                        max_age: ageCat?.default_max_age.toString() || "",
                      });
                    }}
                    required
                    disabled={isPending}
                  >
                    <SelectTrigger id="age_category_id">
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {ageCategories.map((a) => (
                        <SelectItem key={a.id} value={a.id.toString()}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormError error={state.zodErrors?.age_category_id} />
                </div>
              </div>

              {/* LOS CAMPOS NUMÉRICOS EDITABLES */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="min_age">Edad Min.</Label>
                  <Input
                    id="min_age"
                    name="min_age"
                    type="number"
                    value={modalData.min_age}
                    onChange={(e) =>
                      setModalData({ ...modalData, min_age: e.target.value })
                    }
                    required
                    disabled={isPending}
                  />
                  <FormError error={state.zodErrors?.applied_min_age} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_age">Edad Max.</Label>
                  <Input
                    id="max_age"
                    name="max_age"
                    type="number"
                    value={modalData.max_age}
                    onChange={(e) =>
                      setModalData({ ...modalData, max_age: e.target.value })
                    }
                    required
                    disabled={isPending}
                  />
                  <FormError error={state.zodErrors?.applied_max_age} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Precio (S/)</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    value={modalData.price}
                    onChange={(e) =>
                      setModalData({ ...modalData, price: e.target.value })
                    }
                    required
                    disabled={isPending}
                  />
                  <FormError error={state.zodErrors?.price} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cupos">Cupos</Label>
                  <Input
                    id="cupos"
                    name="cupos"
                    type="number"
                    value={modalData.cupos}
                    onChange={(e) =>
                      setModalData({ ...modalData, cupos: e.target.value })
                    }
                    required
                    disabled={isPending}
                  />
                  <FormError error={state.zodErrors?.cupos} />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Guardando..." : "Guardar Categoría"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* 🔥 REEMPLAZO DE LA TABLA NATIVA POR DATATABLE */}
      <DataTable columns={columns} data={categories} searchKey="categoria" />
    </div>
  );
}
