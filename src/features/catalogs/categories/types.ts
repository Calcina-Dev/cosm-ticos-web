export interface Category {
    id: string;
    name: string;
    nameKey: string;
    companyId: string;
    parentId?: string | null;
    active: boolean;
    createdAt?: string;
    // Subcategories populated if needed for tree view
    children?: Category[];
}

export interface CreateCategoryPayload {
    name: string;
    parentId?: string;
    active?: boolean;
}

export interface UpdateCategoryPayload {
    name?: string;
    parentId?: string;
    active?: boolean;
}
