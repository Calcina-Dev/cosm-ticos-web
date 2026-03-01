import { InvoiceList } from "@/features/purchases/components/invoice-list"
import { Separator } from "@/components/ui/separator"

export default function PurchaseInvoicesPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Facturas / Ingresos</h2>
                    <p className="text-muted-foreground">
                        Historial de facturas recibidas y mercadería ingresada al inventario.
                    </p>
                </div>
            </div>
            <Separator />
            <InvoiceList />
        </div>
    )
}
