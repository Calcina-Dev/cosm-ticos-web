"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { unitsService } from "@/features/catalogs/units/units.service";
import { Unit, CreateUnitPayload } from "@/features/catalogs/units/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Pencil, Trash2, Ruler } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getErrorMessage } from "@/lib/error-utils";

const unitSchema = z.object({
    name: z.string().min(1, "El nombre es requerido"),
    code: z.string().min(1, "El código es requerido").max(10, "Máximo 10 caracteres"),
});

type UnitFormValues = z.infer<typeof unitSchema>;

function UnitForm({
    defaultValues,
    onSubmit,
    isLoading,
}: {
    defaultValues?: Partial<UnitFormValues>;
    onSubmit: (values: UnitFormValues) => void;
    isLoading: boolean;
}) {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<UnitFormValues>({
        resolver: zodResolver(unitSchema),
        defaultValues,
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input id="name" {...register("name")} placeholder="Ej: Kilogramo" />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
                <Label htmlFor="code">Código *</Label>
                <Input id="code" {...register("code")} placeholder="Ej: KG" className="uppercase" />
                {errors.code && <p className="text-xs text-red-500">{errors.code.message}</p>}
            </div>
            <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Guardando..." : "Guardar"}
                </Button>
            </DialogFooter>
        </form>
    );
}

export default function UnitsPage() {
    const queryClient = useQueryClient();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const { data: units = [], isLoading } = useQuery({
        queryKey: ["units"],
        queryFn: unitsService.getAll,
    });

    const createMutation = useMutation({
        mutationFn: (payload: CreateUnitPayload) => unitsService.create(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["units"] });
            toast.success("Unidad creada exitosamente");
            setDialogOpen(false);
        },
        onError: (err: any) => toast.error(getErrorMessage(err, "Error al crear la unidad")),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: CreateUnitPayload }) =>
            unitsService.update(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["units"] });
            toast.success("Unidad actualizada");
            setDialogOpen(false);
            setEditingUnit(null);
        },
        onError: (err: any) => toast.error(getErrorMessage(err, "Error al actualizar la unidad")),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => unitsService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["units"] });
            toast.success("Unidad eliminada");
            setDeletingId(null);
        },
        onError: (err: any) => toast.error(getErrorMessage(err, "Error al eliminar la unidad")),
        throwOnError: false,
    });

    const handleSubmit = (values: UnitFormValues) => {
        if (editingUnit) {
            updateMutation.mutate({ id: editingUnit.id, payload: values });
        } else {
            createMutation.mutate(values);
        }
    };

    const openCreate = () => {
        setEditingUnit(null);
        setDialogOpen(true);
    };

    const openEdit = (unit: Unit) => {
        setEditingUnit(unit);
        setDialogOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Ruler className="h-8 w-8" />
                        Unidades de Medida
                    </h2>
                    <p className="text-muted-foreground">Gestiona las unidades de medida del catálogo</p>
                </div>
                <Button onClick={openCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Unidad
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Código</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                    Cargando...
                                </TableCell>
                            </TableRow>
                        ) : units.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                    No hay unidades registradas. ¡Crea la primera!
                                </TableCell>
                            </TableRow>
                        ) : (
                            units.map((unit) => (
                                <TableRow key={unit.id}>
                                    <TableCell className="font-medium">{unit.name}</TableCell>
                                    <TableCell>
                                        <span className="font-mono text-sm bg-muted px-2 py-0.5 rounded">
                                            {unit.code}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={unit.active ? "default" : "secondary"}>
                                            {unit.active ? "Activo" : "Inactivo"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(unit)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-600"
                                                onClick={() => setDeletingId(unit.id)}
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
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>
                            {editingUnit ? "Editar Unidad" : "Nueva Unidad"}
                        </DialogTitle>
                    </DialogHeader>
                    <UnitForm
                        defaultValues={
                            editingUnit
                                ? { name: editingUnit.name, code: editingUnit.code }
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
                        <AlertDialogTitle>¿Eliminar unidad?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Los productos que usen esta unidad podrían verse afectados.
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
