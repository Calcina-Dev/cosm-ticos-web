export interface Customer {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    identityDoc?: string;
    address?: string;
    priceListId?: string;
    active: boolean;
    companyId: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateCustomerPayload {
    name: string;
    email?: string;
    phone?: string;
    identityDoc?: string;
    address?: string;
    priceListId?: string;
}

export type UpdateCustomerPayload = Partial<CreateCustomerPayload>;

export interface Supplier {
    id: string;
    name: string;
    ruc?: string;
    email?: string;
    phone?: string;
    address?: string;
    active: boolean;
    companyId: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateSupplierPayload {
    name: string;
    ruc?: string;
    email?: string;
    phone?: string;
    address?: string;
}

export type UpdateSupplierPayload = Partial<CreateSupplierPayload>;

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
