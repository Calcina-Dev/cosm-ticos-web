"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    paymentMethodsService,
    PaymentMethod
} from "@/features/catalogs/payment-methods.service";
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
import { Plus, Pencil, Trash2, CreditCard } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getErrorMessage } from "@/lib/error-utils";

const methodSchema = z.object({
    name: z.string().min(1, "El nombre es requerido"),
    code: z.string().min(1, "El código es requerido"),
    isActive: z.boolean(),
});

type MethodFormValues = z.infer<typeof methodSchema>;

function MethodForm({
    defaultValues,
    onSubmit,
    isLoading,
}: {
    defaultValues?: Partial<MethodFormValues>;
    onSubmit: (values: MethodFormValues) => void;
    isLoading: boolean;
}) {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<MethodFormValues>({
        resolver: zodResolver(methodSchema),
        defaultValues: {
            name: defaultValues?.name || "",
            code: defaultValues?.code || "",
            isActive: defaultValues?.isActive ?? true,
        },
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input id="name" {...register("name")} placeholder="Ej: Yape" />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
                <Label htmlFor="code">Código *</Label>
                <Input id="code" {...register("code")} placeholder="Ej: YAPE" />
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

export default function PaymentMethodsPage() {
    const queryClient = useQueryClient();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    const { data: methods = [], isLoading } = useQuery({
        queryKey: ["payment-methods"],
        queryFn: paymentMethodsService.findAll,
    });

    const filteredMethods = methods.filter((m) =>
        m.name.toLowerCase().includes(search.toLowerCase())
    );

    const createMutation = useMutation({
        mutationFn: (payload: any) => paymentMethodsService.create(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
            toast.success("Método creado exitosamente");
            setDialogOpen(false);
        },
        onError: (err: any) => toast.error(getErrorMessage(err, "Error al crear el método")),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: any }) =>
            paymentMethodsService.update(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
            toast.success("Método actualizado");
            setDialogOpen(false);
            setEditingMethod(null);
        },
        onError: (err: any) => toast.error(getErrorMessage(err, "Error al actualizar el método")),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => paymentMethodsService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
            toast.success("Método eliminado");
            setDeletingId(null);
        },
        onError: (err: any) => toast.error(getErrorMessage(err, "Error al eliminar el método")),
    });

    const handleSubmit = (values: MethodFormValues) => {
        if (editingMethod) {
            updateMutation.mutate({ id: editingMethod.id, payload: values });
        } else {
            createMutation.mutate(values);
        }
    };

    const openCreate = () => {
        setEditingMethod(null);
        setDialogOpen(true);
    };

    const openEdit = (method: PaymentMethod) => {
        setEditingMethod(method);
        setDialogOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <CreditCard className="h-8 w-8" />
                        Métodos de Pago
                    </h2>
                    <p className="text-muted-foreground">
                        Gestiona los métodos de pago disponibles ({methods.length} registrados)
                    </p>
                </div>
                <Button onClick={openCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Método
                </Button>
            </div>

            {/* Search */}
            <div className="flex items-center gap-4">
                <Input
                    placeholder="Buscar método..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                />
            </div>

            {/* Table */}
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
                        ) : filteredMethods.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                    {search ? "No se encontraron métodos." : "No hay métodos registrados."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredMethods.map((method) => (
                                <TableRow key={method.id}>
                                    <TableCell className="font-semibold">{method.name}</TableCell>
                                    <TableCell className="text-muted-foreground font-mono text-xs">
                                        {method.code}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={method.isActive ? "default" : "secondary"}>
                                            {method.isActive ? "Activo" : "Inactivo"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(method)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-600"
                                                onClick={() => setDeletingId(method.id)}
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
                            {editingMethod ? "Editar Método" : "Nuevo Método"}
                        </DialogTitle>
                    </DialogHeader>
                    <MethodForm
                        defaultValues={
                            editingMethod
                                ? { name: editingMethod.name, code: editingMethod.code, isActive: editingMethod.isActive }
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
                        <AlertDialogTitle>¿Eliminar método?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción desactivará el método de pago.
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
