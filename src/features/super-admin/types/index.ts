export interface SuperAdminCompany {
    id: string;
    name: string;
    ruc?: string;
    active: boolean;
    createdAt: string;
    _count: {
        users: number;
        branches: number;
    };
}

export interface SuperAdminUser {
    id: string;
    email: string;
    role: 'USER' | 'SUPER_ADMIN';
    active: boolean;
    createdAt: string;
    _count: {
        companyUsers: number;
    };
}

export interface CreateCompanyDto {
    name: string;
    ruc?: string;
    adminEmail: string;
    adminPassword?: string;
}
