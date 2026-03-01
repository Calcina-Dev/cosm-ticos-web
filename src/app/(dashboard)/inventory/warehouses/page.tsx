"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    warehousesService,
    Warehouse,
    CreateWarehousePayload,
    WarehouseType,
} from "@/features/inventory/warehouses.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Warehouse as WarehouseIcon } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const WAREHOUSE_TYPES: { value: WarehouseType; label: string }[] = [
    { value: "MAIN", label: "Principal" },
    { value: "SECONDARY", label: "Secundario" },
    { value: "TRANSIT", label: "Tránsito" },
    { value: "VIRTUAL", label: "Virtual" },
];

const TYPE_COLORS: Record<WarehouseType, string> = {
    MAIN: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    SECONDARY: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    TRANSIT: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    VIRTUAL: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
};

const warehouseSchema = z.object({
    name: z.string().min(1, "El nombre es requerido"),
    type: z.enum(["MAIN", "SECONDARY", "TRANSIT", "VIRTUAL"]).optional(),
    address: z.string().optional(),
});

type WarehouseFormValues = z.infer<typeof warehouseSchema>;

function WarehouseForm({
    defaultValues,
    onSubmit,
    isLoading,
}: {
    defaultValues?: Partial<WarehouseFormValues>;
    onSubmit: (values: WarehouseFormValues) => void;
    isLoading: boolean;
}) {
    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
    } = useForm<WarehouseFormValues>({
        resolver: zodResolver(warehouseSchema),
        defaultValues,
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input id="name" {...register("name")} placeholder="Ej: Almacén Central" />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
                <Label>Tipo</Label>
                <Controller
                    name="type"
                    control={control}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona un tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                {WAREHOUSE_TYPES.map((t) => (
                                    <SelectItem key={t.value} value={t.value}>
                                        {t.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input id="address" {...register("address")} placeholder="Dirección del almacén" />
            </div>
            <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Guardando..." : "Guardar"}
                </Button>
            </DialogFooter>
        </form>
    );
}

export default function WarehousesPage() {
    const queryClient = useQueryClient();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const { data: warehouses = [], isLoading } = useQuery({
        queryKey: ["warehouses"],
        queryFn: warehousesService.getAll,
    });

    const createMutation = useMutation({
        mutationFn: (payload: CreateWarehousePayload) => warehousesService.create(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["warehouses"] });
            toast.success("Almacén creado exitosamente");
            setDialogOpen(false);
        },
        onError: () => toast.error("Error al crear el almacén"),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: CreateWarehousePayload }) =>
            warehousesService.update(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["warehouses"] });
            toast.success("Almacén actualizado");
            setDialogOpen(false);
            setEditingWarehouse(null);
        },
        onError: () => toast.error("Error al actualizar el almacén"),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => warehousesService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["warehouses"] });
            toast.success("Almacén eliminado");
            setDeletingId(null);
        },
        onError: () => toast.error("Error al eliminar el almacén"),
    });

    const handleSubmit = (values: WarehouseFormValues) => {
        if (editingWarehouse) {
            updateMutation.mutate({ id: editingWarehouse.id, payload: values });
        } else {
            createMutation.mutate(values);
        }
    };

    const openCreate = () => {
        setEditingWarehouse(null);
        setDialogOpen(true);
    };

    const openEdit = (warehouse: Warehouse) => {
        setEditingWarehouse(warehouse);
        setDialogOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <WarehouseIcon className="h-8 w-8" />
                        Almacenes
                    </h2>
                    <p className="text-muted-foreground">Gestiona tus almacenes y ubicaciones de stock</p>
                </div>
                <Button onClick={openCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Almacén
                </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                {WAREHOUSE_TYPES.map((type) => {
                    const count = warehouses.filter((w) => w.type === type.value && w.active).length;
                    return (
                        <div key={type.value} className="rounded-xl border bg-card p-4 shadow-sm">
                            <p className="text-sm text-muted-foreground">{type.label}</p>
                            <p className="text-2xl font-bold">{count}</p>
                        </div>
                    );
                })}
            </div>

            {/* Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Dirección</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    Cargando...
                                </TableCell>
                            </TableRow>
                        ) : warehouses.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    No hay almacenes registrados. ¡Crea el primero!
                                </TableCell>
                            </TableRow>
                        ) : (
                            warehouses.map((warehouse) => (
                                <TableRow key={warehouse.id}>
                                    <TableCell className="font-medium">{warehouse.name}</TableCell>
                                    <TableCell>
                                        {warehouse.type ? (
                                            <span
                                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_COLORS[warehouse.type]}`}
                                            >
                                                {WAREHOUSE_TYPES.find((t) => t.value === warehouse.type)?.label}
                                            </span>
                                        ) : (
                                            "—"
                                        )}
                                    </TableCell>
                                    <TableCell>{warehouse.address ?? "—"}</TableCell>
                                    <TableCell>
                                        <Badge variant={warehouse.active ? "default" : "secondary"}>
                                            {warehouse.active ? "Activo" : "Inactivo"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => openEdit(warehouse)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-600"
                                                onClick={() => setDeletingId(warehouse.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Create / Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle>
                            {editingWarehouse ? "Editar Almacén" : "Nuevo Almacén"}
                        </DialogTitle>
                    </DialogHeader>
                    <WarehouseForm
                        defaultValues={
                            editingWarehouse
                                ? {
                                    name: editingWarehouse.name,
                                    type: editingWarehouse.type,
                                    address: editingWarehouse.address ?? "",
                                }
                                : undefined
                        }
                        onSubmit={handleSubmit}
                        isLoading={createMutation.isPending || updateMutation.isPending}
                    />
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar almacén?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción desactivará el almacén. Podrás restaurarlo después.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-500 hover:bg-red-600"
                            onClick={() => deletingId && deleteMutation.mutate(deletingId)}
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
