export enum PurchaseStatus {
    DRAFT = 'DRAFT',
    CONFIRMED = 'CONFIRMED',
    PARTIALLY_RECEIVED = 'PARTIALLY_RECEIVED',
    COMPLETED = 'COMPLETED',
    RECEIVED = 'RECEIVED', // Legacy state
    CANCELLED = 'CANCELLED'
}

export enum InvoiceStatus {
    VALID = 'VALID',
    PENDING = 'PENDING',
    CANCELLED = 'CANCELLED'
}

export enum PaymentMethodCode {
    CASH = 'CASH',
    CREDIT = 'CREDIT',
    TRANSFER = 'TRANSFER',
    DEBIT_CARD = 'DEBIT_CARD',
    CREDIT_CARD = 'CREDIT_CARD',
    OTHER = 'OTHER'
}

export interface PurchaseLine {
    id: string;
    variantId: string;
    quantity: number;
    unitCost: number;
    subtotal: number;
    variant: {
        id: string;
        sku: string;
        product: {
            name: string;
        };
    };
}

export interface PaginatedResponse<T> {
    items: T[];
    meta: {
        total: number;
        page: number;
        lastPage: number;
        limit: number;
        offset: number;
    };
}

export interface Purchase {
    id: string;
    documentNumber?: number;
    documentSeries?: string;
    supplierId: string;
    warehouseId: string;
    totalAmount: number;
    status: PurchaseStatus;
    createdAt: string;
    supplier: {
        id: string;
        name: string;
    };
    warehouse: {
        id: string;
        name: string;
    };
    user: {
        id: string;
        email: string;
    };
    lines?: PurchaseLine[];
    invoices?: PurchaseInvoice[];
}

export interface PurchaseInvoiceLine {
    id: string;
    invoiceId: string;
    variantId: string;
    quantity: number;
    unitCost: number;
    subtotal: number;
    variant?: {
        id: string;
        sku: string;
        product: {
            name: string;
        };
    };
}

export interface PurchaseInvoice {
    id: string;
    companyId: string;
    purchaseId: string;
    documentType?: string;
    documentSeries?: string;
    documentNumber?: number;
    supplierDocumentNumber?: string;
    issueDate: string;
    totalAmount: number;
    balance?: number;
    status: InvoiceStatus;
    userId?: string;
    createdAt: string;
    purchase?: Purchase;
    lines?: PurchaseInvoiceLine[];
}

export interface CreatePurchaseLine {
    variantId: string;
    quantity: number;
    unitCost: number;
}

export interface CreatePurchasePayload {
    supplierId: string;
    warehouseId: string;
    status?: PurchaseStatus;
    lines: CreatePurchaseLine[];
}

export interface CreatePurchaseInvoiceLine {
    variantId: string;
    quantity: number;
    unitCost: number;
}

export interface CreatePurchaseInvoicePayload {
    purchaseId: string;
    documentType?: string;
    supplierDocumentNumber?: string;
    issueDate?: string;
    paymentMethodId?: string;
    lines: CreatePurchaseInvoiceLine[];
}

export interface UpdatePurchasePayload {
    status?: PurchaseStatus;
    // Add other fields as needed
}
