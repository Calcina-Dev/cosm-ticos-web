"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import {
    Loader2, Eye, FileText, Search, X, ChevronLeft, ChevronRight
} from "lucide-react";
import { salesService } from "../sales.service";
import { toast } from "sonner";
import { SaleDetailsModal } from "./sale-details-modal";
import { useDebounce } from "@/hooks/use-debounce";
import { useSearchParams } from "next/navigation";

const STATUS_OPTIONS = [
    { value: "ALL", label: "Todos los estados" },
    { value: "CONFIRMED", label: "Confirmada (activa)" },
    { value: "RETURNED", label: "Devuelta" },
    { value: "CANCELLED", label: "Anulada" },
];

const DOC_TYPE_OPTIONS = [
    { value: "ALL", label: "Todos los tipos" },
    { value: "NOTA_VENTA", label: "Venta (NV01)" },
    { value: "NOTA_CREDITO", label: "Nota de Crédito (DV01)" },
];

const DOC_TYPE_BADGE: Record<string, React.ReactNode> = {
    NOTA_VENTA: <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-mono">VENTA</Badge>,
    NOTA_CREDITO: <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-mono">N. CRÉDITO</Badge>,
};

const STATUS_BADGE: Record<string, React.ReactNode> = {
    COMPLETED: <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100/80 text-[10px]">COMPLETADA</Badge>,
    CONFIRMED: <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100/80 text-[10px]">CONFIRMADA</Badge>,
    PENDING: <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80 text-[10px]">PENDIENTE</Badge>,
    RETURNED: <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100/80 text-[10px]">DEVUELTA</Badge>,
    CANCELLED: <Badge variant="destructive" className="text-[10px]">ANULADA</Badge>,
};

const PAGE_LIMIT = 20;

