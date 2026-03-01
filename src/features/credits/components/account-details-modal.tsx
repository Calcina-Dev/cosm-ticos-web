"use client";

import { useQuery } from "@tanstack/react-query";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { creditsService, CreditAccount, CreditMovement, CreditMovementType } from "@/features/credits/credits.service";
import { paymentMethodsService } from "@/features/catalogs/payment-methods.service";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Wallet, History, CreditCard, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AccountDetailsModalProps {
    account: CreditAccount;
    isOpen: boolean;
    onClose: () => void;
    defaultInvoiceId?: string;
}

export function AccountDetailsModal({ account, isOpen, onClose, defaultInvoiceId }: AccountDetailsModalProps) {
    const [amount, setAmount] = useState<string>("");
    const [methodId, setMethodId] = useState<string>("");
    const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { data: pendingInvoices } = useQuery({
        queryKey: ["pending-invoices", account.id],
        queryFn: () => creditsService.getPendingInvoices(account.id),
        enabled: isOpen && !!account.supplierId
    });

    const { data: movements, isLoading: loadingMovements, refetch: refetchMovements } = useQuery({
        queryKey: ["credit-movements", account.id],
        queryFn: () => creditsService.getMovements(account.id),
        enabled: isOpen
    });

    const { data: paymentMethods } = useQuery({
        queryKey: ["payment-methods"],
        queryFn: () => paymentMethodsService.findAll()
    });

    useEffect(() => {
        if (isOpen && defaultInvoiceId && pendingInvoices) {
            const inv = pendingInvoices.find(i => i.id === defaultInvoiceId);
            if (inv) {
                setSelectedInvoiceId(defaultInvoiceId);
                setAmount(String(inv.balance ?? inv.totalAmount));
            }
        }
    }, [isOpen, defaultInvoiceId, pendingInvoices]);

    const handleRegisterPayment = async () => {
        if (!amount || Number(amount) <= 0) return toast.error("Ingresa un monto válido");
        if (!methodId) return toast.error("Selecciona un método de pago");

        try {
            setIsSubmitting(true);
            const selectedInvoice = pendingInvoices?.find(inv => inv.id === selectedInvoiceId);
            const description = selectedInvoice
                ? `${selectedInvoice.supplierDocumentNumber || 'S/N'}`
                : "ABONO A CUENTA";

            await creditsService.registerPayment({
                accountId: account.id,
                amount: Number(amount),
                methodId,
                description,
                referenceId: selectedInvoiceId || undefined,
                referenceType: selectedInvoiceId ? 'PURCHASE_INVOICE' : undefined
            });
            toast.success("Abono registrado con éxito");
            setAmount("");
            setSelectedInvoiceId("");
            refetchMovements();
            // We don't close here to allow multiple payments or see the history update
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || "No se pudo registrar el pago");
        } finally {
            setIsSubmitting(false);
        }
    };

    const isPending = Number(account.balance) > 0;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-lg w-[95vw] max-h-[95vh] flex flex-col p-0 overflow-hidden rounded-lg border border-slate-200 shadow-2xl">
                {/* Header Compacto */}
                <DialogHeader className="p-4 bg-white border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 shrink-0">
                            <Wallet className="h-4 w-4 text-slate-500" />
                        </div>
                        <div className="min-w-0">
                            <DialogTitle className="text-sm font-bold text-slate-900 truncate">
                                {account.customer?.name || account.supplier?.name}
                            </DialogTitle>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">
                                {account.customer ? "Cliente" : "Proveedor"} • ID: {account.id.slice(0, 8)}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col items-center sm:items-end shrink-0">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Saldo Pendiente</span>
                        <div className="flex items-center gap-2">
                            {isPending && (
                                <Badge variant="destructive" className="bg-rose-50 text-rose-600 border-rose-100 h-4 px-1 text-[8px] font-bold uppercase py-0">
                                    Deuda
                                </Badge>
                            )}
                            <span className={`text-lg font-bold tracking-tight ${isPending ? "text-rose-600" : "text-emerald-600"}`}>
                                {formatCurrency(account.balance)}
                            </span>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Registro de Abono */}
                        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-sm">
                            <div className="flex items-center gap-2 text-slate-700">
                                <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                                <h3 className="text-[10px] font-bold uppercase tracking-wider">Registrar Abono</h3>
                            </div>

                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <Label htmlFor="amount" className="text-[9px] font-bold text-slate-400 uppercase">Monto</Label>
                                    <div className="relative">
                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">S/</span>
                                        <Input
                                            id="amount"
                                            type="number"
                                            placeholder="0.00"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            className="h-9 pl-8 text-sm font-bold bg-white border-slate-200"
                                        />
                                    </div>
                                </div>

                                {account.supplierId && pendingInvoices && pendingInvoices.length > 0 && (
                                    <div className="space-y-1">
                                        <Label className="text-[9px] font-bold text-slate-400 uppercase">Factura (Opcional)</Label>
                                        <Select value={selectedInvoiceId} onValueChange={(val) => {
                                            setSelectedInvoiceId(val);
                                            const inv = pendingInvoices.find(i => i.id === val);
                                            if (inv) setAmount(String(inv.balance ?? inv.totalAmount));
                                        }}>
                                            <SelectTrigger className="h-9 text-xs border-slate-200 bg-white">
                                                <SelectValue placeholder="Aplicar a factura..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none" className="text-xs font-bold text-slate-400">Ninguna (Abono general)</SelectItem>
                                                {pendingInvoices.map(inv => (
                                                    <SelectItem key={inv.id} value={inv.id} className="text-xs">
                                                        {inv.supplierDocumentNumber || 'S/N'} - Saldo: {formatCurrency(inv.balance ?? inv.totalAmount)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                <div className="space-y-1">
                                    <Label className="text-[9px] font-bold text-slate-400 uppercase">Método</Label>
                                    <Select value={methodId} onValueChange={setMethodId}>
                                        <SelectTrigger className="h-9 text-xs border-slate-200 bg-white">
                                            <SelectValue placeholder="Seleccionar..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {paymentMethods?.filter(pm => {
                                                if (!pm.isActive) return false;
                                                // Si es proveedor, solo mostrar Efectivo
                                                if (account.supplierId) return pm.code === 'CASH';
                                                return true;
                                            }).map(pm => (
                                                <SelectItem key={pm.id} value={pm.id} className="text-xs">
                                                    {pm.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Button
                                    className="w-full h-9 font-bold text-xs shadow-sm mt-1"
                                    onClick={handleRegisterPayment}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? "Procesando..." : "Confirmar Pago"}
                                </Button>
                            </div>
                        </div>

                        {/* Línea de Crédito */}
                        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                                <CreditCard className="h-3.5 w-3.5 text-blue-500" />
                                <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Estado Crédito</h4>
                            </div>

                            <div className="space-y-2.5">
                                <div className="flex justify-between items-center text-[10px]">
                                    <span className="text-slate-500 font-medium">Límite:</span>
                                    <span className="font-bold text-slate-700">{formatCurrency(account.creditLimit)}</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px]">
                                    <span className="text-slate-500 font-medium">Uso:</span>
                                    <span className="font-bold text-rose-500">{formatCurrency(account.balance)}</span>
                                </div>
                                <div className="pt-2 border-t border-slate-50">
                                    <div className="flex justify-between items-center mb-1.5">
                                        <span className="text-[9px] font-bold uppercase text-slate-400">Disponible</span>
                                        <span className="text-xs font-bold text-emerald-600">
                                            {formatCurrency(Number(account.creditLimit) - Number(account.balance))}
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                                        <div
                                            className="bg-emerald-500 h-full rounded-full transition-all duration-700"
                                            style={{ width: `${Math.max(0, Math.min(100, (1 - Number(account.balance) / (Number(account.creditLimit) || 1)) * 100))}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Historial de Movimientos */}
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
                        <div className="p-3 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <History className="h-3.5 w-3.5 text-slate-400" />
                                <h3 className="font-bold text-slate-700 text-[10px] uppercase tracking-wider">Últimos Movimientos</h3>
                            </div>
                            <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                                {movements?.length || 0} Reg.
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                                        <TableHead className="text-[9px] font-bold uppercase text-slate-400 h-8 px-3">Fecha</TableHead>
                                        <TableHead className="text-[9px] font-bold uppercase text-slate-400 h-8">Referencia</TableHead>
                                        <TableHead className="text-[9px] font-bold uppercase text-slate-400 h-8 text-center">Tipo</TableHead>
                                        <TableHead className="text-[9px] font-bold uppercase text-slate-400 h-8 text-right px-3">Importe</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loadingMovements ? (
                                        <TableRow><TableCell colSpan={3} className="text-center py-6 font-bold text-slate-300 text-[9px] uppercase">Cargando...</TableCell></TableRow>
                                    ) : movements?.length === 0 ? (
                                        <TableRow><TableCell colSpan={3} className="text-center py-6 text-slate-300 text-[9px] uppercase italic">Sin registros</TableCell></TableRow>
                                    ) : [...(movements || [])].reverse().map((m) => (
                                        <TableRow key={m.id} className="hover:bg-slate-50/50 border-slate-50">
                                            <TableCell className="px-3 py-2">
                                                <span className="text-[10px] font-bold text-slate-600 whitespace-nowrap">{formatDate(m.createdAt)}</span>
                                            </TableCell>
                                            <TableCell className="py-2">
                                                <span className="text-[9px] text-slate-500 font-medium line-clamp-1 max-w-[150px]" title={m.description || ""}>
                                                    {m.description || "-"}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-2 text-center">
                                                <Badge
                                                    variant="outline"
                                                    className={`text-[8px] font-bold uppercase py-0 px-1 border-none shadow-none ${m.type === CreditMovementType.PAYMENT ? "text-emerald-600" : "text-rose-500"}`}
                                                >
                                                    {m.type === CreditMovementType.CHARGE ? "Cargo" : "Abono"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className={`px-3 py-2 text-right font-bold text-[10px] tabular-nums whitespace-nowrap ${m.type === CreditMovementType.PAYMENT ? "text-emerald-600" : "text-slate-800"}`}>
                                                {m.type === CreditMovementType.PAYMENT ? "− " : "+ "}{formatCurrency(m.amount)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-3 bg-white border-t border-slate-100 flex flex-row items-center justify-between px-4 shrink-0">
                    <p className="text-[8px] font-bold text-slate-400 uppercase italic">
                        * Los abonos registran entrada en caja.
                    </p>
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="font-bold text-slate-500 h-7 px-3 text-[10px]"
                    >
                        Cerrar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
