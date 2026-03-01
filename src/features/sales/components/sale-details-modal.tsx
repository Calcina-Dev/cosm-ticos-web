"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";
import { Loader2, Printer, Ban, Redo, Receipt, AlertCircle, Map, Lock, Shield } from "lucide-react";
import { salesService } from "../sales.service";
import { toast } from "sonner";
import { useAuthStore } from "@/features/auth/auth.store";
import { generateTicket } from "@/lib/pdf-generator";
import { useQuery } from "@tanstack/react-query";
import { documentFlowService, DocumentType } from "@/features/dashboard/document-flow.service";
import dynamic from "next/dynamic";

const DocumentFlowCanvas = dynamic(() => import("@/features/dashboard/components/DocumentFlowCanvas"), {
    ssr: false,
    loading: () => <div className="h-[400px] w-full flex items-center justify-center bg-slate-50 rounded-xl border border-dashed">
        <Loader2 className="h-8 w-8 animate-spin text-primary/30" />
    </div>
});

// ... (dentro de Props)
interface Props {
    sale: any;
    open: boolean;
    onOpenChange: (op: boolean) => void;
    onSuccess: () => void;
}

function FlowContainer({ saleId }: { saleId: string }) {
    const { data: flow, isLoading } = useQuery({
        queryKey: ["document-flow", saleId],
        queryFn: () => documentFlowService.getFlow(saleId, DocumentType.SALE),
    });

    if (isLoading) return <div className="h-[400px] w-full flex items-center justify-center bg-slate-50 rounded-xl border border-dashed">
        <Loader2 className="h-8 w-8 animate-spin text-primary/30" />
    </div>;

    return <DocumentFlowCanvas initialNodes={flow?.nodes || []} initialEdges={flow?.edges || []} />;
}

