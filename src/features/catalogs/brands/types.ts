export interface Brand {
    id: string;
    companyId: string;
    name: string;
    description?: string;
    active: boolean;
    createdAt?: string;
}

export interface CreateBrandPayload {
    name: string;
    description?: string;
    active?: boolean;
}

export interface UpdateBrandPayload {
    name?: string;
    description?: string;
    active?: boolean;
}
