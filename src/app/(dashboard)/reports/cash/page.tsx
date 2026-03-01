"use client";

import { useQuery } from "@tanstack/react-query";
import { reportsService } from "@/features/dashboard/reports.service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
    DollarSign,
    Calendar,
    ArrowUpCircle,
    ArrowDownCircle,
    History,
    Search,
    Filter
} from "lucide-react";
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

export default function CashReportPage() {
    const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    const { data: sessionsSummary, isLoading: isLoadingSessions } = useQuery({
        queryKey: ["reports", "cash-sessions", startDate, endDate],
        queryFn: () => reportsService.getCashSessionsSummary({ startDate, endDate })
    });

    const { data: transactionsReport, isLoading: isLoadingTransactions } = useQuery({
        queryKey: ["reports", "cash-transactions", startDate, endDate],
        queryFn: () => reportsService.getCashTransactions({ startDate, endDate })
    });

    const sessions = sessionsSummary?.sessions || [];
    const summary = transactionsReport?.summary || { totalIncome: 0, totalExpense: 0, netCash: 0 };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Header & Filters */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="bg-amber-100 p-2 rounded-xl">
                            <DollarSign className="h-6 w-6 text-amber-600" />
                        </div>
                        <h2 className="text-3xl font-black tracking-tighter text-slate-800">Reporte de Caja</h2>
                    </div>
                    <p className="text-muted-foreground">Historial de sesiones, ingresos, egresos y control de arqueos.</p>
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
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-sm border-l-4 border-l-emerald-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-slate-500 uppercase">Total Ingresos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black tracking-tighter text-emerald-600">
                            {formatCurrency(summary.totalIncome)}
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                            <ArrowUpCircle className="h-3 w-3 text-emerald-500" />
                            <span>Ventas + Abonos + Entradas manuales</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm border-l-4 border-l-rose-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-slate-500 uppercase">Total Egresos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black tracking-tighter text-rose-600">
                            {formatCurrency(summary.totalExpense)}
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                            <ArrowDownCircle className="h-3 w-3 text-rose-500" />
                            <span>Gastos + Compras + Salidas manuales</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm border-l-4 border-l-amber-500 bg-amber-50/30">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-slate-500 uppercase">Balance de Efectivo</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black tracking-tighter text-slate-800">
                            {formatCurrency(summary.netCash)}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1 italic">Diferencia entre flujo entrante y saliente</p>
                    </CardContent>
                </Card>
            </div>

            {/* Session History Table */}
            <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50/50">
                    <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5 text-amber-500" />
                        Historial de Sesiones de Caja
                    </CardTitle>
                </CardHeader>
                <Table>
                    <TableHeader>
                        <TableRow className="border-none bg-slate-50/50">
                            <TableHead className="font-bold uppercase text-[10px]">Caja / Usuario</TableHead>
                            <TableHead className="font-bold uppercase text-[10px]">Apertura</TableHead>
                            <TableHead className="font-bold uppercase text-[10px]">Cierre</TableHead>
                            <TableHead className="text-right font-bold uppercase text-[10px]">Inicial</TableHead>
                            <TableHead className="text-right font-bold uppercase text-[10px]">Final/Esperado</TableHead>
                            <TableHead className="text-right font-bold uppercase text-[10px]">Estado</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoadingSessions ? (
                            <TableRow><TableCell colSpan={6} className="text-center py-10">Cargando sesiones...</TableCell></TableRow>
                        ) : sessions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-20 text-slate-400 opacity-50">
                                    No hay sesiones registradas en este periodo.
                                </TableCell>
                            </TableRow>
                        ) : sessions.map(session => (
                            <TableRow key={session.sessionId}>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-xs">{session.registerName}</span>
                                        <span className="text-[10px] text-muted-foreground uppercase">{session.userName}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-xs">{formatDate(session.startTime)}</TableCell>
                                <TableCell className="text-xs">{session.endTime ? formatDate(session.endTime) : '-'}</TableCell>
                                <TableCell className="text-right font-medium text-xs">{formatCurrency(session.startAmount)}</TableCell>
                                <TableCell className="text-right font-bold text-xs">
                                    <div className="flex flex-col">
                                        <span>{formatCurrency(session.endAmount || 0)}</span>
                                        <span className="text-[9px] text-muted-foreground font-normal">Sugerido: {formatCurrency(session.expectedBalance)}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Badge variant={session.status === 'OPEN' ? 'secondary' : 'default'} className="text-[9px] font-black uppercase tracking-tighter">
                                        {session.status === 'OPEN' ? 'Abierta' : 'Cerrada'}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>


            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 text-amber-800">
                <Calendar className="h-5 w-5 shrink-0" />
                <div className="text-sm">
                    <p className="font-bold">Consejo de Gestión</p>
                    <p className="opacity-80">Recuerda realizar arqueos ciegos periódicamente para asegurar que los saldos reales coincidan con los reportados por el sistema.</p>
                </div>
            </div>
        </div>
    );
}
