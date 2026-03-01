"use client"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { formatCurrency } from "@/lib/utils"
import { PurchaseInvoice } from "../types"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface PurchaseInvoiceDetailModalProps {
    invoice: PurchaseInvoice | null
    isOpen: boolean
    onClose: () => void
}

export function PurchaseInvoiceDetailModal({
    invoice,
    isOpen,
    onClose,
}: PurchaseInvoiceDetailModalProps) {
    if (!invoice) return null

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="flex justify-between items-center pr-8">
                        <div className="flex flex-col gap-1">
                            <span>Detalle de Comprobante: {invoice.supplierDocumentNumber}</span>
                            <span className="text-sm font-normal text-muted-foreground uppercase">{invoice.documentType}</span>
                        </div>
                        <div className="text-right flex flex-col gap-1">
                            <span className="text-sm font-normal">Fecha: {format(new Date(invoice.createdAt), "dd MMM yyyy HH:mm", { locale: es })}</span>
                            <span className="text-lg font-bold text-primary">{formatCurrency(Number(invoice.totalAmount))}</span>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <div className="mt-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Producto / SKU</TableHead>
                                <TableHead className="text-right">Cantidad</TableHead>
                                <TableHead className="text-right">Costo Unit.</TableHead>
                                <TableHead className="text-right">Subtotal</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoice.lines?.map((line) => (
                                <TableRow key={line.id}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{line.variant?.product.name}</span>
                                            <span className="text-xs text-muted-foreground font-mono">{line.variant?.sku}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        {line.quantity}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(Number(line.unitCost))}
                                    </TableCell>
                                    <TableCell className="text-right font-bold">
                                        {formatCurrency(Number(line.subtotal))}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </DialogContent>
        </Dialog>
    )
}
