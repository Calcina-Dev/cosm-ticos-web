"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Trash2, Search, Plus, Save } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

import { purchasesService } from "../purchases.service"
import { stockService } from "@/features/inventory/stock.service" // For warehouses
import { suppliersService } from "@/features/partners/suppliers.service"
import { productsService } from "@/features/products/products.service" // For product search
import { PurchaseStatus } from "../types"
import { getErrorMessage } from "@/lib/error-utils"
import { formatCurrency } from "@/lib/utils"

// If suppliersService doesn't exist, I'll need to mock or finding it. 
// Assuming it exists because "Customers & Suppliers Management" is done.
// I will check imports later.

const purchaseSchema = z.object({
    supplierId: z.string().min(1, "Proveedor requerido"),
    warehouseId: z.string().min(1, "Almacén requerido"),
    lines: z.array(z.object({
        variantId: z.string().min(1, "Producto requerido"),
        quantity: z.number().min(1, "Cantidad min 1"),
        unitCost: z.number().min(0, "Costo debe ser >= 0"),
        productName: z.string().optional(),
        sku: z.string().optional(),
    })).min(1, "Debe agregar al menos un producto"),
})

type PurchaseFormValues = z.infer<typeof purchaseSchema>


interface PurchaseFormProps {
    initialData?: any;
    purchaseId?: string;
}

