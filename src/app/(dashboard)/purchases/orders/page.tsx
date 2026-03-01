import { PurchaseList } from "@/features/purchases/components/purchase-list"
import { Separator } from "@/components/ui/separator"

export default function PurchaseOrdersPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Órdenes de Compra</h2>
                    <p className="text-muted-foreground">
                        Gestiona las órdenes de compra y el estado de tus pedidos.
                    </p>
                </div>
            </div>
            <Separator />
            <PurchaseList />
        </div>
    )
}
