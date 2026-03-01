"use client"

import { useEffect, useState } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, Eye } from "lucide-react"
import Link from "next/link"
import { purchasesService } from "../purchases.service"
import { Purchase, PurchaseStatus } from "../types"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { formatCurrency } from "@/lib/utils"

export function PurchaseList() {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<Purchase[]>([])
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)
    const limit = 20

    useEffect(() => {
        loadData(page)
    }, [page])

    const loadData = async (currentPage: number) => {
        try {
            setLoading(true)
            const result = await purchasesService.findAll({ limit, page: currentPage })
            setData(result.items || [])
            setTotal(result.meta.total)
        } catch (error) {
            console.error(error)
            toast.error("Error al cargar compras")
        } finally {
            setLoading(false)
        }
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

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold tracking-tight">Historial de Compras</h2>
                <Button asChild>
                    <Link href="/purchases/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Nueva Compra
                    </Link>
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Proveedor</TableHead>
                            <TableHead>Almacén</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="w-[100px]">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center h-32 text-muted-foreground">
                                    No hay compras registradas
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">
                                                {format(new Date(item.createdAt), "dd MMM yyyy", { locale: es })}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {format(new Date(item.createdAt), "HH:mm", { locale: es })}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium">{item.supplier.name}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{item.warehouse.name}</TableCell>
                                    <TableCell className="font-medium">
                                        {formatCurrency(item.totalAmount)}
                                    </TableCell>
                                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" asChild>
                                            <Link href={`/purchases/${item.id}`}>
                                                <Eye className="h-4 w-4" />
                                                <span className="sr-only">Ver detalles</span>
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {!loading && total > limit && (
                <div className="flex items-center justify-end space-x-2 py-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        Anterior
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        Página {page} de {Math.ceil(total / limit)}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => p + 1)}
                        disabled={page >= Math.ceil(total / limit)}
                    >
                        Siguiente
                    </Button>
                </div>
            )}
        </div>
    )
}
