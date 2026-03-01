"use client"

import { useEffect, useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Plus, Trash, Trash2 } from "lucide-react"
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
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { productsService } from "../products.service"
import { variantsService } from "../variants.service"
import { categoriesService } from "@/features/catalogs/categories/categories.service"
import { unitsService } from "@/features/catalogs/units/units.service"
import { brandsService } from "@/features/catalogs/brands/brands.service"
import { Category } from "@/features/catalogs/categories/types"
import { Unit } from "@/features/catalogs/units/types"
import { Brand } from "@/features/catalogs/brands/types"
import { Variant } from "../types"
import { getErrorMessage } from "@/lib/error-utils"

// Schema solo para los datos del producto y nuevas variantes a agregar
const productSchema = z.object({
    name: z.string().min(2, "El nombre es requerido"),
    brandId: z.string().optional(),
    categoryId: z.string().optional(),
    unitId: z.string().optional(),
    newVariants: z.array(z.object({
        sku: z.string().min(1, "SKU requerido"),
        barcode: z.string().optional(),
        price: z.coerce.number().min(0, "Precio inválido"),
    })),
})

type ProductFormValues = z.infer<typeof productSchema> & {
    newVariants: { sku: string; barcode?: string; price: number }[]
}

interface ProductFormProps {
    initialData?: any
    onSuccess?: () => void
}

