import { StockList } from "@/features/inventory/components/stock-list"
import { Separator } from "@/components/ui/separator"

export default function InventoryPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Inventario General</h2>
                    <p className="text-muted-foreground">
                        Vista general del stock valorizado por almacén y producto.
                    </p>
                </div>
            </div>
            <Separator />
            <StockList />
        </div>
    )
}
