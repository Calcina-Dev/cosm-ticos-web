"use client"

import { KardexTable } from "@/features/inventory/components/kardex-table"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

export default function KardexPage() {
    const router = useRouter()
    const searchParams = useSearchParams()

    // Optional filters from URL
    const variantId = searchParams.get("variantId") ?? undefined
    const warehouseId = searchParams.get("warehouseId") ?? undefined

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Kardex de Movimientos</h2>
                    <p className="text-muted-foreground">
                        Historial detallado de todas las transacciones de inventario.
                    </p>
                </div>
            </div>
            <Separator />
            <KardexTable variantId={variantId} warehouseId={warehouseId} />
        </div>
    )
}
