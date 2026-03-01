import apiClient from "@/lib/axios";

export interface CreateVariantPayload {
    sku: string;
    barcode?: string;
    price: string | number;
}

export interface UpdateVariantPayload {
    sku?: string;
    barcode?: string;
    price?: number;
}

export const variantsService = {
    create: async (productId: string, payload: CreateVariantPayload) => {
        const { data } = await apiClient.post(`/products/${productId}/variants`, payload);
        return data;
    },

    update: async (id: string, payload: UpdateVariantPayload) => {
        const { data } = await apiClient.patch(`/variants/${id}`, payload);
        return data;
    },

    delete: async (id: string) => {
        await apiClient.delete(`/variants/${id}`);
    },

    restore: async (id: string) => {
        const { data } = await apiClient.patch(`/variants/${id}/restore`);
        return data;
    },
};
