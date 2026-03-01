"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    TrendingUp,
    DollarSign,
    ShoppingCart,
    Box,
    Package,
    ArrowUpRight,
    ArrowDownRight,
    AlertTriangle,
    CheckCircle2,
    LayoutDashboard,
    Calendar
} from "lucide-react";
import { useAuthStore } from "@/features/auth/auth.store";
import { reportsService } from "@/features/dashboard/reports.service";
import { formatCurrency } from "@/lib/utils";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell,
    PieChart,
    Pie,
    Legend
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// ── Tipos de período ──────────────────────────────────────────────────────────
type PeriodKey = "week" | "month" | "year";

interface Period {
    key: PeriodKey;
    label: string;
    shortLabel: string;
    getRange: () => { startDate: string; endDate: string };
}

function toISODate(d: Date) { return d.toISOString().split("T")[0]; }

const PERIODS: Period[] = [
    {
        key: "week",
        label: "Semana en curso",
        shortLabel: "Esta semana",
        getRange: () => {
            const today = new Date();
            const day = today.getDay(); // 0=dom, 1=lun …
            const diff = day === 0 ? 6 : day - 1; // adjust to Mon-start
            const monday = new Date(today);
            monday.setDate(today.getDate() - diff);
            monday.setHours(0, 0, 0, 0);
            return { startDate: toISODate(monday), endDate: toISODate(today) };
        }
    },
    {
        key: "month",
        label: "Mes en curso",
        shortLabel: "Este mes",
        getRange: () => {
            const today = new Date();
            const first = new Date(today.getFullYear(), today.getMonth(), 1);
            return { startDate: toISODate(first), endDate: toISODate(today) };
        }
    },
    {
        key: "year",
        label: "Año en curso",
        shortLabel: "Este año",
        getRange: () => {
            const today = new Date();
            const first = new Date(today.getFullYear(), 0, 1);
            return { startDate: toISODate(first), endDate: toISODate(today) };
        }
    },
];

