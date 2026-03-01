"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { PurchaseForm } from "@/features/purchases/components/purchase-form"
import { purchasesService } from "@/features/purchases/purchases.service"
import { Purchase } from "@/features/purchases/types"
import { Loader2 } from "lucide-react"

export default function EditPurchasePage() {
    const params = useParams()
    const id = params.id as string
    const [purchase, setPurchase] = useState<Purchase | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadPurchase = async () => {
            try {
                const data = await purchasesService.findOne(id)
                setPurchase(data)
            } catch (error) {
                console.error(error)
            } finally {
                setLoading(false)
            }
        }
        loadPurchase()
    }, [id])

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!purchase) return <div>Compra no encontrada</div>

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Editar Compra #{purchase.documentNumber || purchase.id.substring(0, 8)}</h2>
            <PurchaseForm initialData={purchase} purchaseId={id} />
        </div>
    )
}
