export interface Unit {
    id: string;
    name: string;
    code: string;
    companyId: string;
    active: boolean;
    createdAt?: string;
}

export interface CreateUnitPayload {
    name: string;
    code: string;
    active?: boolean;
}

export interface UpdateUnitPayload {
    name?: string;
    code?: string;
    active?: boolean;
}
