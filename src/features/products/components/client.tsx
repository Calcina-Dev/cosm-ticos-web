"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsService } from "../products.service";
import { Product } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
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
import { Plus, Pencil, Trash2, Package } from "lucide-react";
import { ProductForm } from "./product-form";
import { getErrorMessage } from "@/lib/error-utils";
import { useSearchParams } from "next/navigation";

export default function ProductsClient() {
    const queryClient = useQueryClient();
    const searchParams = useSearchParams();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [search, setSearch] = useState(searchParams.get("search") || "");

    useEffect(() => {
        const urlSearch = searchParams.get("search");
        if (urlSearch !== null) setSearch(urlSearch);
    }, [searchParams]);

    const { data, isLoading } = useQuery({
        queryKey: ["products"],
        queryFn: () => productsService.findAll({ limit: 100 }), // Fetch more for client-side filtering or implement server-side
    });

    const products = data?.items ?? [];

    const filteredProducts = products.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.brand ?? "").toLowerCase().includes(search.toLowerCase())
    );

    const deleteMutation = useMutation({
        mutationFn: (id: string) => productsService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
            toast.success("Producto eliminado");
            setDeletingId(null);
        },
        onError: (err: any) => toast.error(getErrorMessage(err, "Error al eliminar el producto")),
        throwOnError: false,
    });

    const openCreate = () => {
        setEditingProduct(null);
        setDialogOpen(true);
    };

    const openEdit = (product: Product) => {
        setEditingProduct(product);
        setDialogOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Package className="h-8 w-8" />
                        Productos
                    </h2>
                    <p className="text-muted-foreground">
                        Gestiona el catálogo de productos ({products.length} registrados)
                    </p>
                </div>
                <Button onClick={openCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Producto
                </Button>
            </div>

            {/* Search */}
            <div className="flex items-center gap-4">
                <Input
                    placeholder="Buscar por nombre o marca..."
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
                            <TableHead>Marca</TableHead>
                            <TableHead>Categoría</TableHead>
                            <TableHead>Variantes / SKU</TableHead>
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
                        ) : filteredProducts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    {search ? "No se encontraron productos." : "No hay productos registrados. ¡Crea el primero!"}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredProducts.map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell className="font-semibold">{product.name}</TableCell>
                                    <TableCell className="text-muted-foreground">{product.brandRel?.name ?? product.brand ?? "—"}</TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {product.category?.name ?? "—"}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {(product.variants ?? []).map((v) => (
                                                <Badge key={v.id} variant="outline" className="text-xs">
                                                    {v.sku} · S/{Number(v.price).toFixed(2)}
                                                </Badge>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(product)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-600"
                                                onClick={() => setDeletingId(product.id)}
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
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingProduct ? "Editar Producto" : "Nuevo Producto"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingProduct
                                ? "Modifica los datos del producto."
                                : "Completa la información del producto y sus variantes."}
                        </DialogDescription>
                    </DialogHeader>
                    <ProductForm
                        initialData={editingProduct}
                        onSuccess={() => {
                            queryClient.invalidateQueries({ queryKey: ["products"] });
                            setDialogOpen(false);
                            setEditingProduct(null);
                        }}
                    />
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Se eliminarán también todas sus variantes (soft delete). No se puede eliminar si alguna variante tiene stock positivo.
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
