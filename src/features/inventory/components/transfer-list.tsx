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
import { Loader2, Plus, ArrowRight } from "lucide-react"
import Link from "next/link"
import { stockService } from "../stock.service"
import { StockTransfer } from "../types"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export function TransferList() {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<StockTransfer[]>([])
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)
    const limit = 20

    useEffect(() => {
        loadData(page)
    }, [page])

    const loadData = async (currentPage: number) => {
        try {
            setLoading(true)
            const result = await stockService.getTransfers({ limit, page: currentPage })
            setData(result.items || [])
            setTotal(result.meta.total)
        } catch (error) {
            console.error(error)
            toast.error("Error al cargar transferencias")
        } finally {
            setLoading(false)
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
                <h2 className="text-xl font-bold tracking-tight">Historial de Transferencias</h2>
                <Button asChild>
                    <Link href="/inventory/transfers/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Nueva Transferencia
                    </Link>
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Origen</TableHead>
                            <TableHead></TableHead>
                            <TableHead>Destino</TableHead>
                            <TableHead>Motivo</TableHead>
                            <TableHead>Items</TableHead>
                            <TableHead>Usuario</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center h-32 text-muted-foreground">
                                    No hay transferencias registradas
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
                                    <TableCell>
                                        <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-50 hover:text-red-700 border-red-200">
                                            {item.fromWarehouse.name}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50 hover:text-green-700 border-green-200">
                                            {item.toWarehouse.name}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{item.reason}</TableCell>
                                    <TableCell className="font-medium text-center">
                                        {item._count?.lines || 0}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {item.user.email}
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
