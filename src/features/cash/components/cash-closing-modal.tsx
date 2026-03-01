
"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Lock, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { cashSessionsService, CashSession } from "@/features/cash/services/cash-sessions.service"
import { formatCurrency } from "@/lib/utils"
// import { useRouter } from "next/navigation" // Optional: redirect after close?

interface CashClosingModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    sessionId: string
    onSuccess: () => void
}

export function CashClosingModal({ open, onOpenChange, sessionId, onSuccess }: CashClosingModalProps) {
    const [loading, setLoading] = useState(false)
    const [sessionData, setSessionData] = useState<CashSession | null>(null)
    const [endAmount, setEndAmount] = useState("")
    const [difference, setDifference] = useState(0)

    useEffect(() => {
        if (open && sessionId) {
            loadSessionData()
        }
    }, [open, sessionId])

    const loadSessionData = async () => {
        setLoading(true)
        try {
            const data = await cashSessionsService.findOne(sessionId)
            setSessionData(data)
            // Calculate hypothetical total based on transactions?
            // Backend might not return calculated total directly, only transactions.
            // Let's assume startAmount is base.
            // We need to sum up transactions if available.
            // For MVP: Show Start Amount + Sales Total (if backend provides or we sum up)
            // If backend `findOne` includes relations, we can sum. 
            // For now, let's just show Start Amount as "Base" and ask for End Amount.
            // If we want accurate Difference, we need transactions.
            // I'll check sessionData structure later.
        } catch (error) {
            console.error(error)
            toast.error("Error al cargar datos de la sesión")
        } finally {
            setLoading(false)
        }
    }

    const handleClose = async () => {
        if (!endAmount) return toast.error("Ingrese el monto final")

        try {
            setLoading(true)
            await cashSessionsService.closeSession(sessionId, { finalAmount: Number(endAmount) })
            toast.success("Caja cerrada correctamente")
            onSuccess()
            onOpenChange(false)
        } catch (error) {
            console.error(error)
            toast.error("Error al cerrar caja")
        } finally {
            setLoading(false)
        }
    }

    const calculatedTotal = sessionData ?
        (sessionData.startAmount +
            (sessionData.transactions?.reduce((acc: number, t: any) => acc + (t.type === 'INCOME' ? t.amount : -t.amount), 0) || 0)
        ) : 0

    // Update diff when endAmount changes
    useEffect(() => {
        if (sessionData) {
            const current = Number(endAmount) || 0
            setDifference(current - calculatedTotal)
        }
    }, [endAmount, sessionData, calculatedTotal])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px] overflow-hidden p-0 border-0 shadow-2xl rounded-2xl">
                <div className="h-2 w-full bg-slate-900" />
                <DialogHeader className="px-6 pt-6 pb-2">
                    <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
                        <div className="p-2 bg-slate-100 rounded-full">
                            <Lock className="h-6 w-6 text-slate-800" />
                        </div>
                        Arqueo y Cierre de Caja
                    </DialogTitle>
                </DialogHeader>

                <div className="px-6 py-4 space-y-6">
                    {loading && !sessionData ? (
                        <div className="flex flex-col items-center justify-center p-8 space-y-4">
                            <Loader2 className="h-10 w-10 animate-spin text-slate-400" />
                            <p className="text-sm text-slate-500 font-medium animate-pulse">Calculando totales del sistema...</p>
                        </div>
                    ) : (
                        <>
                            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 font-medium">Monto Inicial (Base):</span>
                                    <span className="font-semibold text-slate-700">{formatCurrency(sessionData?.startAmount || 0)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 font-medium">Movimientos Netos:</span>
                                    {/* Placeholder for sum of sales */}
                                    <span className={`font-semibold ${(calculatedTotal - (sessionData?.startAmount || 0)) >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                                        {(calculatedTotal - (sessionData?.startAmount || 0)) >= 0 ? "+" : ""}
                                        {formatCurrency((calculatedTotal - (sessionData?.startAmount || 0)))}
                                    </span>
                                </div>
                                <div className="pt-3 mt-3 border-t border-slate-200 flex justify-between items-center">
                                    <span className="text-slate-900 font-bold uppercase tracking-wider text-xs">Total Esperado</span>
                                    <span className="font-black text-xl text-slate-900 tracking-tight">{formatCurrency(calculatedTotal)}</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="endAmount" className="text-muted-foreground uppercase text-xs font-bold tracking-wider">Monto Real Contado (En Caja)</Label>
                                <div className="relative group">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl font-bold text-slate-300">$</span>
                                    <Input
                                        id="endAmount"
                                        type="number"
                                        value={endAmount}
                                        onChange={(e) => setEndAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="h-20 pl-12 text-4xl font-black text-slate-800 focus-visible:ring-slate-900 transition-all text-center"
                                        autoComplete="off"
                                    />
                                </div>
                            </div>

                            {Number(endAmount) > 0 && Math.abs(difference) > 0.01 && (
                                <div className={`p-4 rounded-xl flex items-start gap-3 text-sm font-medium animate-in fade-in slide-in-from-bottom-2 ${difference < 0 ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                                    <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                                    <div className="flex flex-col">
                                        <span className="font-bold text-base mb-1">
                                            Diferencia detectada: {difference > 0 ? '+' : ''}{formatCurrency(difference)}
                                        </span>
                                        <span className="opacity-90 leading-tight">
                                            {difference < 0
                                                ? "Hay menos dinero en caja del registrado en el sistema. ¿Falta contabilizar algún egreso?"
                                                : "Hay más dinero en caja del esperado. ¿Falta registrar alguna venta o ingreso?"}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {Number(endAmount) > 0 && Math.abs(difference) <= 0.01 && (
                                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center gap-2 font-bold animate-in fade-in zoom-in-95">
                                    <span>✌️ ¡Caja cuadrada perfectamente!</span>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t flex gap-3">
                    <Button variant="outline" className="flex-1 h-12 text-base font-medium" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleClose} disabled={loading || !endAmount} className="flex-1 h-12 bg-slate-900 hover:bg-slate-800 text-base font-bold shadow-md hover:shadow-lg transition-all">
                        {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin text-white" /> : <Lock className="mr-2 h-4 w-4" />}
                        Confirmar Cierre
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
