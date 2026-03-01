"use client"

import { useEffect, useState, useCallback } from "react"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Loader2, ArrowLeft, ArrowRight, Search, X } from "lucide-react"
import { stockService } from "../stock.service"
import { StockMovement, StockMovementType } from "../types"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useDebounce } from "@/hooks/use-debounce"

interface KardexTableProps {
    variantId?: string
    warehouseId?: string
}

const MOVEMENT_TYPE_OPTIONS = [
    { value: "ALL", label: "Todos los tipos" },
    { value: "ENTRADA", label: "Entradas (compra, devolución, ingreso)" },
    { value: "SALIDA", label: "Salidas (venta, transferencia, salida)" },
    { value: "REVERSAL", label: "Anulación" },
    { value: "ADJUSTMENT", label: "Ajuste de inventario" },
]

const getMovementBadge = (type: StockMovementType) => {
    const entries = ['IN', 'PURCHASE', 'TRANSFER_IN', 'RETURN', 'REVERSAL'] as string[]
    const exits: StockMovementType[] = [
        StockMovementType.OUT, StockMovementType.SALE, StockMovementType.TRANSFER_OUT,
    ]
    if ((entries as string[]).includes(type))
        return <Badge className="bg-green-500 hover:bg-green-600 text-[10px]">ENTRADA</Badge>
    if ((exits as string[]).includes(type))
        return <Badge className="bg-red-500 hover:bg-red-600 text-[10px]">SALIDA</Badge>
    if (type === StockMovementType.ADJUSTMENT)
        return <Badge variant="outline" className="text-[10px]">AJUSTE</Badge>
    return <Badge variant="secondary" className="text-[10px]">{type}</Badge>
}