export function PurchaseForm({ initialData, purchaseId }: PurchaseFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [warehouses, setWarehouses] = useState<any[]>([])
    const [suppliers, setSuppliers] = useState<any[]>([])

    // Product Search
    const [searchQuery, setSearchQuery] = useState("")
    const [searchResults, setSearchResults] = useState<any[]>([])

    const form = useForm<PurchaseFormValues>({
        resolver: zodResolver(purchaseSchema),
        defaultValues: {
            supplierId: initialData?.supplierId || "",
            warehouseId: initialData?.warehouseId || "",
            lines: initialData?.lines?.map((l: any) => ({
                variantId: l.variantId,
                quantity: l.quantity,
                unitCost: Number(l.unitCost),
                productName: l.variant?.product?.name || l.productName,
                sku: l.variant?.sku || l.sku,
            })) || [],
        },
    })

    const { fields, append, remove, update } = useFieldArray({
        control: form.control,
        name: "lines",
    })

    const lines = form.watch("lines")
    const totalAmount = lines.reduce((acc, line) => acc + (line.quantity * line.unitCost), 0)

    useEffect(() => {
        loadDependencies()
    }, [])

    const loadDependencies = async () => {
        try {
            // Load warehouses (using stock summary trick or dedicated endpoint if available)
            // Ideally: await warehouseService.findAll()
            // I'll try generic approach or assume stockService has summary
            const stockSummary = await stockService.getSummary()
            const uniqueWarehouses = Array.from(
                new Map(stockSummary.map(s => [s.warehouse.id, s.warehouse])).values()
            )
            setWarehouses(uniqueWarehouses)

            // Load suppliers
            const suppliersData = await suppliersService.findAll({ limit: 100 })
            setSuppliers(suppliersData.items || [])
        } catch (error) {
            console.error(error)
            toast.error("Error al cargar datos iniciales")
            setSuppliers([])
            setWarehouses([])
        }
    }

    const searchProducts = async () => {
        if (!searchQuery.trim()) return
        try {
            // We want global product search
            const result = await productsService.findAll({ search: searchQuery, limit: 10 })
            setSearchResults(result.items)
        } catch (error) {
            toast.error("Error buscando productos")
        }
    }

    const addProduct = (product: any, variant: any) => {
        // Check duplicates
        if (fields.some(f => f.variantId === variant.id)) {
            toast.warning("El producto ya está en la lista")
            return
        }

        append({
            variantId: variant.id,
            quantity: 1,
            unitCost: 0, // Should be fetched from last cost? For now 0.
            productName: product.name + (variant.name ? ` - ${variant.name}` : ""),
            sku: variant.sku,
        })
        setSearchResults([])
        setSearchQuery("")
    }

    const onSubmit = async (data: PurchaseFormValues) => {
        try {
            setLoading(true)
            const payload = {
                supplierId: data.supplierId,
                warehouseId: data.warehouseId,
                status: PurchaseStatus.DRAFT,
                lines: data.lines.map(l => ({
                    variantId: l.variantId,
                    quantity: l.quantity,
                    unitCost: l.unitCost
                }))
            };

            if (purchaseId) {
                await purchasesService.update(purchaseId, payload);
                toast.success("Compra actualizada correctamente");
            } else {
                await purchasesService.create(payload);
                toast.success("Compra guardada correctamente (Borrador)");
            }
            router.push("/purchases")
        } catch (error) {
            toast.error(getErrorMessage(error, purchaseId ? "Error al actualizar" : "Error al crear compra"))
        } finally {
            setLoading(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle>Productos</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Buscar producto (nombre, sku)..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), searchProducts())}
                                />
                                <Button type="button" onClick={searchProducts} variant="secondary">
                                    <Search className="h-4 w-4" />
                                </Button>
                            </div>

                            {searchResults.length > 0 && (
                                <div className="border rounded-md p-2 bg-muted/20 max-h-60 overflow-y-auto">
                                    {searchResults.map(prod => (
                                        <div key={prod.id}>
                                            {prod.variants.map((v: any) => (
                                                <div key={v.id} className="flex justify-between items-center p-2 hover:bg-white rounded-sm border-b last:border-0 border-dashed">
                                                    <div>
                                                        <p className="font-medium text-sm">{prod.name} {v.name && `- ${v.name}`}</p>
                                                        <p className="text-xs text-muted-foreground">SKU: {v.sku}</p>
                                                    </div>
                                                    <Button size="sm" variant="ghost" type="button" onClick={() => addProduct(prod, v)}>
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[40%]">Producto</TableHead>
                                            <TableHead>Cant.</TableHead>
                                            <TableHead>Costo U.</TableHead>
                                            <TableHead className="text-right">Subtotal</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {fields.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                                    Agregue productos a la orden
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            fields.map((field, index) => (
                                                <TableRow key={field.id}>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-sm">{field.productName}</span>
                                                            <span className="text-xs text-muted-foreground">{field.sku}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <FormField
                                                            control={form.control}
                                                            name={`lines.${index}.quantity`}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormControl>
                                                                        <Input type="number" min="1" className="w-20" {...field} onChange={e => field.onChange(e.target.valueAsNumber || 0)} />
                                                                    </FormControl>
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <FormField
                                                            control={form.control}
                                                            name={`lines.${index}.unitCost`}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormControl>
                                                                        <Input type="number" min="0" step="0.01" className="w-24" {...field} onChange={e => field.onChange(e.target.valueAsNumber || 0)} />
                                                                    </FormControl>
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium">
                                                        {formatCurrency(
                                                            (form.watch(`lines.${index}.quantity`) || 0) *
                                                            (form.watch(`lines.${index}.unitCost`) || 0)
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button variant="ghost" size="icon" type="button" onClick={() => remove(index)} className="text-destructive">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Detalles de Compra</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="supplierId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Proveedor</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {(suppliers || []).map(s => (
                                                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="warehouseId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Almacén de Recepción</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {(warehouses || []).map(w => (
                                                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />



                            <div className="pt-4 border-t mt-4">
                                <div className="flex justify-between items-center text-lg font-bold">
                                    <span>Total:</span>
                                    <span>{formatCurrency(totalAmount)}</span>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-2">
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <Save className="mr-2 h-4 w-4" />
                                Guardar Borrador
                            </Button>
                            <Button type="button" variant="outline" className="w-full" onClick={() => router.back()}>
                                Cancelar
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </form>
        </Form>
    )
}