export function SalesList() {
    const searchParams = useSearchParams();
    const [sales, setSales] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState(searchParams.get("search") || "");
    const [status, setStatus] = useState("ALL");
    const [docType, setDocType] = useState("ALL");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [selectedSale, setSelectedSale] = useState<any | null>(null);

    useEffect(() => {
        const urlSearch = searchParams.get("search");
        if (urlSearch !== null) setSearch(urlSearch);
    }, [searchParams]);

    const debouncedSearch = useDebounce(search, 350);

    const fetchSales = useCallback(async (p: number, q: string, st: string, dt: string, fd: string, td: string) => {
        setLoading(true);
        try {
            const res = await salesService.findAll({
                limit: PAGE_LIMIT,
                page: p,
                search: q || undefined,
                status: st !== "ALL" ? st : undefined,
                documentType: dt !== "ALL" ? dt : undefined,
                fromDate: fd || undefined,
                toDate: td || undefined,
            });
            setSales(res.items);
            setTotal(res.meta.total);
        } catch (err) {
            console.error(err);
            toast.error("Error al cargar el historial de ventas");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { setPage(1); }, [debouncedSearch, status, docType, fromDate, toDate]);

    useEffect(() => {
        fetchSales(page, debouncedSearch, status, docType, fromDate, toDate);
    }, [page, debouncedSearch, status, docType, fromDate, toDate, fetchSales]);

    const totalPages = Math.ceil(total / PAGE_LIMIT);
    const hasFilters = search || status !== "ALL" || docType !== "ALL" || fromDate || toDate;

    const clearFilters = () => { setSearch(""); setStatus("ALL"); setDocType("ALL"); setFromDate(""); setToDate(""); };

    return (
        <div className="space-y-4">
            {/* ── Filter Bar ── */}
            <div className="flex flex-col gap-3">
                {/* Row 1: buscador + estado */}
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Buscador */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por cliente, comprobante, producto o vendedor..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-9 pr-8"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Filtros: estado + tipo comprobante */}
                    <div className="flex flex-col sm:flex-row gap-2">
                        <select
                            value={status}
                            onChange={e => setStatus(e.target.value)}
                            className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                            {STATUS_OPTIONS.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                        <select
                            value={docType}
                            onChange={e => setDocType(e.target.value)}
                            className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                            {DOC_TYPE_OPTIONS.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </div>
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

            {/* ── Resumen ── */}
            <p className="text-xs text-muted-foreground">
                {loading ? "Cargando..." : `${total} venta${total !== 1 ? "s" : ""} encontrada${total !== 1 ? "s" : ""}`}
            </p>

            {/* ── Tabla ── */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead>Fecha</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Comprobante</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Vendedor</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Total Neto</TableHead>
                            <TableHead className="text-right">Total Pagado</TableHead>
                            <TableHead className="text-right">Deuda Pendiente</TableHead>
                            <TableHead className="text-center">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={10} className="h-64 text-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
                                    <p className="text-sm text-muted-foreground mt-2">Cargando...</p>
                                </TableCell>
                            </TableRow>
                        ) : sales.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={10} className="h-48 text-center text-muted-foreground">
                                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                    No se encontraron ventas.
                                </TableCell>
                            </TableRow>
                        ) : (
                            sales.map((sale) => (
                                <TableRow key={sale.id} className="cursor-default hover:bg-muted/30 transition-colors">
                                    {/* Fecha */}
                                    <TableCell className="font-medium text-sm whitespace-nowrap">
                                        {new Date(sale.createdAt).toLocaleString("es-PE", {
                                            day: "2-digit", month: "short", year: "numeric",
                                            hour: "2-digit", minute: "2-digit",
                                        })}
                                    </TableCell>

                                    {/* Tipo de comprobante */}
                                    <TableCell>
                                        {DOC_TYPE_BADGE[sale.documentType] ?? (
                                            <Badge variant="outline" className="text-[10px] font-mono">{sale.documentType ?? "-"}</Badge>
                                        )}
                                    </TableCell>

                                    {/* Comprobante */}
                                    <TableCell>
                                        {sale.documentSeries && sale.documentNumber != null ? (
                                            <span className="font-mono text-sm text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                                                {sale.documentSeries}-{String(sale.documentNumber).padStart(6, "0")}
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground text-xs font-mono">S/N</span>
                                        )}
                                    </TableCell>

                                    {/* Cliente */}
                                    <TableCell>
                                        {sale.customer ? (
                                            <div>
                                                <p className="font-medium text-sm text-slate-700">{sale.customer.name}</p>
                                                <p className="text-xs text-muted-foreground">{sale.customer.identityDoc}</p>
                                            </div>
                                        ) : (
                                            <span className="text-sm italic text-slate-400">Público General</span>
                                        )}
                                    </TableCell>

                                    {/* Vendedor */}
                                    <TableCell>
                                        <span className="text-xs text-slate-600 font-mono">
                                            {sale.user?.email?.split("@")[0] ?? "—"}
                                        </span>
                                    </TableCell>

                                    {/* Estado */}
                                    <TableCell>
                                        {STATUS_BADGE[sale.status] ?? (
                                            <Badge variant="secondary" className="text-[10px]">{sale.status}</Badge>
                                        )}
                                    </TableCell>

                                    {/* Total */}
                                    <TableCell className="text-right font-black text-slate-700">
                                        {formatCurrency(sale.totalAmount)}
                                    </TableCell>

                                    {/* Total Pagado */}
                                    <TableCell className="text-right font-medium text-emerald-600">
                                        {formatCurrency(sale.totalPaid ?? 0)}
                                    </TableCell>

                                    {/* Deuda Pendiente */}
                                    <TableCell className="text-right font-medium text-rose-600">
                                        {formatCurrency(sale.debtRemaining ?? 0)}
                                    </TableCell>

                                    {/* Acciones */}
                                    <TableCell className="text-center">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 hover:bg-primary/10 hover:text-primary transition-colors"
                                            onClick={() => setSelectedSale(sale)}
                                        >
                                            <Eye className="h-4 w-4 mr-1.5" />
                                            Auditar
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* ── Paginación ── */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between pt-1">
                    <span className="text-sm text-muted-foreground">
                        Página {page} de {totalPages}
                    </span>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline" size="sm"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1 || loading}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Anterior
                        </Button>
                        <Button
                            variant="outline" size="sm"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages || loading}
                        >
                            Siguiente
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* ── Modal de Detalle ── */}
            {selectedSale && (
                <SaleDetailsModal
                    sale={selectedSale}
                    open={!!selectedSale}
                    onOpenChange={(op: boolean) => !op && setSelectedSale(null)}
                    onSuccess={() => fetchSales(page, debouncedSearch, status, docType, fromDate, toDate)}
                />
            )}
        </div>
    );
}
