import apiClient from "@/lib/axios";
import { Category, CreateCategoryPayload, UpdateCategoryPayload } from "./types";

const BASE_URL = "/categories";

export const categoriesService = {
    getAll: async (): Promise<Category[]> => {
        const { data } = await apiClient.get<Category[]>(BASE_URL);
        return data;
    },

    getById: async (id: string): Promise<Category> => {
        const { data } = await apiClient.get<Category>(`${BASE_URL}/${id}`);
        return data;
    },

    create: async (payload: CreateCategoryPayload): Promise<Category> => {
        const { data } = await apiClient.post<Category>(BASE_URL, payload);
        return data;
    },

    update: async (id: string, payload: UpdateCategoryPayload): Promise<Category> => {
        const { data } = await apiClient.patch<Category>(`${BASE_URL}/${id}`, payload);
        return data;
    },

    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`${BASE_URL}/${id}`);
    },
};