export function ProductForm({ initialData, onSuccess }: ProductFormProps) {
    const [loading, setLoading] = useState(false)
    const [categories, setCategories] = useState<Category[]>([])
    const [units, setUnits] = useState<Unit[]>([])
    const [brands, setBrands] = useState<Brand[]>([])
    // Variantes existentes (modo edición)
    const [existingVariants, setExistingVariants] = useState<Variant[]>(
        initialData?.variants ?? []
    )
    const [deletingVariantId, setDeletingVariantId] = useState<string | null>(null)
    const [deletingVariantLoading, setDeletingVariantLoading] = useState(false)

    const isEditing = !!initialData?.id

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema) as any,
        defaultValues: isEditing
            ? {
                name: initialData.name ?? "",
                brandId: initialData.brandId ?? undefined,
                categoryId: initialData.categoryId ?? undefined,
                unitId: initialData.unitId ?? undefined,
                newVariants: [],
            }
            : {
                name: "",
                brandId: undefined,
                categoryId: undefined,
                unitId: undefined,
                newVariants: [{ sku: "", barcode: "", price: 0 }],
            },
    })

    const { fields, append, remove } = useFieldArray({
        control: form.control as any,
        name: "newVariants",
    })

    useEffect(() => {
        const loadDependencies = async () => {
            try {
                const [cats, unitsData, brandsData] = await Promise.all([
                    categoriesService.getAll(),
                    unitsService.getAll(),
                    brandsService.getAll()
                ])
                setCategories(cats)
                setUnits(unitsData)
                setBrands(brandsData)
            } catch {
                toast.error("Error cargando catálogos")
            }
        }
        loadDependencies()
    }, [])

    const handleDeleteVariant = async () => {
        if (!deletingVariantId) return
        setDeletingVariantLoading(true)
        try {
            await variantsService.delete(deletingVariantId)
            setExistingVariants((prev) => prev.filter((v) => v.id !== deletingVariantId))
            toast.success("Variante eliminada")
        } catch (error: any) {
            toast.error(getErrorMessage(error, "Error al eliminar la variante"))
        } finally {
            setDeletingVariantLoading(false)
            setDeletingVariantId(null)
        }
    }

    const onSubmit = async (data: ProductFormValues) => {
        try {
            setLoading(true)
            if (isEditing) {
                // 1. Actualizar datos del producto
                await productsService.update(initialData.id, {
                    name: data.name,
                    brandId: data.brandId,
                    unitId: data.unitId,
                    categoryId: data.categoryId,
                })
                // 2. Agregar nuevas variantes si las hay
                for (const v of data.newVariants) {
                    await variantsService.create(initialData.id, {
                        sku: v.sku,
                        barcode: v.barcode,
                        price: String(v.price),
                    })
                }
                toast.success("Producto actualizado")
            } else {
                // Crear producto con variantes
                await productsService.create({
                    name: data.name,
                    brandId: data.brandId,
                    unitId: data.unitId,
                    categoryId: data.categoryId,
                    variants: data.newVariants.map(v => ({
                        ...v,
                        price: String(v.price)
                    })),
                })
                toast.success("Producto creado")
            }
            if (onSuccess) onSuccess()
        } catch (error: any) {
            toast.error(getErrorMessage(error, "Error al guardar producto"))
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6">
                    {/* Datos del producto */}
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control as any}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre del Producto *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej. Shampoo Revitalizante" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control as any}
                            name="brandId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Marca</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar..." />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {brands.map((item) => (
                                                <SelectItem key={item.id} value={item.id}>
                                                    {item.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control as any}
                            name="categoryId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Categoría</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar..." />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {categories.map((item) => (
                                                <SelectItem key={item.id} value={item.id}>
                                                    {item.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control as any}
                            name="unitId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Unidad de Medida</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar..." />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {units.map((item) => (
                                                <SelectItem key={item.id} value={item.id}>
                                                    {item.name} ({item.code})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Variantes existentes (solo en edición) */}
                    {isEditing && existingVariants.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                    Variantes existentes
                                </h3>
                            </div>
                            <Separator />
                            <div className="space-y-2">
                                {existingVariants.map((v) => (
                                    <div
                                        key={v.id}
                                        className="flex items-center justify-between rounded-md border px-3 py-2 bg-muted/30"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Badge variant="outline" className="font-mono text-xs">
                                                {v.sku}
                                            </Badge>
                                            {v.barcode && (
                                                <span className="text-xs text-muted-foreground">
                                                    {v.barcode}
                                                </span>
                                            )}
                                            <span className="font-semibold text-sm">
                                                S/ {Number(v.price).toFixed(2)}
                                            </span>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                                            onClick={() => setDeletingVariantId(v.id)}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Nuevas variantes */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                {isEditing ? "Agregar nuevas variantes" : "Variantes / Precios"}
                            </h3>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => append({ sku: "", barcode: "", price: 0 })}
                            >
                                <Plus className="mr-2 h-4 w-4" /> Agregar
                            </Button>
                        </div>
                        <Separator />

                        {fields.length === 0 && isEditing && (
                            <p className="text-xs text-muted-foreground text-center py-2">
                                Haz clic en "Agregar" para añadir una nueva variante.
                            </p>
                        )}

                        {fields.map((field, index) => (
                            <div key={field.id} className="grid grid-cols-12 gap-3 items-end">
                                <div className="col-span-3">
                                    <FormField
                                        control={form.control as any}
                                        name={`newVariants.${index}.sku`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className={index !== 0 ? "sr-only" : ""}>SKU</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="SKU-001" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="col-span-4">
                                    <FormField
                                        control={form.control as any}
                                        name={`newVariants.${index}.barcode`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className={index !== 0 ? "sr-only" : ""}>Código de Barras</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="775..." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="col-span-3">
                                    <FormField
                                        control={form.control as any}
                                        name={`newVariants.${index}.price`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className={index !== 0 ? "sr-only" : ""}>Precio</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="0.01" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        onClick={() => remove(index)}
                                        disabled={!isEditing && fields.length === 1}
                                    >
                                        <Trash className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <Button type="submit" disabled={loading} className="w-full">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEditing ? "Guardar cambios" : "Crear Producto"}
                    </Button>
                </form>
            </Form>

            {/* Confirmación eliminar variante */}
            <AlertDialog open={!!deletingVariantId} onOpenChange={() => setDeletingVariantId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar variante?</AlertDialogTitle>
                        <AlertDialogDescription>
                            No se puede eliminar si tiene stock positivo en algún almacén.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deletingVariantLoading}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-500 hover:bg-red-600"
                            onClick={handleDeleteVariant}
                            disabled={deletingVariantLoading}
                        >
                            {deletingVariantLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
