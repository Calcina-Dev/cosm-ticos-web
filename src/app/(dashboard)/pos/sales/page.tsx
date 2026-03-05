"use client";

import { SalesList } from "@/features/sales/components/sales-list";

export default function SalesHistoryPage() {
    return (
        <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                    Historial de Ventas
                </h1>
                <p className="text-muted-foreground text-sm">
                    Revisa las ventas emitidas desde el Punto de Venta (POS), audita tickets, y gestiona anulaciones o devoluciones con retorno a inventario.
                </p>
            </div>

            <div className="bg-card w-full rounded-2xl border shadow-sm p-4">
                <SalesList />
            </div>
        </div>
    );
}
