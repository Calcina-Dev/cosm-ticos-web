import apiClient from "@/lib/axios";

export interface Supplier {
    id: string;
    name: string;
    documentType?: string;
    documentNumber?: string;
    email?: string;
    phone?: string;
    address?: string;
}

interface PaginatedResponse<T> {
    items: T[];
    total: number;
    limit: number;
    offset: number;
}

export const suppliersService = {
    findAll: async (params: any = {}): Promise<PaginatedResponse<Supplier>> => {
        const page = params?.page || 1;
        const limit = params?.limit || 20;
        const offset = (page - 1) * limit;
        const search = params?.search;

        const { data } = await apiClient.get<PaginatedResponse<Supplier>>("/suppliers", {
            params: { limit, offset, search },
        });
        return data;
    },

    findOne: async (id: string): Promise<Supplier> => {
        const { data } = await apiClient.get<Supplier>(`/suppliers/${id}`);
        return data;
    },

    create: async (payload: Partial<Supplier>): Promise<Supplier> => {
        const { data } = await apiClient.post<Supplier>("/suppliers", payload);
        return data;
    },

    update: async (id: string, payload: Partial<Supplier>): Promise<Supplier> => {
        const { data } = await apiClient.patch<Supplier>(`/suppliers/${id}`, payload);
        return data;
    },

    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`/suppliers/${id}`);
    },
};
