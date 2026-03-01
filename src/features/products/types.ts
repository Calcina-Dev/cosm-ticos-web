export interface Product {
    id: string;
    companyId: string;
    name: string;
    nameKey: string;
    brand?: string;
    brandId?: string;
    unitId?: string;
    categoryId?: string;
    active: boolean;
    createdAt?: string;

    // Relations
    unit?: { id: string; name: string; code: string };
    brandRel?: { id: string; name: string };
    category?: { id: string; name: string };
    variants?: Variant[];
}

export interface Variant {
    id: string;
    productId: string;
    sku: string;
    barcode?: string;
    price: number;
    active?: boolean;
}

export interface CreateProductPayload {
    name: string;
    brand?: string;
    brandId?: string;
    unitId?: string;
    categoryId?: string;
    variants: {
        sku: string;
        barcode?: string;
        price: string | number;
    }[];
}

export interface UpdateProductPayload {
    name?: string;
    brand?: string;
    brandId?: string;
    unitId?: string;
    categoryId?: string;
}
