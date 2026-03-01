"use client"

import { useEffect, useState } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Eye, CreditCard } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { formatCurrency } from "@/lib/utils"
import { purchaseInvoicesService } from "../purchase-invoices.service"
import { PurchaseInvoice, InvoiceStatus } from "../types"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { creditsService, CreditAccount } from "@/features/credits/credits.service"
import { AccountDetailsModal } from "@/features/credits/components/account-details-modal"
import { toast } from "sonner"

export function InvoiceList() {
    const [invoices, setInvoices] = useState<PurchaseInvoice[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")

    const [selectedAccount, setSelectedAccount] = useState<CreditAccount | null>(null)
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
    const [invoiceIdToPay, setInvoiceIdToPay] = useState<string | undefined>()

    const loadInvoices = async () => {
        try {
            setLoading(true)
            const response = await purchaseInvoicesService.findAll()
            setInvoices(response.items)
        } catch (error) {
            console.error("Error loading invoices:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadInvoices()
    }, [])

    const filteredInvoices = invoices.filter(invoice =>
        invoice.supplierDocumentNumber?.toLowerCase().includes(search.toLowerCase()) ||
        invoice.purchase?.supplier?.name?.toLowerCase().includes(search.toLowerCase())
    )

    const handlePayClick = async (invoice: PurchaseInvoice) => {
        if (!invoice.purchase?.supplierId) return;
        try {
            const accounts = await creditsService.getAccounts({ supplierId: invoice.purchase.supplierId });
            const account = accounts[0];
            if (account) {
                setSelectedAccount(account);
                setInvoiceIdToPay(invoice.id);
                setIsPaymentModalOpen(true);
            } else {
                toast.error("No se encontró una cuenta de crédito para este proveedor");
            }
        } catch (error) {
            console.error("Error fetching credit account:", error);
            toast.error("Error al obtener información de pago");
        }
    }

    const getStatusBadge = (status: InvoiceStatus) => {
        switch (status) {
            case InvoiceStatus.VALID:
                return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">VÁLIDA</Badge>
            case InvoiceStatus.PENDING:
                return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">PENDIENTE</Badge>
            case InvoiceStatus.CANCELLED:
                return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">ANULADA</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nro comprobante o proveedor..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Proveedor</TableHead>
                            <TableHead>Comprobante</TableHead>
                            <TableHead className="text-right">Monto</TableHead>
                            <TableHead className="text-right">Saldo</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredInvoices.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    No se encontraron facturas.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredInvoices.map((invoice) => (
                                <TableRow key={invoice.id}>
                                    <TableCell>
                                        {format(new Date(invoice.createdAt), "dd/MM/yyyy HH:mm", { locale: es })}
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium text-xs">
                                            {invoice.purchase?.supplier?.name || "Sin proveedor"}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{invoice.supplierDocumentNumber}</span>
                                            <span className="text-[10px] text-muted-foreground uppercase">{invoice.documentType}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-bold">
                                        {formatCurrency(Number(invoice.totalAmount))}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span className={`font-bold ${Number(invoice.balance) > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                                            {formatCurrency(Number(invoice.balance ?? 0))}
                                        </span>
                                    </TableCell>
                                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button variant="ghost" size="icon" asChild title="Ver Recepciones en la Orden">
                                                <Link href={`/purchases/${invoice.purchaseId}?tab=recepciones`}>
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            {invoice.status === InvoiceStatus.PENDING && Number(invoice.balance) > 0 && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                    title="Registrar Pago"
                                                    onClick={() => handlePayClick(invoice)}
                                                >
                                                    <CreditCard className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {selectedAccount && (
                <AccountDetailsModal
                    account={selectedAccount}
                    isOpen={isPaymentModalOpen}
                    defaultInvoiceId={invoiceIdToPay}
                    onClose={() => {
                        setIsPaymentModalOpen(false);
                        setSelectedAccount(null);
                        setInvoiceIdToPay(undefined);
                        loadInvoices(); // Refresh list to see updated balance
                    }}
                />
            )}
        </div>
    )
}
