import apiClient from "@/lib/axios";
import { Purchase, CreatePurchasePayload, UpdatePurchasePayload, PaginatedResponse } from "./types";

export const purchasesService = {
    findAll: async (params: any = {}): Promise<PaginatedResponse<Purchase>> => {
        const { data } = await apiClient.get<PaginatedResponse<Purchase>>("/purchases", {
            params,
        });
        return data;
    },

    findOne: async (id: string): Promise<Purchase> => {
        const { data } = await apiClient.get<Purchase>(`/purchases/${id}`);
        return data;
    },

    create: async (payload: CreatePurchasePayload): Promise<Purchase> => {
        const { data } = await apiClient.post<Purchase>("/purchases", payload);
        return data;
    },

    update: async (id: string, payload: UpdatePurchasePayload): Promise<Purchase> => {
        const { data } = await apiClient.patch<Purchase>(`/purchases/${id}`, payload);
        return data;
    },

    finalize: async (id: string): Promise<Purchase> => {
        const { data } = await apiClient.patch<Purchase>(`/purchases/${id}/finalize`);
        return data;
    },

    cancel: async (id: string, reason: string): Promise<Purchase> => {
        const { data } = await apiClient.patch<Purchase>(`/purchases/${id}/cancel`, { reason });
        return data;
    },

    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`/purchases/${id}`);
    },
};
