import apiClient from "@/lib/axios";

export interface Brand {
    id: string;
    name: string;
    description?: string;
    active: boolean;
    companyId: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateBrandPayload {
    name: string;
    description?: string;
}

export type UpdateBrandPayload = Partial<CreateBrandPayload>;

export const brandsService = {
    getAll: async () => {
        const response = await apiClient.get<Brand[]>("/brands");
        return response.data;
    },

    getById: async (id: string) => {
        const response = await apiClient.get<Brand>(`/brands/${id}`);
        return response.data;
    },

    create: async (payload: CreateBrandPayload) => {
        const response = await apiClient.post<Brand>("/brands", payload);
        return response.data;
    },

    update: async (id: string, payload: UpdateBrandPayload) => {
        const response = await apiClient.patch<Brand>(`/brands/${id}`, payload);
        return response.data;
    },

    delete: async (id: string) => {
        await apiClient.delete(`/brands/${id}`);
    },
};
