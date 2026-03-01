import { TransferList } from "@/features/inventory/components/transfer-list"
import { Separator } from "@/components/ui/separator"

export default function TransfersPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Transferencias</h2>
                    <p className="text-muted-foreground">
                        Gestiona los traspasos de stock entre almacenes.
                    </p>
                </div>
            </div>
            <Separator />
            <TransferList />
        </div>
    )
}
