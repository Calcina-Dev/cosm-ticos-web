export interface StockBalance {
    warehouse: {
        id: string;
        name: string;
    };
    variantId: string;
    sku: string;
    barcode: string | null;
    product: {
        id: string;
        name: string;
        brand: string | null;
    };
    stock: number; // or string if Decimal
    avgCost: string;
    stockValue: string;
}

export enum StockMovementType {
    IN = 'IN',
    OUT = 'OUT',
    ADJUSTMENT = 'ADJUSTMENT',
    TRANSFER_IN = 'TRANSFER_IN',
    TRANSFER_OUT = 'TRANSFER_OUT',
    PURCHASE = 'PURCHASE',
    SALE = 'SALE'
}

export interface StockMovement {
    id: string;
    type: StockMovementType;
    quantity: number;
    unitCost: string;
    totalCost: string;
    reason: string;
    refType: string;
    refId: string;
    documentSeries?: string;
    documentNumber?: number;
    createdAt: string;
    user: {
        id: string;
        email: string;
    };
    warehouse: {
        id: string;
        name: string;
    };
    variant: {
        id: string;
        sku: string;
        barcode: string | null;
        product: {
            id: string;
            name: string;
            brand: string | null;
        };
    };
}
export interface CreateMovementPayload {
    variantId: string;
    warehouseId: string;
    type: StockMovementType;
    quantity: number;
    unitCost?: number;
    reason: string;
}

export interface StockTransfer {
    id: string;
    fromWarehouse: {
        id: string;
        name: string;
    };
    toWarehouse: {
        id: string;
        name: string;
    };
    user: {
        id: string;
        email: string;
    };
    reason: string;
    createdAt: string;
    _count?: {
        lines: number;
    };
    lines?: TransferLine[];
}

export interface TransferLine {
    id: string;
    variantId: string;
    quantity: number;
    variant: {
        id: string;
        sku: string;
        product: {
            name: string;
        };
    };
}

export interface CreateTransferLine {
    variantId: string;
    quantity: number;
}

export interface CreateTransferPayload {
    fromWarehouseId: string;
    toWarehouseId: string;
    reason: string;
    lines: CreateTransferLine[];
}
