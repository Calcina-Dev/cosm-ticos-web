import apiClient from "@/lib/axios";
import { CreateProductPayload, Product, UpdateProductPayload } from "./types";

const BASE_URL = "/products";

interface PaginatedResponse<T> {
    items: T[];
    meta: {
        total: number;
        page: number;
        lastPage: number;
        limit: number;
        offset: number;
    };
}

export const productsService = {
    findAll: async (params?: { page?: number; limit?: number; search?: string; warehouseId?: string }): Promise<PaginatedResponse<Product>> => {
        const page = params?.page || 1;
        const limit = params?.limit || 20;
        const offset = (page - 1) * limit;
        const search = params?.search;
        const warehouseId = params?.warehouseId;

        const { data } = await apiClient.get<PaginatedResponse<Product>>(BASE_URL, {
            params: { limit, offset, search, warehouseId }
        });
        return data;
    },

    getById: async (id: string): Promise<Product> => {
        const { data } = await apiClient.get<Product>(`${BASE_URL}/${id}`);
        return data;
    },

    create: async (payload: CreateProductPayload): Promise<Product> => {
        const { data } = await apiClient.post<Product>(BASE_URL, payload);
        return data;
    },

    update: async (id: string, payload: UpdateProductPayload): Promise<Product> => {
        const { data } = await apiClient.patch<Product>(`${BASE_URL}/${id}`, payload);
        return data;
    },

    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`${BASE_URL}/${id}`);
    },
};
