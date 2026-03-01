"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import { stockService } from "../stock.service"
import { StockBalance, StockMovementType } from "../types"
import { getErrorMessage } from "@/lib/error-utils"

// Schema
const adjustmentSchema = z.object({
    type: z.enum(["IN", "OUT"]),
    quantity: z.coerce.number().min(1, "La cantidad debe ser mayor a 0"),
    unitCost: z.coerce.number().default(0),
    reason: z.string().min(5, "El motivo es requerido (min 5 caracteres)"),
})

type AdjustmentFormValues = z.infer<typeof adjustmentSchema>

interface StockAdjustmentDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    item: StockBalance | null
    onSuccess: () => void
}

export function StockAdjustmentDialog({
    open,
    onOpenChange,
    item,
    onSuccess,
}: StockAdjustmentDialogProps) {
    const [loading, setLoading] = useState(false)

    const form = useForm<AdjustmentFormValues>({
        resolver: zodResolver(adjustmentSchema) as any,
        defaultValues: {
            type: "IN",
            quantity: 1,
            unitCost: 0,
            reason: "",
        },
    })

    const type = form.watch("type")

    const onSubmit = async (data: AdjustmentFormValues) => {
        if (!item) return

        try {
            setLoading(true)

            // Final quantity logic
            const finalQty = data.type === "OUT" ? -Math.abs(data.quantity) : Math.abs(data.quantity);

            await stockService.createMovement({
                variantId: item.variantId,
                warehouseId: item.warehouse.id,
                type: StockMovementType.ADJUSTMENT,
                quantity: finalQty,
                reason: data.reason,
                unitCost: data.type === "IN" ? data.unitCost : undefined,
            })

            toast.success("Ajuste realizado correctamente")
            form.reset()
            onOpenChange(false)
            onSuccess()
        } catch (error) {
            toast.error(getErrorMessage(error, "Error al realizar ajuste"))
        } finally {
            setLoading(false)
        }
    }

    if (!item) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Ajuste de Inventario</DialogTitle>
                    <DialogDescription>
                        {item.product.name} - {item.sku}
                        <br />
                        <span className="font-semibold text-foreground">
                            Almacén: {item.warehouse.name}
                        </span>
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tipo de Ajuste</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar tipo" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="IN">Entrada (Aumentar Stock)</SelectItem>
                                            <SelectItem value="OUT">Salida (Disminuir Stock)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="quantity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Cantidad</FormLabel>
                                        <FormControl>
                                            <Input type="number" min="1" step="1" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {type === "IN" && (
                                <FormField
                                    control={form.control}
                                    name="unitCost"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Costo Unit.</FormLabel>
                                            <FormControl>
                                                <Input type="number" min="0" step="0.01" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </div>

                        <FormField
                            control={form.control}
                            name="reason"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Motivo</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Justificación del ajuste..."
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Guardar Ajuste
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
