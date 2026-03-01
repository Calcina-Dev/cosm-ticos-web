"use client"

import { useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2 } from "lucide-react"
import { format } from "date-fns"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

import { Purchase } from "../types"
import { purchaseInvoicesService } from "../purchase-invoices.service"
import { getErrorMessage } from "@/lib/error-utils"
import { formatCurrency } from "@/lib/utils"

const invoiceSchema = z.object({
    documentType: z.string().optional(),
    supplierDocumentNumber: z.string().min(1, "El número de comprobante es requerido"),
    issueDate: z.string().min(1, "La fecha es requerida"),
    paymentMethodId: z.string().optional(), // Si lo deja vacío es Crédito
    lines: z.array(z.object({
        variantId: z.string(),
        productName: z.string(),
        sku: z.string(),
        ordered: z.number(),
        alreadyReceived: z.number(),
        quantityToReceive: z.number().min(0, "Debe ser >= 0"),
        unitCost: z.number().min(0, "Costo debe ser >= 0"),
    }))
}).refine(data => data.lines.some(l => l.quantityToReceive > 0), {
    message: "Debe recibir al menos 1 producto.",
    path: ["lines"]
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>

interface PurchaseInvoiceModalProps {
    purchase: Purchase;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function PurchaseInvoiceModal({ purchase, isOpen, onClose, onSuccess }: PurchaseInvoiceModalProps) {
    const [loading, setLoading] = useState(false)

    // Compute what has been received so far
    const receivedMap = new Map<string, number>();
    if (purchase.invoices) {
        for (const invoice of purchase.invoices) {
            for (const line of invoice.lines || []) {
                receivedMap.set(line.variantId, (receivedMap.get(line.variantId) || 0) + line.quantity);
            }
        }
    }

    const defaultLines = purchase.lines?.map(line => {
        const alreadyReceived = receivedMap.get(line.variantId) || 0;
        const pending = Math.max(0, line.quantity - alreadyReceived);
        return {
            variantId: line.variantId,
            productName: line.variant?.product?.name || '',
            sku: line.variant?.sku || '',
            ordered: line.quantity,
            alreadyReceived,
            quantityToReceive: pending, // By default suggest receiving the rest
            unitCost: Number(line.unitCost), // Default to original order cost
        };
    }) || [];

    const form = useForm<InvoiceFormValues>({
        resolver: zodResolver(invoiceSchema),
        defaultValues: {
            documentType: "FACTURA",
            supplierDocumentNumber: "",
            issueDate: format(new Date(), "yyyy-MM-dd"),
            paymentMethodId: "CREDITO", // Use "CREDITO" instead of empty string
            lines: defaultLines,
        },
    })

    const { fields } = useFieldArray({
        control: form.control,
        name: "lines",
    })

    const lines = form.watch("lines");
    const totalToReceive = lines.reduce((acc, line) => acc + (line.quantityToReceive * line.unitCost), 0);

    const onSubmit = async (data: InvoiceFormValues) => {
        try {
            setLoading(true)

            // Filter lines with qty > 0
            const validLines = data.lines
                .filter(l => l.quantityToReceive > 0)
                .map(l => ({
                    variantId: l.variantId,
                    quantity: l.quantityToReceive,
                    unitCost: l.unitCost
                }));

            await purchaseInvoicesService.create({
                purchaseId: purchase.id,
                documentType: data.documentType,
                supplierDocumentNumber: data.supplierDocumentNumber,
                issueDate: data.issueDate,
                paymentMethodId: data.paymentMethodId === "CREDITO" ? undefined : data.paymentMethodId,
                lines: validLines
            })

            toast.success("Recepción y factura registrada correctamente")
            form.reset()
            onSuccess()
            onClose()
        } catch (error) {
            toast.error(getErrorMessage(error, "Error al registrar la recepción"))
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={isOpen ? onClose : undefined}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Registrar Recepción y Comprobante</DialogTitle>
                    <DialogDescription>
                        Ingrese los datos del comprobante del proveedor y las cantidades reales recibidas.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="documentType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tipo de Documento</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="FACTURA">Factura</SelectItem>
                                                <SelectItem value="BOLETA">Boleta</SelectItem>
                                                <SelectItem value="GUIA_REMISION">Guía de Remisión</SelectItem>
                                                <SelectItem value="RECIBO">Recibo Interno</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="supplierDocumentNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Número de Comprobante</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ej. F001-123456" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="issueDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Fecha de Emisión</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="paymentMethodId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Forma de Pago</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Al Crédito (Cuentas por Pagar)" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="CREDITO">Al Crédito (Generar Deuda)</SelectItem>
                                                {/* Aquí deberíamos iterar por payment methods reales de prop o context */}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                        <p className="text-xs text-muted-foreground">Dejar al crédito generará una cuenta por pagar al proveedor.</p>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="border rounded-md mt-4">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Producto</TableHead>
                                        <TableHead className="text-right">Pedido</TableHead>
                                        <TableHead className="text-right">Recibido</TableHead>
                                        <TableHead className="text-right w-32">Cant. Entrada</TableHead>
                                        <TableHead className="text-right w-32">Costo U.</TableHead>
                                        <TableHead className="text-right">Subtotal</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {fields.map((field, index) => {
                                        const qtyValue = form.watch(`lines.${index}.quantityToReceive`) || 0;
                                        const costValue = form.watch(`lines.${index}.unitCost`) || 0;
                                        const subtotal = qtyValue * costValue;

                                        return (
                                            <TableRow key={field.id}>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-sm">{field.productName}</span>
                                                        <span className="text-xs text-muted-foreground">{field.sku}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">{field.ordered}</TableCell>
                                                <TableCell className="text-right text-muted-foreground">{field.alreadyReceived}</TableCell>
                                                <TableCell>
                                                    <FormField
                                                        control={form.control}
                                                        name={`lines.${index}.quantityToReceive`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <Input type="number" min="0" className="w-24 ml-auto text-right" {...field} onChange={e => field.onChange(e.target.valueAsNumber || 0)} />
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <FormField
                                                        control={form.control}
                                                        name={`lines.${index}.unitCost`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <Input type="number" min="0" step="0.01" className="w-24 ml-auto text-right" {...field} onChange={e => field.onChange(e.target.valueAsNumber || 0)} />
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    />
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {formatCurrency(subtotal)}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                        {form.formState.errors.lines && (
                            <p className="text-red-500 text-sm mt-1">{form.formState.errors.lines?.root?.message || form.formState.errors.lines.message}</p>
                        )}
                        <div className="flex justify-end pt-4 border-t">
                            <div className="text-lg font-bold">Total Factura: {formatCurrency(totalToReceive)}</div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={loading || totalToReceive === 0}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Procesar Recepción
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