export function KardexTable({ variantId, warehouseId }: KardexTableProps) {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<StockMovement[]>([])
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState("")
    const [type, setType] = useState("ALL")
    const [fromDate, setFromDate] = useState("")
    const [toDate, setToDate] = useState("")
    const limit = 10

    const debouncedSearch = useDebounce(search, 350)

    const loadData = useCallback(async (p: number, q: string, t: string, fd: string, td: string) => {
        try {
            setLoading(true)
            const result = await stockService.getMovements({
                limit,
                page: p,
                variantId,
                warehouseId,
                search: q || undefined,
                type: t !== "ALL" ? t : undefined,
                fromDate: fd || undefined,
                toDate: td || undefined,
            })
            setData(result.items)
            setTotal(result.meta.total)
        } catch (error) {
            console.error(error)
            toast.error("Error al cargar movimientos")
        } finally {
            setLoading(false)
        }
    }, [variantId, warehouseId])

    // Reset page when filters change
    useEffect(() => { setPage(1) }, [debouncedSearch, type, fromDate, toDate])

    useEffect(() => {
        loadData(page, debouncedSearch, type, fromDate, toDate)
    }, [page, debouncedSearch, type, fromDate, toDate, loadData])

    const totalPages = Math.ceil(total / limit)

    const clearFilters = () => {
        setSearch(""); setType("ALL"); setFromDate(""); setToDate("")
    }
    const hasFilters = search || type !== "ALL" || fromDate || toDate

    return (
        <div className="space-y-4">
            {/* ── Filter Bar ── */}
            <div className="flex flex-col gap-3">
                {/* Row 1: buscador + tipo */}
                <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por producto, SKU, vendedor, almacén, comprobante..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-9 pr-8 h-9"
                        />
                        {search && (
                            <button onClick={() => setSearch("")}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                    <select
                        value={type}
                        onChange={e => setType(e.target.value)}
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                        {MOVEMENT_TYPE_OPTIONS.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                </div>

                {/* Row 2: rango de fechas + limpiar */}
                <div className="flex flex-col sm:flex-row gap-2 items-center">
                    <div className="flex items-center gap-2 flex-1">
                        <label className="text-xs text-muted-foreground whitespace-nowrap">Desde</label>
                        <Input type="date" value={fromDate}
                            onChange={e => setFromDate(e.target.value)}
                            className="h-9 text-sm" />
                        <label className="text-xs text-muted-foreground whitespace-nowrap">Hasta</label>
                        <Input type="date" value={toDate}
                            onChange={e => setToDate(e.target.value)}
                            className="h-9 text-sm" />
                    </div>
                    {hasFilters && (
                        <Button variant="ghost" size="sm" onClick={clearFilters}
                            className="text-muted-foreground hover:text-foreground gap-1.5">
                            <X className="h-3.5 w-3.5" /> Limpiar filtros
                        </Button>
                    )}
                </div>
            </div>

            {/* Resumen */}
            <p className="text-xs text-muted-foreground">
                {loading ? "Cargando..." : `${total} movimiento${total !== 1 ? "s" : ""}`}
            </p>

            {/* ── Tabla ── */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Almacén</TableHead>
                            <TableHead>N° Inventario</TableHead>
                            <TableHead>Ref. Documento</TableHead>
                            <TableHead>Producto</TableHead>
                            <TableHead className="text-right">Cantidad</TableHead>
                            <TableHead className="text-right">Costo Unit.</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead>Usuario</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={10} className="h-48 text-center">
                                    <Loader2 className="h-7 w-7 animate-spin text-primary mx-auto" />
                                </TableCell>
                            </TableRow>
                        ) : data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={10} className="h-32 text-center text-muted-foreground text-sm">
                                    No hay movimientos que coincidan con los filtros.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-mono text-xs">
                                        {format(new Date(item.createdAt), "dd/MM/yyyy HH:mm", { locale: es })}
                                    </TableCell>
                                    <TableCell>{getMovementBadge(item.type)}</TableCell>
                                    <TableCell className="text-sm">{item.warehouse.name}</TableCell>

                                    {/* N° Inventario propio (NS01/NI01) */}
                                    <TableCell>
                                        {item.documentSeries && item.documentNumber ? (
                                            <div className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-[10px] font-mono font-medium inline-block border border-emerald-200 shadow-sm whitespace-nowrap">
                                                {item.documentSeries}-{String(item.documentNumber).padStart(6, '0')}
                                            </div>
                                        ) : <span className="text-muted-foreground font-mono text-xs">-</span>}
                                    </TableCell>

                                    {/* Ref. Documento (NV01 / DV01 de la venta origen, o CP01 de la compra) */}
                                    <TableCell>
                                        {(() => {
                                            const sale = (item as any).sale
                                            if (sale?.documentSeries && sale?.documentNumber) return (
                                                <div className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full text-[10px] font-mono font-medium inline-block border border-indigo-200 shadow-sm whitespace-nowrap">
                                                    {sale.documentSeries}-{String(sale.documentNumber).padStart(6, '0')}
                                                </div>
                                            )

                                            // Handle purchase references
                                            const purchase = (item as any).purchase
                                            const purchaseInvoice = (item as any).purchaseInvoice

                                            // 1. Mostrar Factura Comercial del documento actual si existe
                                            if (purchaseInvoice?.supplierDocumentNumber) return (
                                                <div className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full text-[10px] font-mono font-medium inline-block border border-amber-200 shadow-sm whitespace-nowrap">
                                                    {purchaseInvoice.supplierDocumentNumber}
                                                </div>
                                            )

                                            // 2. Fallback a Factura Comercial en Purchase (legacy) si existe
                                            if (purchase?.supplierDocumentNumber) return (
                                                <div className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full text-[10px] font-mono font-medium inline-block border border-amber-200 shadow-sm whitespace-nowrap">
                                                    {purchase.supplierDocumentNumber}
                                                </div>
                                            )

                                            // 3. Fallback a Orden de Compra Interna CP01 si existe
                                            if (purchase?.documentSeries && purchase?.documentNumber) return (
                                                <div className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full text-[10px] font-mono font-medium inline-block border border-amber-200 shadow-sm whitespace-nowrap">
                                                    {purchase.documentSeries}-{String(purchase.documentNumber).padStart(6, '0')}
                                                </div>
                                            )

                                            return <span className="text-muted-foreground font-mono text-xs">-</span>
                                        })()}
                                    </TableCell>

                                    {/* Producto */}
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm">{item.variant.product.name}</span>
                                            <span className="text-xs text-muted-foreground font-mono">{item.variant.sku}</span>
                                        </div>
                                    </TableCell>

                                    <TableCell className="text-right font-bold">{item.quantity}</TableCell>
                                    <TableCell className="text-right text-muted-foreground text-xs">
                                        {formatCurrency(Number(item.unitCost))}
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        {formatCurrency(Number(item.totalCost))}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {item.user.email}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* ── Paginación ── */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Página {page} de {totalPages}</span>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1 || loading}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages || loading}>
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
