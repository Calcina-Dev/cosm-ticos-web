"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Plus, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Branch,
    CashRegister,
    cashRegistersService,
} from "@/features/cash/services/cash-registers.service";

const formSchema = z.object({
    name: z.string().min(1, "El nombre es obligatorio"),
    branchId: z.string().min(1, "La sucursal es obligatoria"),
    active: z.boolean().optional(),
});

export default function RegistersPage() {
    const [loading, setLoading] = useState(true);
    const [registers, setRegisters] = useState<CashRegister[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingRegister, setEditingRegister] = useState<CashRegister | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            name: "",
            branchId: "",
            active: true,
        },
        mode: "onChange",
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [registersData, branchesData] = await Promise.all([
                cashRegistersService.getAll(),
                cashRegistersService.getBranches(),
            ]);
            setRegisters(registersData);
            setBranches(branchesData);
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Error al cargar datos");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setActionLoading(true);
        try {
            if (editingRegister) {
                await cashRegistersService.update(editingRegister.id, {
                    name: values.name,
                    active: values.active,
                });
                toast.success("Caja actualizada");
            } else {
                // Create: exclude active, include branchId
                await cashRegistersService.create({
                    name: values.name,
                    branchId: values.branchId,
                });
                toast.success("Caja creada");
            }
            setIsDialogOpen(false);
            fetchData();
            form.reset();
            setEditingRegister(null);
        } catch (error) {
            console.error("Error saving register:", error);
            toast.error("Error al guardar caja");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar esta caja?")) return;

        try {
            await cashRegistersService.delete(id);
            toast.success("Caja eliminada");
            fetchData();
        } catch (error) {
            console.error("Error deleting register:", error);
            toast.error("Error al eliminar caja");
        }
    };

    const openCreateDialog = () => {
        setEditingRegister(null);
        // If there is only one branch, auto-select it
        const defaultBranchId = branches.length === 1 ? branches[0].id : "";
        form.reset({ name: "", branchId: defaultBranchId, active: true });
        setIsDialogOpen(true);
    };

    const openEditDialog = (register: CashRegister) => {
        setEditingRegister(register);
        form.reset({
            name: register.name,
            branchId: register.branchId || "",
            active: register.active
        });
        setIsDialogOpen(true);
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div className="flex items-center gap-2">
                    <Link href="/pos/cash">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <h2 className="text-3xl font-bold tracking-tight">Cajas Registradoras</h2>
                </div>
                <Button onClick={openCreateDialog}>
                    <Plus className="mr-2 h-4 w-4" /> Nueva Caja
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Listado de Cajas</CardTitle>
                    <CardDescription>
                        Administra las cajas físicas o puntos de venta de tu negocio.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Sucursal</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {registers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24">
                                        No hay cajas registradas. Crea una para comenzar.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                registers.map((register) => (
                                    <TableRow key={register.id}>
                                        <TableCell className="font-medium">{register.name}</TableCell>
                                        <TableCell>{register.branch?.name || "Sin Sucursal"}</TableCell>
                                        <TableCell>
                                            {register.active ? (
                                                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-green-500 text-white shadow hover:bg-green-600">
                                                    Activa
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-gray-500 text-white shadow hover:bg-gray-600">
                                                    Inactiva
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => openEditDialog(register)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => handleDelete(register.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingRegister ? "Editar Caja" : "Nueva Caja"}</DialogTitle>
                        <DialogDescription>
                            {editingRegister
                                ? "Modifica los datos de la caja registradora."
                                : "Ingresa los datos para la nueva caja."}
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nombre</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ej. Caja Principal, Caja 2..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="branchId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Sucursal</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            value={field.value}
                                            disabled={!!editingRegister} // Disable branch selection on edit if backend doesn't support moving registers
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecciona una sucursal" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {branches.map((branch) => (
                                                    <SelectItem key={branch.id} value={branch.id}>
                                                        {branch.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {editingRegister && (
                                <FormField
                                    control={form.control}
                                    name="active"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base">Activa</FormLabel>
                                                <CardDescription>
                                                    Habilitar o deshabilitar esta caja.
                                                </CardDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            )}

                            <DialogFooter>
                                <Button type="submit" disabled={actionLoading}>
                                    {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Guardar
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
