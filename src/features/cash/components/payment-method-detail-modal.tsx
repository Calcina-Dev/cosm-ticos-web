import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CashTransaction } from "@/features/cash/services/cash-sessions.service"
import { formatCurrency } from "@/lib/utils"
import { ArrowDownCircle, ArrowUpCircle, CreditCard, Receipt } from "lucide-react"
import { useMemo } from "react"

interface PaymentMethodDetailModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    methodName: string
    transactions: CashTransaction[]
}

export function PaymentMethodDetailModal({
    open,
    onOpenChange,
    methodName,
    transactions,
}: PaymentMethodDetailModalProps) {

    // Filter and calculate totals based on the selected method
    const { filteredTransactions, ingresos, egresos } = useMemo(() => {
        let ingresosNum = 0
        let egresosNum = 0

        const isCashMethod = methodName.toLowerCase() === 'efectivo'

        const filtered = transactions.filter(tx => {
            // Un abono/venta en Efectivo estricto NO tiene paréntesis descriptivos
            // Ocasionalmente podría tener "(Efectivo)" explícito proviniendo de alguna devolución manual
            const hasMethodInDesc = tx.description?.toLowerCase().includes(`(${methodName.toLowerCase()})`)
            const isPureCash = !tx.description?.match(/\((.*?)\)/)

            const matchesMethod = isCashMethod ? (isPureCash || hasMethodInDesc) : hasMethodInDesc

            if (matchesMethod) {
                if (tx.type === 'INCOME') ingresosNum += Number(tx.amount)
                if (tx.type === 'EXPENSE') egresosNum += Number(tx.amount)
            }

            return matchesMethod
        })

        return {
            filteredTransactions: filtered,
            ingresos: ingresosNum,
            egresos: egresosNum
        }
    }, [transactions, methodName])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] overflow-hidden p-0 border-0 shadow-2xl rounded-2xl bg-white">
                <div className="h-2 w-full bg-slate-800" />
                <DialogHeader className="px-6 pt-6 pb-2">
                    <div className="flex items-center gap-3">
                        <div className="bg-slate-100 p-3 rounded-xl border border-slate-200">
                            <CreditCard className="h-6 w-6 text-slate-700" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-black text-slate-800 uppercase tracking-tight">
                                Detalle: {methodName}
                            </DialogTitle>
                            <p className="text-sm text-slate-500 font-medium">Movimientos de caja asociados a este método de pago</p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="px-6 py-4">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                            <p className="text-xs uppercase font-bold text-emerald-600 tracking-wider mb-1">Ingresos</p>
                            <p className="text-2xl font-black text-emerald-700">+{formatCurrency(ingresos)}</p>
                        </div>
                        <div className="bg-rose-50 rounded-xl p-4 border border-rose-100">
                            <p className="text-xs uppercase font-bold text-rose-600 tracking-wider mb-1">Egresos / Devoluciones</p>
                            <p className="text-2xl font-black text-rose-700">-{formatCurrency(egresos)}</p>
                        </div>
                    </div>

                    {/* Transactions Table Container */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[400px] overflow-y-auto">
                        <Table>
                            <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                                <TableRow>
                                    <TableHead className="font-bold text-slate-600 w-[100px]">Hora</TableHead>
                                    <TableHead className="font-bold text-slate-600 w-[120px]">Tipo</TableHead>
                                    <TableHead className="font-bold text-slate-600">Descripción</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-right">Monto</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTransactions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-32 text-center">
                                            <div className="flex flex-col items-center justify-center text-slate-400 space-y-2">
                                                <Receipt className="h-8 w-8 text-slate-300 opacity-50" />
                                                <p className="text-sm font-medium">No se encontraron movimientos específicos.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredTransactions.map(tx => (
                                        <TableRow key={tx.id} className="hover:bg-slate-50/80 cursor-default">
                                            <TableCell className="text-slate-500 font-medium text-xs">
                                                {tx.createdAt ? new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                            </TableCell>
                                            <TableCell>
                                                {tx.type === 'INCOME' ? (
                                                    <div className="inline-flex items-center px-2 py-0.5 rounded text-emerald-700 bg-emerald-50 text-[10px] font-bold uppercase tracking-wider">
                                                        <ArrowUpCircle className="mr-1.5 h-3 w-3" /> Ingreso
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex items-center px-2 py-0.5 rounded text-rose-700 bg-rose-50 text-[10px] font-bold uppercase tracking-wider">
                                                        <ArrowDownCircle className="mr-1.5 h-3 w-3" /> Egreso
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm text-slate-700 max-w-[200px] truncate" title={tx.description}>
                                                {tx.description}
                                            </TableCell>
                                            <TableCell className={`text-right font-black ${tx.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
