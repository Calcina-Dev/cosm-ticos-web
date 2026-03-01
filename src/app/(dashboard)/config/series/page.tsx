"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Plus, Trash2, Hash } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

import {
    DocumentSeries,
    DocumentType,
    documentSeriesService,
} from "@/features/config/services/document-series.service";
import { Branch, cashRegistersService } from "@/features/cash/services/cash-registers.service";

const formSchema = z.object({
    type: z.nativeEnum(DocumentType),
    series: z.string().min(1, "La serie es obligatoria").max(4, "Máximo 4 caracteres").regex(/^[A-Z0-9]+$/, "Solo letras mayúsculas y números"),
    initialNumber: z.coerce.number().min(0, "No puede ser negativo").optional(),
    branchId: z.string().optional(),
});

export default function SeriesPage() {
    const [loading, setLoading] = useState(true);
    const [seriesList, setSeriesList] = useState<DocumentSeries[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            series: "",
            initialNumber: 0,
        },
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [seriesData, branchesData] = await Promise.all([
                documentSeriesService.getAll().catch(() => []),
                cashRegistersService.getBranches().catch(() => []),
            ]);
            setSeriesList(seriesData || []);
            setBranches(branchesData || []);
        } catch (error) {
            console.error("Error fetching series:", error);
            toast.error("Error al cargar las series");
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
            await documentSeriesService.create({
                type: values.type,
                series: values.series,
                initialNumber: values.initialNumber,
                branchId: values.branchId || undefined,
            });
            toast.success("Serie creada correctamente");
            setOpenDialog(false);
            form.reset();
            fetchData();
        } catch (error: any) {
            console.error("Error creating series:", error);
            toast.error(error.response?.data?.message || "Error al crear la serie");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await documentSeriesService.delete(id);
            toast.success("Serie eliminada");
            fetchData();
        } catch (error) {
            console.error("Error deleting series:", error);
            toast.error("Error al eliminar la serie");
        }
    };

    const getBranchName = (id?: string) => {
        if (!id) return "Global";
        return branches.find(b => b.id === id)?.name || "Desconocida";
    };

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Configuración de Series</h2>
                    <p className="text-muted-foreground">
                        Administra los correlativos para tus comprobantes de pago y documentos.
                    </p>
                </div>
                <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Nueva Serie
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Nueva Serie de Documentos</DialogTitle>
                            <DialogDescription>
                                Configura la serie y numeración inicial para un tipo de comprobante.
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tipo de Documento</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecciona el tipo" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value={DocumentType.NOTA_VENTA}>Nota de Venta</SelectItem>
                                                    <SelectItem value={DocumentType.BOLETA}>Boleta de Venta</SelectItem>
                                                    <SelectItem value={DocumentType.FACTURA}>Factura Electrónica</SelectItem>
                                                    <SelectItem value={DocumentType.GUIA_REMISION}>Guía de Remisión</SelectItem>
                                                    <SelectItem value={DocumentType.NOTA_DEBITO}>Nota de Débito</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="branchId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Sucursal (Opcional)</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Todas las sucursales" />
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
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="series"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Serie</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Hash className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                                        <Input className="pl-8 uppercase" placeholder="F001" maxLength={4} {...field} />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="initialNumber"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Número Inicial</FormLabel>
                                                <FormControl>
                                                    <Input type="number" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
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

            <Card>
                <CardHeader>
                    <CardTitle>Listado de Series</CardTitle>
                    <CardDescription>
                        Series activas configuradas en el sistema.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-6">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Serie</TableHead>
                                    <TableHead>Correlativo Actual</TableHead>
                                    <TableHead>Sucursal</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {seriesList.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-muted-foreground h-24">
                                            No hay series configuradas.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    seriesList.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.type}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{item.series}</Badge>
                                            </TableCell>
                                            <TableCell>{item.currentNumber}</TableCell>
                                            <TableCell>{getBranchName(item.branchId)}</TableCell>
                                            <TableCell>
                                                <Badge variant={item.isActive ? "default" : "secondary"}>
                                                    {item.isActive ? "Activo" : "Inactivo"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Esta acción desactivará la serie <b>{item.series}</b>.
                                                                No se podrá usar para nuevos comprobantes.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDelete(item.id)} className="bg-destructive hover:bg-destructive/90">
                                                                Eliminar
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
