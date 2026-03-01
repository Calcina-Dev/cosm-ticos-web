"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    brandsService,
    Brand,
    CreateBrandPayload,
} from "@/features/catalogs/brands/brands.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getErrorMessage } from "@/lib/error-utils";

const brandSchema = z.object({
    name: z.string().min(1, "El nombre es requerido"),
    description: z.string().optional(),
});

type BrandFormValues = z.infer<typeof brandSchema>;

function BrandForm({
    defaultValues,
    onSubmit,
    isLoading,
}: {
    defaultValues?: Partial<BrandFormValues>;
    onSubmit: (values: BrandFormValues) => void;
    isLoading: boolean;
}) {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<BrandFormValues>({
        resolver: zodResolver(brandSchema),
        defaultValues,
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input id="name" {...register("name")} placeholder="Ej: L'Oréal" />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                    id="description"
                    {...register("description")}
                    placeholder="Descripción opcional de la marca"
                    rows={3}
                />
            </div>
            <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Guardando..." : "Guardar"}
                </Button>
            </DialogFooter>
        </form>
    );
}

export default function BrandsPage() {
    const queryClient = useQueryClient();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    const { data: brands = [], isLoading } = useQuery({
        queryKey: ["brands"],
        queryFn: brandsService.getAll,
    });

    const filteredBrands = brands.filter((b) =>
        b.name.toLowerCase().includes(search.toLowerCase())
    );

    const createMutation = useMutation({
        mutationFn: (payload: CreateBrandPayload) => brandsService.create(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["brands"] });
            toast.success("Marca creada exitosamente");
            setDialogOpen(false);
        },
        onError: (err: any) => toast.error(getErrorMessage(err, "Error al crear la marca")),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: CreateBrandPayload }) =>
            brandsService.update(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["brands"] });
            toast.success("Marca actualizada");
            setDialogOpen(false);
            setEditingBrand(null);
        },
        onError: (err: any) => toast.error(getErrorMessage(err, "Error al actualizar la marca")),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => brandsService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["brands"] });
            toast.success("Marca eliminada");
            setDeletingId(null);
        },
        onError: (err: any) => toast.error(getErrorMessage(err, "Error al eliminar la marca")),
        throwOnError: false,
    });

    const handleSubmit = (values: BrandFormValues) => {
        if (editingBrand) {
            updateMutation.mutate({ id: editingBrand.id, payload: values });
        } else {
            createMutation.mutate(values);
        }
    };

    const openCreate = () => {
        setEditingBrand(null);
        setDialogOpen(true);
    };

    const openEdit = (brand: Brand) => {
        setEditingBrand(brand);
        setDialogOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Tag className="h-8 w-8" />
                        Marcas
                    </h2>
                    <p className="text-muted-foreground">
                        Gestiona las marcas de tus productos ({brands.length} registradas)
                    </p>
                </div>
                <Button onClick={openCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Marca
                </Button>
            </div>

            {/* Search */}
            <div className="flex items-center gap-4">
                <Input
                    placeholder="Buscar marca..."
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
                            <TableHead>Descripción</TableHead>
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
                        ) : filteredBrands.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                    {search ? "No se encontraron marcas con ese nombre." : "No hay marcas registradas. ¡Crea la primera!"}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredBrands.map((brand) => (
                                <TableRow key={brand.id}>
                                    <TableCell className="font-semibold">{brand.name}</TableCell>
                                    <TableCell className="text-muted-foreground max-w-xs truncate">
                                        {brand.description ?? "—"}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={brand.active ? "default" : "secondary"}>
                                            {brand.active ? "Activa" : "Inactiva"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(brand)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-600"
                                                onClick={() => setDeletingId(brand.id)}
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
                            {editingBrand ? "Editar Marca" : "Nueva Marca"}
                        </DialogTitle>
                    </DialogHeader>
                    <BrandForm
                        defaultValues={
                            editingBrand
                                ? { name: editingBrand.name, description: editingBrand.description ?? "" }
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
                        <AlertDialogTitle>¿Eliminar marca?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción desactivará la marca. Los productos asociados no se verán afectados.
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
