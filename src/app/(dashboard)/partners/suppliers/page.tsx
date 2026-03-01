"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { suppliersService } from "@/features/partners/partners.service";
import { Supplier, CreateSupplierPayload } from "@/features/partners/types";
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
import { Plus, Pencil, Trash2, Search, Truck } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const supplierSchema = z.object({
    name: z.string().min(1, "El nombre es requerido"),
    ruc: z.string().optional(),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
    phone: z.string().optional(),
    address: z.string().optional(),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

function SupplierForm({
    defaultValues,
    onSubmit,
    isLoading,
}: {
    defaultValues?: Partial<SupplierFormValues>;
    onSubmit: (values: SupplierFormValues) => void;
    isLoading: boolean;
}) {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<SupplierFormValues>({
        resolver: zodResolver(supplierSchema),
        defaultValues,
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Nombre / Razón Social *</Label>
                <Input id="name" {...register("name")} placeholder="Nombre del proveedor" />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="ruc">RUC</Label>
                    <Input id="ruc" {...register("ruc")} placeholder="20100000001" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input id="phone" {...register("phone")} placeholder="+51 999 999 999" />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register("email")} placeholder="proveedor@empresa.com" />
                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input id="address" {...register("address")} placeholder="Dirección completa" />
            </div>
            <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Guardando..." : "Guardar"}
                </Button>
            </DialogFooter>
        </form>
    );
}

export default function SuppliersPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [page] = useState(1);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ["suppliers", page, search],
        queryFn: () => suppliersService.getAll({ page, limit: 20, search }),
    });

    const createMutation = useMutation({
        mutationFn: (payload: CreateSupplierPayload) => suppliersService.create(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["suppliers"] });
            toast.success("Proveedor creado exitosamente");
            setDialogOpen(false);
        },
        onError: () => toast.error("Error al crear el proveedor"),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: CreateSupplierPayload }) =>
            suppliersService.update(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["suppliers"] });
            toast.success("Proveedor actualizado exitosamente");
            setDialogOpen(false);
            setEditingSupplier(null);
        },
        onError: () => toast.error("Error al actualizar el proveedor"),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => suppliersService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["suppliers"] });
            toast.success("Proveedor eliminado");
            setDeletingId(null);
        },
        onError: () => toast.error("Error al eliminar el proveedor"),
    });

    const handleSubmit = (values: SupplierFormValues) => {
        const payload: CreateSupplierPayload = {
            ...values,
            email: values.email || undefined,
        };
        if (editingSupplier) {
            updateMutation.mutate({ id: editingSupplier.id, payload });
        } else {
            createMutation.mutate(payload);
        }
    };

    const openCreate = () => {
        setEditingSupplier(null);
        setDialogOpen(true);
    };

    const openEdit = (supplier: Supplier) => {
        setEditingSupplier(supplier);
        setDialogOpen(true);
    };

    const suppliers = data?.items ?? [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Truck className="h-8 w-8" />
                        Proveedores
                    </h2>
                    <p className="text-muted-foreground">Gestiona tus proveedores y contactos</p>
                </div>
                <Button onClick={openCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Proveedor
                </Button>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar proveedores..."
                    className="pl-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>RUC</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Teléfono</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    Cargando...
                                </TableCell>
                            </TableRow>
                        ) : suppliers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No hay proveedores registrados. ¡Crea el primero!
                                </TableCell>
                            </TableRow>
                        ) : (
                            suppliers.map((supplier) => (
                                <TableRow key={supplier.id}>
                                    <TableCell className="font-medium">{supplier.name}</TableCell>
                                    <TableCell>{supplier.ruc ?? "—"}</TableCell>
                                    <TableCell>{supplier.email ?? "—"}</TableCell>
                                    <TableCell>{supplier.phone ?? "—"}</TableCell>
                                    <TableCell>
                                        <Badge variant={supplier.active ? "default" : "secondary"}>
                                            {supplier.active ? "Activo" : "Inactivo"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => openEdit(supplier)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-600"
                                                onClick={() => setDeletingId(supplier.id)}
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
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>
                            {editingSupplier ? "Editar Proveedor" : "Nuevo Proveedor"}
                        </DialogTitle>
                    </DialogHeader>
                    <SupplierForm
                        defaultValues={
                            editingSupplier
                                ? {
                                    name: editingSupplier.name,
                                    ruc: editingSupplier.ruc ?? "",
                                    email: editingSupplier.email ?? "",
                                    phone: editingSupplier.phone ?? "",
                                    address: editingSupplier.address ?? "",
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
                        <AlertDialogTitle>¿Eliminar proveedor?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción desactivará al proveedor. Podrás restaurarlo después.
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
