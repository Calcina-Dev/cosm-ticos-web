"use client";

import { useQuery } from "@tanstack/react-query";
import { reportsService } from "@/features/dashboard/reports.service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import {
    LayoutDashboard,
    TrendingUp,
    DollarSign,
    ShoppingCart,
    ArrowUpRight,
    Calendar,
    Filter,
    Table as TableIcon,
    FileDown
} from "lucide-react";
import { useMemo } from "react";
import { exportToExcel } from "@/lib/excel-export";
import { useState } from "react";
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

export default function SalesReportPage() {
    const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    const { data: summary, isLoading: loadingSummary } = useQuery({
        queryKey: ["reports", "sales-summary", startDate, endDate],
        queryFn: () => reportsService.getSalesSummary({ startDate, endDate })
    });

    const { data: topProducts, isLoading: loadingTop } = useQuery({
        queryKey: ["reports", "top-products", startDate, endDate],
        queryFn: () => reportsService.getTopProducts({ startDate, endDate, limit: 10 })
    });

    const handleExport = () => {
        if (!topProducts) return;

        exportToExcel(
            topProducts,
            [
                { header: 'Producto', key: 'productName', width: 30 },
                { header: 'SKU', key: 'variantSku', width: 15 },
                { header: 'Cantidad Vendida', key: 'quantitySold', width: 15 },
                { header: 'Facturación', key: 'totalRevenue', width: 20, formatter: (val) => formatCurrency(val) },
            ],
            `Reporte_Productos_Vendidos_${startDate}_a_${endDate}`
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Header & Filters */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary/10 p-2 rounded-xl">
                            <TrendingUp className="h-6 w-6 text-primary" />
                        </div>
                        <h2 className="text-3xl font-black tracking-tighter text-slate-800">Reporte de Ventas</h2>
                    </div>
                    <p className="text-muted-foreground">Análisis de rendimiento, márgenes y tendencias comerciales.</p>
                </div>

                <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border shadow-sm self-start md:self-auto">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase ml-1">Desde</span>
                        <Input
                            type="date"
                            className="h-9 border-none focus-visible:ring-0 w-36 font-medium"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <div className="w-[1px] h-8 bg-slate-200" />
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase ml-1">Hasta</span>
                        <Input
                            type="date"
                            className="h-9 border-none focus-visible:ring-0 w-36 font-medium"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                    <Button variant="secondary" size="sm" className="rounded-xl h-9">
                        <Filter className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-none shadow-sm bg-primary text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-20">
                        <DollarSign className="h-16 w-16" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-primary-foreground/80">Total Ingresos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black tracking-tighter">
                            {formatCurrency(summary?.totalAmount || 0)}
                        </div>
                        <div className="flex items-center mt-2 text-primary-foreground/90 text-xs">
                            <div className="bg-white/20 p-1 rounded-md mr-2">
                                <ArrowUpRight className="h-3 w-3" />
                            </div>
                            Ventas brutas del periodo
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm overflow-hidden relative">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Utilidad Total (Margen)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black tracking-tighter text-emerald-600">
                            {formatCurrency(summary?.totalMargin || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">Beneficio neto estimado</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm overflow-hidden relative">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Ticket Promedio</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black tracking-tighter text-slate-800">
                            {formatCurrency(summary?.averageTicket || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">Venta promedio por cliente</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm overflow-hidden relative">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Volumen de Ventas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black tracking-tighter text-slate-800">
                            {summary?.totalSales || 0}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">Transacciones realizadas</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Sales Over Time */}
                <Card className="lg:col-span-8 border-none shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            Tendencia de Ventas
                        </CardTitle>
                        <CardDescription>Visualización diaria de ingresos en el rango seleccionado.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={summary?.salesByDay || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(val) => `$${val}`}
                                />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                    formatter={(value: any) => [formatCurrency(value), "Ventas"]}
                                />
                                <Area type="monotone" dataKey="amount" stroke="#6366f1" fillOpacity={1} fill="url(#colorAmount)" strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Payment Methods Chart */}
                <Card className="lg:col-span-4 border-none shadow-sm">
                    <CardHeader>
                        <CardTitle>Métodos de Pago</CardTitle>
                        <CardDescription>Desglose de ingresos por medio.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={summary?.salesByPaymentMethod || []}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="amount"
                                    nameKey="paymentMethodName"
                                >
                                    {summary?.salesByPaymentMethod.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(val: any) => formatCurrency(val)} />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Top Products Table */}
            <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <ShoppingCart className="h-5 w-5 text-indigo-500" />
                                Productos Más Vendidos
                            </CardTitle>
                            <CardDescription>Ranking por cantidad de unidades vendidas.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="rounded-lg">Top 10</Badge>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                onClick={handleExport}
                                disabled={!topProducts || topProducts.length === 0}
                            >
                                <FileDown className="h-3 w-3 mr-1" />
                                Exportar Excel
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <Table>
                    <TableHeader>
                        <TableRow className="border-none bg-slate-50/50">
                            <TableHead className="font-bold">Producto</TableHead>
                            <TableHead className="font-bold">SKU</TableHead>
                            <TableHead className="text-right font-bold">Unidades</TableHead>
                            <TableHead className="text-right font-bold">Facturación</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loadingTop ? (
                            <TableRow><TableCell colSpan={4} className="text-center py-10">Cargando datos...</TableCell></TableRow>
                        ) : topProducts?.length === 0 ? (
                            <TableRow><TableCell colSpan={4} className="text-center py-10">Sin datos en el periodo.</TableCell></TableRow>
                        ) : topProducts?.map((product, idx) => (
                            <TableRow key={product.variantId} className="hover:bg-slate-50 border-slate-100">
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center font-bold text-indigo-600 text-[10px]">
                                            #{idx + 1}
                                        </div>
                                        <span className="font-medium text-slate-700">{product.productName}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground font-mono">{product.variantSku}</TableCell>
                                <TableCell className="text-right font-bold text-slate-700">{product.quantitySold}</TableCell>
                                <TableCell className="text-right font-black text-emerald-600">
                                    {formatCurrency(product.totalRevenue)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
