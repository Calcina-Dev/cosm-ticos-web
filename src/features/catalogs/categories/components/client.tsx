"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { categoriesService } from "../categories.service";
import { Category } from "../types";
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
import { Plus, Pencil, Trash2, FolderTree } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getErrorMessage } from "@/lib/error-utils";

const categorySchema = z.object({
    name: z.string().min(1, "El nombre es requerido"),
    parentId: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

function CategoryForm({
    defaultValues,
    onSubmit,
    isLoading,
    categories,
    editingId,
}: {
    defaultValues?: Partial<CategoryFormValues>;
    onSubmit: (values: CategoryFormValues) => void;
    isLoading: boolean;
    categories: Category[];
    editingId?: string;
}) {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<CategoryFormValues>({
        resolver: zodResolver(categorySchema),
        defaultValues,
    });

    // Filter out the category being edited and its children to avoid circular refs
    const parentOptions = categories.filter((c) => c.id !== editingId);

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input id="name" {...register("name")} placeholder="Ej: Cuidado de Piel" />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
                <Label htmlFor="parentId">Categoría Padre (opcional)</Label>
                <select
                    id="parentId"
                    {...register("parentId")}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                    <option value="">— Sin categoría padre —</option>
                    {parentOptions.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.name}
                        </option>
                    ))}
                </select>
            </div>
            <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Guardando..." : "Guardar"}
                </Button>
            </DialogFooter>
        </form>
    );
}

export default function CategoryClient() {
    const queryClient = useQueryClient();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    const { data: categories = [], isLoading } = useQuery({
        queryKey: ["categories"],
        queryFn: categoriesService.getAll,
    });

    const filteredCategories = categories.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    const createMutation = useMutation({
        mutationFn: (payload: CategoryFormValues) =>
            categoriesService.create({ name: payload.name, parentId: payload.parentId || undefined }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] });
            toast.success("Categoría creada exitosamente");
            setDialogOpen(false);
        },
        onError: (err: any) => toast.error(getErrorMessage(err, "Error al crear la categoría")),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: CategoryFormValues }) =>
            categoriesService.update(id, { name: payload.name, parentId: payload.parentId || undefined }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] });
            toast.success("Categoría actualizada");
            setDialogOpen(false);
            setEditingCategory(null);
        },
        onError: (err: any) => toast.error(getErrorMessage(err, "Error al actualizar la categoría")),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => categoriesService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] });
            toast.success("Categoría eliminada");
            setDeletingId(null);
        },
        onError: (err: any) => {
            toast.error(getErrorMessage(err, "Error al eliminar la categoría"));
        },
        throwOnError: false,
        networkMode: 'always',
    });

    const handleSubmit = (values: CategoryFormValues) => {
        if (editingCategory) {
            updateMutation.mutate({ id: editingCategory.id, payload: values });
        } else {
            createMutation.mutate(values);
        }
    };

    const openCreate = () => {
        setEditingCategory(null);
        setDialogOpen(true);
    };

    const openEdit = (category: Category) => {
        setEditingCategory(category);
        setDialogOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <FolderTree className="h-8 w-8" />
                        Categorías
                    </h2>
                    <p className="text-muted-foreground">
                        Gestiona las categorías de productos ({categories.length} registradas)
                    </p>
                </div>
                <Button onClick={openCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Categoría
                </Button>
            </div>

            {/* Search */}
            <div className="flex items-center gap-4">
                <Input
                    placeholder="Buscar categoría..."
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
                            <TableHead>Categoría Padre</TableHead>
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
                        ) : filteredCategories.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                    {search ? "No se encontraron categorías." : "No hay categorías registradas. ¡Crea la primera!"}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredCategories.map((category) => (
                                <TableRow key={category.id}>
                                    <TableCell className="font-semibold">{category.name}</TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {(category as any).parent?.name ?? "—"}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={category.active ? "default" : "secondary"}>
                                            {category.active ? "Activa" : "Inactiva"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(category)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-600"
                                                onClick={() => setDeletingId(category.id)}
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
                            {editingCategory ? "Editar Categoría" : "Nueva Categoría"}
                        </DialogTitle>
                    </DialogHeader>
                    <CategoryForm
                        defaultValues={
                            editingCategory
                                ? {
                                    name: editingCategory.name,
                                    parentId: (editingCategory as any).parentId ?? "",
                                }
                                : undefined
                        }
                        onSubmit={handleSubmit}
                        isLoading={createMutation.isPending || updateMutation.isPending}
                        categories={categories}
                        editingId={editingCategory?.id}
                    />
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
                        <AlertDialogDescription>
                            No se puede eliminar si tiene subcategorías o productos asignados.
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
