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
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Search, ArrowRightLeft, History } from "lucide-react"
import { stockService } from "../stock.service"
import { StockBalance } from "../types"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/utils"
import { StockAdjustmentDialog } from "./stock-adjustment-dialog"

export function StockList() {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<StockBalance[]>([])
    const [filteredData, setFilteredData] = useState<StockBalance[]>([])

    // Filters
    const [searchTerm, setSearchTerm] = useState("")
    const [warehouseFilter, setWarehouseFilter] = useState<string>("ALL")

    // Dialog State
    const [adjustmentItem, setAdjustmentItem] = useState<StockBalance | null>(null)
    const [adjustmentOpen, setAdjustmentOpen] = useState(false)

    const handleOpenAdjustment = (item: StockBalance) => {
        setAdjustmentItem(item)
        setAdjustmentOpen(true)
    }

    useEffect(() => {
        loadData()
    }, [])

    useEffect(() => {
        filterData()
    }, [data, searchTerm, warehouseFilter])

    const loadData = async () => {
        try {
            setLoading(true)
            const result = await stockService.getSummary()
            setData(result)
        } catch (error) {
            console.error(error)
            toast.error("Error al cargar el inventario")
        } finally {
            setLoading(false)
        }
    }

    const filterData = () => {
        let result = [...data]

        if (searchTerm) {
            const term = searchTerm.toLowerCase()
            result = result.filter(item =>
                item.product.name.toLowerCase().includes(term) ||
                item.sku.toLowerCase().includes(term) ||
                (item.barcode && item.barcode.includes(term))
            )
        }

        if (warehouseFilter !== "ALL") {
            result = result.filter(item => item.warehouse.id === warehouseFilter)
        }

        setFilteredData(result)
    }

    // Extract unique warehouses for filter
    const uniqueWarehouses = Array.from(
        new Map(data.map(item => [item.warehouse.id, item.warehouse])).values()
    )

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por producto, SKU..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                    />
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                    <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
                        <SelectTrigger className="w-full sm:w-[200px]">
                            <SelectValue placeholder="Filtrar por Almacén" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Todos los Almacenes</SelectItem>
                            {uniqueWarehouses.map(w => (
                                <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Producto</TableHead>
                            <TableHead>SKU / Código</TableHead>
                            <TableHead>Almacén</TableHead>
                            <TableHead className="text-right">Stock Actual</TableHead>
                            <TableHead className="text-right">Costo Prom.</TableHead>
                            <TableHead className="text-right">Valor Total</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center h-32 text-muted-foreground">
                                    No se encontraron productos en inventario
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredData.map((item) => (
                                <TableRow key={`${item.warehouse.id}-${item.variantId}`}>
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <span>{item.product.name}</span>
                                            {item.product.brand && (
                                                <span className="text-xs text-muted-foreground">{item.product.brand}</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-sm">
                                            <span className="font-mono">{item.sku}</span>
                                            {item.barcode && <span className="text-xs text-muted-foreground">{item.barcode}</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{item.warehouse.name}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-lg">
                                        {Number(item.stock).toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-right text-muted-foreground">
                                        {formatCurrency(Number(item.avgCost))}
                                    </TableCell>
                                    <TableCell className="text-right font-semibold">
                                        {formatCurrency(Number(item.stockValue))}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                title="Ver Kardex"
                                                onClick={() => window.location.href = `/inventory/kardex?variantId=${item.variantId}&warehouseId=${item.warehouse.id}`}
                                            >
                                                <History className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                title="Realizar Ajuste"
                                                onClick={() => handleOpenAdjustment(item)}
                                            >
                                                <ArrowRightLeft className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <StockAdjustmentDialog
                open={adjustmentOpen}
                onOpenChange={setAdjustmentOpen}
                item={adjustmentItem}
                onSuccess={loadData}
            />
        </div>
    )
}