export function SaleDetailsModal({ sale, open, onOpenChange, onSuccess }: Props) {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [action, setAction] = useState<"view" | "cancel" | "return" | "flow">("view");
    const [reason, setReason] = useState("");
    const [supervisorPin, setSupervisorPin] = useState("");
    const [returnToStock, setReturnToStock] = useState(true);

    const handlePrint = () => {
        try {
            const ticketItems = sale.lines?.map((line: any) => ({
                quantity: line.quantity,
                name: `${line.variant?.product?.name} ${line.variant?.product?.nameKey ? `- ${line.variant.product.nameKey}` : ''}`,
                price: Number(line.price),
                total: Number(line.subtotal)
            })) || [];

            generateTicket({
                companyName: user?.companyName || "SaaS POS",
                companyAddress: "Av. Principal 123",
                companyRuc: "20100000001",
                documentType: sale.documentType,
                documentNumber: `${sale.documentSeries}-${String(sale.documentNumber).padStart(6, '0')}`,
                date: new Date(sale.createdAt),
                customerName: sale.customer?.name || "Público General",
                customerDoc: sale.customer?.identityDoc,
                user: user?.name || "Cajero",
                items: ticketItems,
                subtotal: Number(sale.subtotal),
                tax: Number(sale.totalTax),
                total: Number(sale.totalAmount),
            });
        } catch (error) {
            console.error("Error generating ticket:", error);
            toast.error("No se pudo generar el ticket PDF. Verifica los datos de la venta.");
        }
    };

    const handleVoid = async () => {
        if (!reason || reason.length < 5) return toast.error("Ingresa un motivo válido");

        setLoading(true);
        try {
            await salesService.cancel(sale.id, {
                reason,
                supervisorPin: supervisorPin || undefined
            });
            toast.success("Venta ANULADA permanentemente.");
            onSuccess();
            onOpenChange(false);
            setSupervisorPin("");
        } catch (error: any) {
            console.error(error);
            const message = error.response?.data?.message || "Error al anular la venta";
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleReturn = async () => {
        if (!reason || reason.length < 5) return toast.error("Ingresa el motivo de devolución");

        setLoading(true);
        try {
            // Asumimos que la lista general (o details) trae `lines`.
            // En caso falte en el GET /sales, el endpoint del backend /return igual lo procesará 
            // siempre y cuando le pasemos el array. Enviamos [] dummy si no tenemos control de lineas individual en Front, 
            // el backend (NestJS) reversará la venta completa por defecto al ser RETURN total.
            await salesService.returnSale(sale.id, {
                reason,
                returnToStock,
                items: sale.lines?.map((l: any) => ({ saleLineId: l.id, quantity: l.quantity })) || []
            });
            toast.success("Productos devueltos exitosamente.");
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast.error("Error al procesar devolución");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(op) => {
            if (!op) setAction("view"); // Reset action on close
            onOpenChange(op);
        }}>
            <DialogContent className="sm:max-w-[800px]">
                <DialogHeader>
                    <DialogTitle className="flex justify-between items-center mr-4">
                        <div className="flex items-center gap-2">
                            <Receipt className="h-5 w-5 text-muted-foreground" />
                            {sale.documentType || 'Venta'} {sale.documentSeries || ''}-{sale.documentNumber ? String(sale.documentNumber).padStart(6, '0') : '000000'}
                        </div>
                        {sale.status === "CONFIRMED" && <Badge className="bg-blue-100 text-blue-800 text-xs">CONFIRMADA</Badge>}
                        {sale.status === "CANCELLED" && <Badge variant="destructive">ANULADA</Badge>}
                        {sale.status === "RETURNED" && <Badge className="bg-amber-100 text-amber-800">DEVUELTA</Badge>}
                    </DialogTitle>
                </DialogHeader>

                {action === "view" && (
                    <div className="space-y-6 py-2">
                        {/* Cabecera Datos */}
                        <div className="grid grid-cols-2 gap-4 bg-muted/20 p-4 rounded-lg border">
                            <div>
                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">Cliente</p>
                                <p className="font-medium text-sm text-slate-700">{sale.customer?.name || "C. Final"}</p>
                                <p className="text-xs text-muted-foreground">{sale.customer?.identityDoc || ""}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">Fecha</p>
                                <p className="font-medium text-sm text-slate-700">
                                    {new Date(sale.createdAt).toLocaleString("es-PE")}
                                </p>
                            </div>
                        </div>

                        {/* Listado de Productos */}
                        <div>
                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-3">Detalle de Productos</p>
                            <div className="max-h-48 overflow-y-auto space-y-2 border rounded-md p-2 bg-slate-50">
                                {sale.lines?.map((line: any) => (
                                    <div key={line.id} className="flex justify-between text-sm items-center py-2 px-3 bg-white border rounded-md">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-slate-800">
                                                {line.variant?.product?.name}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                Cant: {line.quantity} × {formatCurrency(line.price)}
                                            </span>
                                        </div>
                                        <span className="font-bold text-slate-700">
                                            {formatCurrency(line.subtotal)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Pagos Realizados */}
                        <div>
                            <div className="flex justify-between bg-emerald-50 text-emerald-900 p-3 rounded-lg border border-emerald-100 mt-4">
                                <span className="font-bold">Total Pagado</span>
                                <span className="font-black text-lg">{formatCurrency(sale.totalAmount)}</span>
                            </div>
                        </div>

                        {/* Acciones Footer */}
                        <div className="flex gap-2 justify-end pt-4 border-t">
                            <Button variant="outline" onClick={handlePrint}>
                                <Printer className="h-4 w-4 mr-2" /> Ticket PDF
                            </Button>
                            <Button variant="outline" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50" onClick={() => setAction("flow")}>
                                <Map className="h-4 w-4 mr-2" /> Trazabilidad
                            </Button>
                            {/* Solo ventas CONFIRMED de tipo NOTA_VENTA pueden cancelarse o devolverse */}
                            {sale.status === "CONFIRMED" && sale.documentType !== "NOTA_CREDITO" && (
                                <>
                                    <Button variant="outline" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50" onClick={() => setAction("return")}>
                                        <Redo className="h-4 w-4 mr-2" /> Devolución
                                    </Button>
                                    <Button variant="destructive" onClick={() => setAction("cancel")}>
                                        <Ban className="h-4 w-4 mr-2" /> Anular
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* VIEW FLOW */}
                {action === "flow" && (
                    <div className="space-y-4 py-2 animate-in fade-in slide-in-from-right-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Map className="h-5 w-5 text-indigo-500" />
                                <h3 className="font-bold text-slate-800">Mapa de Trazabilidad</h3>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setAction("view")}>Atrás</Button>
                        </div>

                        <FlowContainer saleId={sale.id} />

                        <p className="text-[10px] text-muted-foreground text-center italic">
                            * Este mapa muestra el origen y destino de esta operación comercial.
                        </p>
                    </div>
                )}

                {/* FORM CANCEL */}
                {action === "cancel" && (
                    <div className="space-y-4 py-4 animate-in fade-in slide-in-from-right-4">
                        <div className="flex bg-rose-50 border border-rose-100 p-4 rounded-lg items-start gap-3 text-rose-800">
                            <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
                            <div className="text-sm">
                                <p className="font-bold mb-1">Anulación Destructiva</p>
                                <p>Revertirá el ingreso de <b>{formatCurrency(sale.totalAmount)}</b> y regresará los productos a sus almacenes de origen.</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-slate-500">Motivo de Anulación</label>
                                <Textarea
                                    placeholder="Ej: Cliente se arrepintió, error en cobro..."
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="resize-none"
                                />
                            </div>

                            <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <Shield className="h-4 w-4 text-indigo-500" />
                                    <label className="text-xs font-bold uppercase text-slate-700">Autorización (Opcional)</label>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        type="password"
                                        inputMode="numeric"
                                        maxLength={4}
                                        placeholder="PIN de Supervisor"
                                        className="pl-9 h-10 rounded-xl"
                                        value={supervisorPin}
                                        onChange={(e) => setSupervisorPin(e.target.value.replace(/\D/g, ""))}
                                    />
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-2 italic">
                                    * Requerido si la caja está cerrada o no tienes permisos de anulación.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2 justify-end pt-4 border-t mt-4">
                            <Button variant="ghost" onClick={() => setAction("view")} disabled={loading}> Atrás </Button>
                            <Button variant="destructive" onClick={handleVoid} disabled={loading}>
                                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Ban className="h-4 w-4 mr-2" />}
                                Confirmar Anulación
                            </Button>
                        </div>
                    </div>
                )}

                {/* FORM RETURN */}
                {action === "return" && (
                    <div className="space-y-4 py-4 animate-in fade-in slide-in-from-right-4">
                        <div className="flex bg-amber-50 border border-amber-100 p-4 rounded-lg items-start gap-3 text-amber-800">
                            <Redo className="h-5 w-5 mt-0.5 shrink-0" />
                            <div className="text-sm">
                                <p className="font-bold mb-1">Devolución de Productos</p>
                                <p>Esta acción emite una nota de devolución y reversa contablemente la venta por <b>{formatCurrency(sale.totalAmount)}</b>.</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 py-2 border-b">
                            <Switch
                                id="stock-return"
                                checked={returnToStock}
                                onCheckedChange={setReturnToStock}
                            />
                            <Label htmlFor="stock-return" className="font-medium">
                                Devolver artículos físicamente al Inventario (Sumar al stock)
                            </Label>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-slate-500">Motivo de Devolución</label>
                            <Textarea
                                placeholder="Ej: Producto dañado, cambio por otra talla..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="resize-none"
                                rows={2}
                            />
                        </div>

                        <div className="flex gap-2 justify-end pt-4 border-t mt-4">
                            <Button variant="ghost" onClick={() => setAction("view")} disabled={loading}> Atrás </Button>
                            <Button className="bg-amber-600 hover:bg-amber-700" onClick={handleReturn} disabled={loading}>
                                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Redo className="h-4 w-4 mr-2" />}
                                Procesar Devolución
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
