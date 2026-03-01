"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"

export const dynamic = "force-dynamic";
import { purchasesService } from "@/features/purchases/purchases.service"
import { Purchase, PurchaseStatus } from "@/features/purchases/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from "@/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ArrowLeft, CheckCircle, Loader2, XCircle, Pencil } from "lucide-react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { getErrorMessage } from "@/lib/error-utils"
import { PurchaseInvoiceModal } from "@/features/purchases/components/purchase-invoice-modal"
import { PurchaseInvoiceDetailModal } from "@/features/purchases/components/purchase-invoice-detail-modal"
import { PurchaseInvoice } from "@/features/purchases/types"
import nextDynamic from "next/dynamic"
import { useQuery } from "@tanstack/react-query"
import { documentFlowService, DocumentType } from "@/features/dashboard/document-flow.service"
import { Map } from "lucide-react"

const DocumentFlowCanvas = nextDynamic(() => import("@/features/dashboard/components/DocumentFlowCanvas"), {
    ssr: false,
    loading: () => <div className="h-[500px] w-full flex items-center justify-center bg-slate-50 rounded-xl border border-dashed">
        <Loader2 className="h-8 w-8 animate-spin text-primary/30" />
    </div>
});

function PurchaseFlowContainer({ purchaseId }: { purchaseId: string }) {
    const { data: flow, isLoading } = useQuery({
        queryKey: ["document-flow", purchaseId, "PURCHASE"],
        queryFn: () => documentFlowService.getFlow(purchaseId, DocumentType.PURCHASE),
    });

    if (isLoading) return <div className="h-[500px] w-full flex items-center justify-center bg-slate-50 rounded-xl border border-dashed">
        <Loader2 className="h-8 w-8 animate-spin text-primary/30" />
    </div>;

    return (
        <div className="h-[600px] w-full border rounded-xl overflow-hidden bg-white shadow-inner">
            <DocumentFlowCanvas initialNodes={flow?.nodes || []} initialEdges={flow?.edges || []} />
        </div>
    );
}

