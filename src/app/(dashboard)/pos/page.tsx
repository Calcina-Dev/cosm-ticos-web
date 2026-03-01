import { PosLayout } from "@/features/pos/components/pos-layout"
import { ProductGrid } from "@/features/pos/components/product-grid"
import { PosCart } from "@/features/pos/components/pos-cart"

export default function PosPage() {
    return (
        <PosLayout>
            <div className="flex h-full">
                <div className="flex-1 border-r">
                    <ProductGrid />
                </div>
                <div className="w-[400px]">
                    <PosCart />
                </div>
            </div>
        </PosLayout>
    )
}