// ─────────────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
    const { user } = useAuthStore();
    const [activePeriod, setActivePeriod] = useState<PeriodKey>("week");

    const period = useMemo(
        () => PERIODS.find(p => p.key === activePeriod)!,
        [activePeriod]
    );
    const { startDate, endDate } = useMemo(() => period.getRange(), [period]);

    const { data: summary, isLoading: loadingSummary } = useQuery({
        queryKey: ["sales-summary", startDate, endDate],
        queryFn: () => reportsService.getSalesSummary({ startDate, endDate })
    });

    const { data: topProducts, isLoading: loadingTop } = useQuery({
        queryKey: ["top-products", startDate, endDate],
        queryFn: () => reportsService.getTopProducts({ startDate, endDate, limit: 5 })
    });

    const { data: stockStatus, isLoading: loadingStock } = useQuery({
        queryKey: ["stock-status"],
        queryFn: () => reportsService.getStockStatus({})
    });

    const dataLoading = loadingSummary || loadingTop;

    const lowStockItems = stockStatus?.flatMap(wh =>
        wh.variants.filter(v => v.status === "LOW" || v.status === "OUT_OF_STOCK")
    ) || [];

    // Colores para Pie Chart
    const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header + Selector de Período */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary/10 p-2 rounded-lg">
                            <LayoutDashboard className="h-5 w-5 text-primary" />
                        </div>
                        <h2 className="text-3xl font-black tracking-tighter text-slate-800">Panel de Control</h2>
                    </div>
                    <p className="text-muted-foreground text-sm ml-11">
                        Bienvenido a <span className="font-bold text-slate-700">{user?.companyName || "su tienda"}</span> · <span className="font-semibold text-primary">{period.label}</span>
                        <span className="text-slate-400 ml-2 font-mono text-xs">
                            ({startDate} → {endDate})
                        </span>
                    </p>
                </div>

                {/* Período Tabs */}
                <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border">
                    <Calendar className="h-4 w-4 text-muted-foreground ml-2" />
                    {PERIODS.map(p => (
                        <Button
                            key={p.key}
                            variant={activePeriod === p.key ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setActivePeriod(p.key)}
                            className={`text-xs rounded-lg transition-all ${activePeriod === p.key
                                ? "shadow-sm"
                                : "text-muted-foreground hover:text-foreground"}`}
                        >
                            {p.shortLabel}
                        </Button>
                    ))}
                </div>
            </div>

            {/* KPI Cards */}
            {dataLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="rounded-3xl border bg-white shadow-sm p-6 h-36 flex items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/30" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <KpiCard
                        title="Ventas del Período"
                        value={formatCurrency(summary?.totalAmount || 0)}
                        icon={<DollarSign className="h-4 w-4" />}
                        description="Ventas brutas acumuladas"
                    />
                    <KpiCard
                        title="Utilidad (Margen)"
                        value={formatCurrency(summary?.totalMargin || 0)}
                        icon={<TrendingUp className="h-4 w-4" />}
                        description="Ganancia bruta sobre costo"
                        color="emerald"
                    />
                    <KpiCard
                        title="Ticket Promedio"
                        value={formatCurrency(summary?.averageTicket || 0)}
                        icon={<ShoppingCart className="h-4 w-4" />}
                        description="Monto medio por boleta"
                        color="amber"
                    />
                    <KpiCard
                        title="Volumen de Ventas"
                        value={`${summary?.totalSales || 0} oper.`}
                        icon={<Box className="h-4 w-4" />}
                        description="Transacciones confirmadas"
                        color="indigo"
                    />
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-12">
                {/* Sales & Margin Trend Chart */}
                <div className="md:col-span-8 rounded-3xl border bg-white shadow-sm p-6 overflow-hidden">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Tendencia de Ingresos vs Margen</h3>
                            <p className="text-xs text-muted-foreground">Comparativa de ingresos y utilidad bruta</p>
                        </div>
                        <Badge variant="outline" className="bg-slate-50">{period.shortLabel}</Badge>
                    </div>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={summary?.salesByDay || []}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorMargin" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fill: "#64748b" }}
                                    tickFormatter={(val) => {
                                        const dateStr = val.includes('T') ? val : `${val}T00:00:00`;
                                        const d = new Date(dateStr);
                                        if (activePeriod === "year") {
                                            return d.toLocaleDateString("es", { month: "short" });
                                        }
                                        return d.toLocaleDateString("es", { day: "2-digit", month: "short" });
                                    }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fill: "#64748b" }}
                                    tickFormatter={(val) => `S/ ${val}`}
                                />
                                <RechartsTooltip
                                    contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                                    formatter={(val: any, name: string | undefined) => [
                                        formatCurrency(val || 0),
                                        name === "amount" ? "Ingresos" : "Utilidad"
                                    ]}
                                />
                                <Legend verticalAlign="top" height={36} align="right" iconType="circle" />
                                <Area
                                    name="amount"
                                    type="monotone"
                                    dataKey="amount"
                                    stroke="#4f46e5"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorSales)"
                                />
                                <Area
                                    name="margin"
                                    type="monotone"
                                    dataKey="margin"
                                    stroke="#10b981"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorMargin)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Info Column (Mobile Sidebar / Stats) */}
                <div className="md:col-span-4 space-y-6">
                    {/* Payment Methods Mix */}
                    <div className="rounded-3xl border bg-white shadow-sm p-6 overflow-hidden">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Métodos de Pago</h3>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={summary?.salesByPaymentMethod || []}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="amount"
                                        nameKey="paymentMethodName"
                                    >
                                        {(summary?.salesByPaymentMethod || []).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip
                                        formatter={(val: any) => formatCurrency(val)}
                                        contentStyle={{ borderRadius: "12px", border: "none" }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="space-y-2 mt-2">
                            {summary?.salesByPaymentMethod?.map((pm, i) => (
                                <div key={pm.paymentMethodId} className="flex justify-between items-center text-xs">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                        <span className="text-slate-600 font-medium">{pm.paymentMethodName}</span>
                                    </div>
                                    <span className="font-bold text-slate-800">{formatCurrency(pm.amount)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom Row - Bar Chart & Stock */}
                <div className="md:col-span-7 rounded-3xl border bg-white shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Package className="h-4 w-4 text-primary" />
                            Top 5 Productos por Ingresos
                        </h3>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={topProducts || []}
                                layout="vertical"
                                margin={{ left: 10, right: 30, top: 0, bottom: 0 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="productName"
                                    type="category"
                                    axisLine={false}
                                    tickLine={false}
                                    width={150}
                                    tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }}
                                />
                                <RechartsTooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: "12px", border: "none" }}
                                    formatter={(val: any) => [formatCurrency(val), "Ingresos"]}
                                />
                                <Bar dataKey="totalRevenue" radius={[0, 10, 10, 0]} barSize={25}>
                                    {(topProducts || []).map((entry, index) => (
                                        <Cell key={`bar-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.8} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="md:col-span-5 rounded-3xl border bg-white shadow-sm p-6 border-l-4 border-l-amber-400">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                            Alertas de Stock Crítico
                        </h3>
                        <Badge variant="destructive" className="rounded-full px-2">{lowStockItems.length}</Badge>
                    </div>
                    <div className="space-y-3">
                        {lowStockItems.length === 0 ? (
                            <div className="flex items-center gap-2 text-emerald-600 text-sm bg-emerald-50 p-6 rounded-3xl border border-emerald-100 justify-center flex-col text-center">
                                <CheckCircle2 className="h-8 w-8 mb-2" />
                                <span className="font-bold">Inventario Saludable</span>
                                <p className="text-[10px] opacity-70">Todos tus productos tienen stock suficiente.</p>
                            </div>
                        ) : (
                            lowStockItems.slice(0, 5).map(item => (
                                <div key={item.variantId} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors">
                                    <div className="overflow-hidden">
                                        <p className="text-xs font-bold text-slate-700 truncate">{item.productName}</p>
                                        <p className="text-[10px] text-muted-foreground font-mono italic">{item.sku}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-1 justify-end">
                                            <span className="text-xs font-black text-rose-600">{item.onHand}</span>
                                            <span className="text-[10px] text-slate-400">uds.</span>
                                        </div>
                                        <Badge className="text-[9px] h-4 px-1 leading-none" variant={item.onHand === 0 ? "destructive" : "outline"}>
                                            {item.onHand === 0 ? "AGOTADO" : "CRÍTICO"}
                                        </Badge>
                                    </div>
                                </div>
                            ))
                        )}
                        {lowStockItems.length > 5 && (
                            <p className="text-center text-[10px] text-slate-400 pt-2 font-medium cursor-pointer hover:text-primary underline">Ver todos los {lowStockItems.length} productos con alertas...</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function KpiCard({ title, value, icon, description, color = "blue" }: any) {
    const colors: any = {
        blue: "text-blue-600 bg-blue-50 border-blue-100",
        emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
        amber: "text-amber-600 bg-amber-50 border-amber-100",
        indigo: "text-indigo-600 bg-indigo-50 border-indigo-100"
    };

    return (
        <div className="group rounded-3xl border bg-white shadow-sm hover:shadow-md transition-all duration-300 p-6 flex flex-col justify-between overflow-hidden relative border-b-4 border-b-transparent hover:border-b-primary/40">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                {icon}
            </div>
            <div className="flex flex-row items-center justify-between space-y-0 pb-3">
                <h3 className="tracking-tight text-xs font-bold uppercase text-slate-500 mb-0">{title}</h3>
                <div className={`p-2 rounded-xl ${colors[color]}`}>
                    {icon}
                </div>
            </div>
            <div className="mt-2">
                <div className="text-3xl font-black text-slate-800 tracking-tighter">{value}</div>
                <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-wider">{description}</p>
            </div>
        </div>
    );
}