export default function PurchaseDetailPage() {
    const params = useParams()
    const router = useRouter()
    const searchParams = useSearchParams()
    const id = params.id as string
    const initialTab = searchParams.get("tab") || "resumen"

    const [purchase, setPurchase] = useState<Purchase | null>(null)
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState(false)
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false)
    const [selectedInvoice, setSelectedInvoice] = useState<PurchaseInvoice | null>(null)
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

    useEffect(() => {
        loadData()
    }, [id])

    const loadData = async () => {
        try {
            setLoading(true)
            const result = await purchasesService.findOne(id)
            setPurchase(result)
        } catch (error) {
            console.error(error)
            toast.error("Error al cargar la compra")
        } finally {
            setLoading(false)
        }
    }

    const handleFinalize = async () => {
        if (!confirm("¿Estás seguro de confirmar esta orden de compra?")) return

        try {
            setProcessing(true)
            await purchasesService.finalize(id)
            toast.success("Orden de compra confirmada")
            loadData() // Reload to see new status
        } catch (error) {
            toast.error(getErrorMessage(error, "Error al finalizar compra"))
        } finally {
            setProcessing(false)
        }
    }

    const handleCancel = async () => {
        // Simple prompt for now
        const reason = prompt("Ingrese motivo de anulación:")
        if (!reason) return

        try {
            setProcessing(true)
            await purchasesService.cancel(id, reason)
            toast.success("Compra anulada")
            loadData()
        } catch (error) {
            toast.error(getErrorMessage(error, "Error al anular"))
        } finally {
            setProcessing(false)
        }
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!purchase) {
        return <div>Compra no encontrada</div>
    }

    const getStatusBadge = (status: PurchaseStatus) => {
        switch (status) {
            case PurchaseStatus.DRAFT:
                return <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">BORRADOR</Badge>
            case PurchaseStatus.CONFIRMED:
                return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">CONFIRMADO</Badge>
            case PurchaseStatus.PARTIALLY_RECEIVED:
                return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">RECEP. PARCIAL</Badge>
            case PurchaseStatus.COMPLETED:
                return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">COMPLETADO</Badge>
            case PurchaseStatus.RECEIVED:
                return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">RECIBIDO (LG)</Badge>
            case PurchaseStatus.CANCELLED:
                return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">ANULADO</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/purchases">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Compra #{purchase.documentNumber || purchase.id.substring(0, 8)}</h2>
                        <div className="mt-1 flex items-center gap-2">
                            {getStatusBadge(purchase.status)}
                            <span className="text-muted-foreground text-sm">
                                {format(new Date(purchase.createdAt), "dd MMM yyyy HH:mm", { locale: es })}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">

                    {purchase.status === PurchaseStatus.DRAFT && (
                        <>
                            <Button variant="outline" asChild>
                                <Link href={`/purchases/${purchase.id}/edit`}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Editar
                                </Link>
                            </Button>
                            <Button variant="destructive" onClick={handleCancel} disabled={processing}>
                                <XCircle className="mr-2 h-4 w-4" />
                                Anular
                            </Button>
                            <Button onClick={handleFinalize} disabled={processing}>
                                {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                                Confirmar Orden
                            </Button>
                        </>
                    )}
                    {(purchase.status === PurchaseStatus.CONFIRMED || purchase.status === PurchaseStatus.PARTIALLY_RECEIVED) && (
                        <>
                            <Button variant="destructive" onClick={handleCancel} disabled={processing} className="mr-2">
                                <XCircle className="mr-2 h-4 w-4" />
                                Anular Orden
                            </Button>
                            <Button onClick={() => setIsInvoiceModalOpen(true)} disabled={processing}>
                                Registrar Recepción
                            </Button>
                        </>
                    )}
                    {purchase.status === PurchaseStatus.COMPLETED && (
                        <Button variant="ghost" disabled>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Completado
                        </Button>
                    )}
                </div>
            </div>

            <Tabs defaultValue={initialTab} className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="resumen">Resumen de Orden</TabsTrigger>
                    <TabsTrigger value="recepciones">Recepciones ({purchase.invoices?.length || 0})</TabsTrigger>
                    <TabsTrigger value="trazabilidad" className="gap-2">
                        <Map className="h-3.5 w-3.5" />
                        Trazabilidad
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="resumen">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle>Productos Solicitados</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Producto</TableHead>
                                            <TableHead className="text-right">Cant.</TableHead>
                                            <TableHead className="text-right">Costo U.</TableHead>
                                            <TableHead className="text-right">Subtotal</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {purchase.lines?.map((line) => (
                                            <TableRow key={line.id}>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{line.variant.product.name}</span>
                                                        <span className="text-xs text-muted-foreground">{line.variant.sku}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">{line.quantity}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(Number(line.unitCost))}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(Number(line.subtotal))}</TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-right font-bold">Total Orden:</TableCell>
                                            <TableCell className="text-right font-bold">{formatCurrency(Number(purchase.totalAmount))}</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Información</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Proveedor</p>
                                    <p className="font-medium">{purchase.supplier.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Almacén de Destino</p>
                                    <p className="font-medium">{purchase.warehouse.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Usuario Autorizador</p>
                                    <p className="text-sm">{purchase.user.email}</p>
                                </div>
                                {purchase.documentNumber && (
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Doc. Interno</p>
                                        <p className="text-sm">{purchase.documentSeries}-{purchase.documentNumber}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
                <TabsContent value="recepciones">
                    <Card>
                        <CardHeader>
                            <CardTitle>Historial de Recepciones y Facturas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {!purchase.invoices || purchase.invoices.length === 0 ? (
                                <p className="text-muted-foreground text-center py-8">Aún no se ha recibido mercadería para esta orden de compra.</p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Fecha Recepción</TableHead>
                                            <TableHead>Comprobante</TableHead>
                                            <TableHead>Monto Facturado</TableHead>
                                            <TableHead>Items Recibidos</TableHead>
                                            <TableHead>Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {purchase.invoices.map(invoice => (
                                            <TableRow key={invoice.id}>
                                                <TableCell>{format(new Date(invoice.createdAt), "dd MMM yyyy HH:mm", { locale: es })}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span>{invoice.supplierDocumentNumber}</span>
                                                        <span className="text-xs text-muted-foreground">{invoice.documentType}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-medium">{formatCurrency(Number(invoice.totalAmount))}</TableCell>
                                                <TableCell>{invoice.lines?.reduce((acc, l) => acc + l.quantity, 0) || 0} unidades</TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="sm" onClick={() => {
                                                        setSelectedInvoice(invoice)
                                                        setIsDetailModalOpen(true)
                                                    }}>Ver Detalle</Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="trazabilidad">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Map className="h-5 w-5 text-indigo-500" />
                                Mapa de Trazabilidad Comercial
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <PurchaseFlowContainer purchaseId={purchase.id} />
                            <p className="text-[10px] text-muted-foreground text-center italic">
                                * Este mapa muestra el origen y destino de esta operación comercial (OC {"->"} Factura {"->"} Stock {"->"} Pagos).
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <PurchaseInvoiceModal
                purchase={purchase}
                isOpen={isInvoiceModalOpen}
                onClose={() => setIsInvoiceModalOpen(false)}
                onSuccess={loadData}
            />

            <PurchaseInvoiceDetailModal
                invoice={selectedInvoice}
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
            />
        </div >
    )
}
