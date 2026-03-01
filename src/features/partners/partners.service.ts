import apiClient from "@/lib/axios";
import {
    Customer,
    CreateCustomerPayload,
    UpdateCustomerPayload,
    Supplier,
    CreateSupplierPayload,
    UpdateSupplierPayload,
    PaginatedResponse,
} from "./types";

// ─── Customers ────────────────────────────────────────────────────────────────

export const customersService = {
    getAll: async (params?: { page?: number; limit?: number; search?: string }) => {
        const page = params?.page || 1;
        const limit = params?.limit || 20;
        const offset = (page - 1) * limit;
        const search = params?.search;

        const response = await apiClient.get<PaginatedResponse<Customer>>("/customers", {
            params: { limit, offset, search }
        });
        return response.data;
    },

    getById: async (id: string) => {
        const response = await apiClient.get<Customer>(`/customers/${id}`);
        return response.data;
    },

    create: async (payload: CreateCustomerPayload) => {
        const response = await apiClient.post<Customer>("/customers", payload);
        return response.data;
    },

    update: async (id: string, payload: UpdateCustomerPayload) => {
        const response = await apiClient.patch<Customer>(`/customers/${id}`, payload);
        return response.data;
    },

    delete: async (id: string) => {
        await apiClient.delete(`/customers/${id}`);
    },

    restore: async (id: string) => {
        const response = await apiClient.patch<Customer>(`/customers/${id}/restore`);
        return response.data;
    },
};

// ─── Suppliers ────────────────────────────────────────────────────────────────

export const suppliersService = {
    getAll: async (params?: { page?: number; limit?: number; search?: string }) => {
        const page = params?.page || 1;
        const limit = params?.limit || 20;
        const offset = (page - 1) * limit;
        const search = params?.search;

        const response = await apiClient.get<PaginatedResponse<Supplier>>("/suppliers", {
            params: { limit, offset, search }
        });
        return response.data;
    },

    getById: async (id: string) => {
        const response = await apiClient.get<Supplier>(`/suppliers/${id}`);
        return response.data;
    },

    create: async (payload: CreateSupplierPayload) => {
        const response = await apiClient.post<Supplier>("/suppliers", payload);
        return response.data;
    },

    update: async (id: string, payload: UpdateSupplierPayload) => {
        const response = await apiClient.patch<Supplier>(`/suppliers/${id}`, payload);
        return response.data;
    },

    delete: async (id: string) => {
        await apiClient.delete(`/suppliers/${id}`);
    },

    restore: async (id: string) => {
        const response = await apiClient.patch<Supplier>(`/suppliers/${id}/restore`);
        return response.data;
    },
};
