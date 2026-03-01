"use client";

import { useQuery } from "@tanstack/react-query";
import { reportsService, StockStatus } from "@/features/dashboard/reports.service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import {
    Package,
    AlertTriangle,
    BarChart3,
    Warehouse,
    TrendingDown,
    Search,
    ChevronRight,
    ArrowDownWideNarrow,
    FileDown
} from "lucide-react";
import { exportToExcel } from "@/lib/excel-export";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function InventoryReportPage() {
    const [searchTerm, setSearchTerm] = useState("");

    const { data: stockStatus, isLoading } = useQuery({
        queryKey: ["reports", "stock-status"],
        queryFn: () => reportsService.getStockStatus({})
    });

    const activeStock = useMemo(() => {
        if (!stockStatus) return [];
        return stockStatus.flatMap((wh: StockStatus) =>
            wh.variants.map((v: any) => ({
                ...v,
                warehouseName: wh.warehouseName
            }))
        );
    }, [stockStatus]);

    const filteredStock = useMemo(() => {
        return activeStock.filter((v: any) =>
            v.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.sku.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [activeStock, searchTerm]);

    const stats = useMemo(() => {
        const totalValue = activeStock.reduce((acc: number, v: any) => acc + (Number(v.totalValue) || 0), 0);
        const lowStockItems = activeStock.filter((v: any) => v.status === 'LOW' || v.status === 'OUT_OF_STOCK').length;
        const totalItems = activeStock.length;

        return { totalValue, lowStockItems, totalItems };
    }, [activeStock]);

    // Data for warehouse distribution chart
    const chartData = useMemo(() => {
        if (!stockStatus) return [];
        return stockStatus.map((wh: StockStatus) => ({
            name: wh.warehouseName,
            value: wh.variants.reduce((acc: number, v: any) => acc + (Number(v.onHand) || 0), 0),
            totalValue: wh.variants.reduce((acc: number, v: any) => acc + (Number(v.totalValue) || 0), 0)
        }));
    }, [stockStatus]);

    const handleExport = () => {
        if (!activeStock.length) return;

        exportToExcel(
            activeStock,
            [
                { header: 'Producto', key: 'productName', width: 30 },
                { header: 'SKU', key: 'sku', width: 15 },
                { header: 'Almacén', key: 'warehouseName', width: 20 },
                { header: 'Stock Físico', key: 'onHand', width: 15 },
                { header: 'Costo Unitario', key: 'avgCost', width: 15, formatter: (val) => formatCurrency(val) },
                { header: 'Valoración Total', key: 'totalValue', width: 20, formatter: (val) => formatCurrency(val) },
                { header: 'Estado', key: 'status', width: 15, formatter: (val) => val === 'OUT_OF_STOCK' ? 'Agotado' : val === 'LOW' ? 'Bajo' : 'OK' },
            ],
            `Reporte_Inventario_${new Date().toISOString().split('T')[0]}`
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="bg-emerald-100 p-2 rounded-xl">
                            <Package className="h-6 w-6 text-emerald-600" />
                        </div>
                        <h2 className="text-3xl font-black tracking-tighter text-slate-800">Análisis de Inventario</h2>
                    </div>
                    <p className="text-muted-foreground">Valoración de activos, monitoreo de stock y alertas de reposición.</p>
                </div>
            </div>

            {/* General Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-sm overflow-hidden bg-slate-900 text-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">Valoración Total Stock (Costo)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black tracking-tighter">
                            {formatCurrency(stats.totalValue)}
                        </div>
                        <p className="text-xs text-slate-500 mt-2 italic">* Basado en costo promedio ponderado</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm overflow-hidden">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Alertas de Reposición</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black tracking-tighter text-rose-600">
                            {stats.lowStockItems}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <AlertTriangle className="h-4 w-4 text-rose-500" />
                            <span className="text-xs text-muted-foreground">SKUs con stock crítico</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm overflow-hidden">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Total Variantes Activas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black tracking-tighter text-slate-800">
                            {stats.totalItems}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">Productos únicos en catálogo</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Warehouse Distribution */}
                <Card className="lg:col-span-5 border-none shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Warehouse className="h-5 w-5 text-indigo-500" />
                            Distribución por Almacén
                        </CardTitle>
                        <CardDescription>Cantidad de unidades físicas por ubicación.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} axisLine={false} tickLine={false} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                />
                                <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={24}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Stock Search/Alerts Table */}
                <Card className="lg:col-span-7 border-none shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50/50">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex-1">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <BarChart3 className="h-5 w-5 text-emerald-500" />
                                    Estado de Productos
                                </CardTitle>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="relative w-64 text-slate-900">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder="Buscar producto o SKU..."
                                        className="pl-9 h-9 rounded-xl border-slate-200"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9 text-xs bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                    onClick={handleExport}
                                    disabled={activeStock.length === 0}
                                >
                                    <FileDown className="h-4 w-4 mr-2" />
                                    Exportar Excel
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <div className="max-h-[350px] overflow-y-auto">
                        <Table>
                            <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
                                <TableRow className="border-none bg-slate-50/50">
                                    <TableHead className="font-bold text-[11px] uppercase">Producto</TableHead>
                                    <TableHead className="font-bold text-[11px] uppercase">Almacén</TableHead>
                                    <TableHead className="text-right font-bold text-[11px] uppercase">Stock</TableHead>
                                    <TableHead className="text-right font-bold text-[11px] uppercase">Estado</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={4} className="text-center py-10">Cargando inventario...</TableCell></TableRow>
                                ) : filteredStock.length === 0 ? (
                                    <TableRow><TableCell colSpan={4} className="text-center py-10">No se encontraron productos.</TableCell></TableRow>
                                ) : filteredStock.map((v) => (
                                    <TableRow key={`${v.warehouseName}-${v.variantId}`} className="hover:bg-slate-50 border-slate-100">
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-slate-700 text-xs">{v.productName}</span>
                                                <span className="text-[10px] text-muted-foreground font-mono">{v.sku}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-[10px] font-bold text-slate-500">{v.warehouseName}</TableCell>
                                        <TableCell className="text-right font-bold text-slate-700">{v.onHand}</TableCell>
                                        <TableCell className="text-right">
                                            <Badge
                                                variant={v.status === 'OUT_OF_STOCK' ? 'destructive' : v.status === 'LOW' ? 'outline' : 'secondary'}
                                                className={`text-[9px] uppercase px-1.5 py-0 h-4 ${v.status === 'LOW' ? 'border-amber-500 text-amber-600' : ''}`}
                                            >
                                                {v.status === 'OUT_OF_STOCK' ? 'Agotado' : v.status === 'LOW' ? 'Bajo' : 'OK'}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="p-3 bg-slate-50 border-t flex justify-between items-center text-[10px] text-muted-foreground uppercase font-bold">
                        <span>Mostrando {filteredStock.length} variantes</span>
                        <div className="flex gap-4">
                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500" /> Agotado</span>
                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500" /> Bajo Stock</span>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
