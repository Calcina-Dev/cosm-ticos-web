import { TransferForm } from "@/features/inventory/components/transfer-form"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function NewTransferPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center space-x-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/inventory/transfers">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Nueva Transferencia</h2>
                    <p className="text-muted-foreground">
                        Mover stock entre almacenes.
                    </p>
                </div>
            </div>
            <Separator />
            <div className="max-w-4xl mx-auto">
                <TransferForm />
            </div>
        </div>
    )
}
