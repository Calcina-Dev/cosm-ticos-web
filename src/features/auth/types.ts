export interface User {
    id: string;
    email: string;
    name?: string;
    companyName?: string;
    active: boolean;
    warehouseId?: string;
    role?: string;
    permissions?: string[];
}

export interface LoginPayload {
    email: string;
    password: string;
    companyId?: string;
}

export interface AuthResponse {
    access_token?: string;
    requiresSelection?: boolean;
    companies?: { id: string; name: string }[];
}
