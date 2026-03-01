export interface Company {
    id: string;
    name: string;
    ruc?: string;
    active: boolean;
}

export interface Branch {
    id: string;
    companyId: string;
    name: string;
    address?: string;
    active: boolean;
}

export interface CompanyUser {
    company: Company;
    roleId?: string;
    // permissions, etc.
}
