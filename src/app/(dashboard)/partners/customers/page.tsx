"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customersService } from "@/features/partners/partners.service";
import { Customer, CreateCustomerPayload } from "@/features/partners/types";
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
import { Plus, Pencil, Trash2, Search, Users } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams } from "next/navigation";

const customerSchema = z.object({
    name: z.string().min(1, "El nombre es requerido"),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
    phone: z.string().optional(),
    identityDoc: z.string().optional(),
    address: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

function CustomerForm({
    defaultValues,
    onSubmit,
    isLoading,
}: {
    defaultValues?: Partial<CustomerFormValues>;
    onSubmit: (values: CustomerFormValues) => void;
    isLoading: boolean;
}) {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<CustomerFormValues>({
        resolver: zodResolver(customerSchema),
        defaultValues,
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input id="name" {...register("name")} placeholder="Nombre completo o razón social" />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" {...register("email")} placeholder="correo@ejemplo.com" />
                    {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input id="phone" {...register("phone")} placeholder="+51 999 999 999" />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="identityDoc">DNI / RUC</Label>
                <Input id="identityDoc" {...register("identityDoc")} placeholder="Documento de identidad" />
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

export default function CustomersPage() {
    const queryClient = useQueryClient();
    const searchParams = useSearchParams();
    const [search, setSearch] = useState(searchParams.get("search") || "");

    useEffect(() => {
        const urlSearch = searchParams.get("search");
        if (urlSearch !== null) setSearch(urlSearch);
    }, [searchParams]);
    const [page] = useState(1);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ["customers", page, search],
        queryFn: () => customersService.getAll({ page, limit: 20, search }),
    });

    const createMutation = useMutation({
        mutationFn: (payload: CreateCustomerPayload) => customersService.create(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["customers"] });
            toast.success("Cliente creado exitosamente");
            setDialogOpen(false);
        },
        onError: () => toast.error("Error al crear el cliente"),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: CreateCustomerPayload }) =>
            customersService.update(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["customers"] });
            toast.success("Cliente actualizado exitosamente");
            setDialogOpen(false);
            setEditingCustomer(null);
        },
        onError: () => toast.error("Error al actualizar el cliente"),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => customersService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["customers"] });
            toast.success("Cliente eliminado");
            setDeletingId(null);
        },
        onError: () => toast.error("Error al eliminar el cliente"),
    });

    const handleSubmit = (values: CustomerFormValues) => {
        const payload: CreateCustomerPayload = {
            ...values,
            email: values.email || undefined,
        };
        if (editingCustomer) {
            updateMutation.mutate({ id: editingCustomer.id, payload });
        } else {
            createMutation.mutate(payload);
        }
    };

    const openCreate = () => {
        setEditingCustomer(null);
        setDialogOpen(true);
    };

    const openEdit = (customer: Customer) => {
        setEditingCustomer(customer);
        setDialogOpen(true);
    };

    const customers = data?.items ?? [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Users className="h-8 w-8" />
                        Clientes
                    </h2>
                    <p className="text-muted-foreground">Gestiona tu cartera de clientes</p>
                </div>
                <Button onClick={openCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Cliente
                </Button>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar clientes..."
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
                            <TableHead>DNI / RUC</TableHead>
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
                        ) : customers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No hay clientes registrados. ¡Crea el primero!
                                </TableCell>
                            </TableRow>
                        ) : (
                            customers.map((customer) => (
                                <TableRow key={customer.id}>
                                    <TableCell className="font-medium">{customer.name}</TableCell>
                                    <TableCell>{customer.identityDoc ?? "—"}</TableCell>
                                    <TableCell>{customer.email ?? "—"}</TableCell>
                                    <TableCell>{customer.phone ?? "—"}</TableCell>
                                    <TableCell>
                                        <Badge variant={customer.active ? "default" : "secondary"}>
                                            {customer.active ? "Activo" : "Inactivo"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => openEdit(customer)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-600"
                                                onClick={() => setDeletingId(customer.id)}
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
                            {editingCustomer ? "Editar Cliente" : "Nuevo Cliente"}
                        </DialogTitle>
                    </DialogHeader>
                    <CustomerForm
                        defaultValues={
                            editingCustomer
                                ? {
                                    name: editingCustomer.name,
                                    email: editingCustomer.email ?? "",
                                    phone: editingCustomer.phone ?? "",
                                    identityDoc: editingCustomer.identityDoc ?? "",
                                    address: editingCustomer.address ?? "",
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
                        <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción desactivará al cliente. Podrás restaurarlo después.
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
