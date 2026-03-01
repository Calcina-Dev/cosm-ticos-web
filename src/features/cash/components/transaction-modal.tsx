"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, ArrowUpCircle, ArrowDownCircle } from "lucide-react"
import { toast } from "sonner"
import { cashTransactionsService } from "@/features/cash/services/cash-transactions.service"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

const formSchema = z.object({
    type: z.enum(["INCOME", "EXPENSE"]),
    amount: z.coerce.number().min(0.01, "El monto debe ser mayor a 0"),
    description: z.string().min(3, "La descripción es obligatoria"),
})

interface TransactionModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

export function TransactionModal({ open, onOpenChange, onSuccess }: TransactionModalProps) {
    const [loading, setLoading] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            type: "EXPENSE",
            amount: 0,
            description: "",
        },
    })

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setLoading(true)
        try {
            await cashTransactionsService.create({
                type: values.type,
                amount: values.amount,
                description: values.description,
            })
            toast.success("Movimiento registrado correctamente")
            form.reset()
            onSuccess?.()
            onOpenChange(false)
        } catch (error: any) {
            console.error(error)
            toast.error(error.response?.data?.message || "Error al registrar movimiento")
        } finally {
            setLoading(false)
        }
    }

    const type = form.watch("type")

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px] overflow-hidden p-0 border-0 shadow-2xl rounded-2xl">
                <div className={`h-2 w-full ${type === "EXPENSE" ? "bg-rose-500" : "bg-emerald-500"}`} />
                <DialogHeader className="px-6 pt-6 pb-2">
                    <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
                        {type === "INCOME" ? (
                            <div className="p-2 bg-emerald-100 rounded-full">
                                <ArrowUpCircle className="h-6 w-6 text-emerald-600" />
                            </div>
                        ) : (
                            <div className="p-2 bg-rose-100 rounded-full">
                                <ArrowDownCircle className="h-6 w-6 text-rose-600" />
                            </div>
                        )}
                        Registrar Movimiento
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 pb-6 space-y-6">
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-muted-foreground uppercase text-xs font-bold tracking-wider">Tipo de Movimiento</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="h-12 text-base font-medium border-slate-200">
                                                <SelectValue placeholder="Seleccione tipo" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="INCOME" className="font-medium text-emerald-700 focus:bg-emerald-50">Ingreso (Entrada de Dinero)</SelectItem>
                                            <SelectItem value="EXPENSE" className="font-medium text-rose-700 focus:bg-rose-50">Egreso (Gasto / Salida)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                    <FormLabel className="text-muted-foreground uppercase text-xs font-bold tracking-wider">Monto a Registrar</FormLabel>
                                    <FormControl>
                                        <div className="relative group">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400">$</span>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                className={`h-16 pl-10 text-3xl font-black transition-all ${type === "EXPENSE" ? "text-rose-600 focus-visible:ring-rose-500" : "text-emerald-600 focus-visible:ring-emerald-500"}`}
                                                {...field}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                    <div className="flex gap-2 pt-1">
                                        {[10, 50, 100].map((val) => (
                                            <Button
                                                key={val}
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 rounded-full border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                                                onClick={() => form.setValue("amount", (Number(form.getValues("amount")) || 0) + val)}
                                            >
                                                +{val}
                                            </Button>
                                        ))}
                                    </div>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-muted-foreground uppercase text-xs font-bold tracking-wider">Descripción / Motivo</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Ej: Pago de delivery, Cambio sencillo..."
                                            className="resize-none min-h-[80px] text-base border-slate-200 focus-visible:ring-slate-400"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex gap-3 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="w-1/3 h-12 text-base font-medium"
                                onClick={() => onOpenChange(false)}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className={`w-2/3 h-12 text-base font-bold shadow-md hover:shadow-lg transition-all ${type === "EXPENSE" ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"}`}
                            >
                                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                                Guardar Movimiento
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
