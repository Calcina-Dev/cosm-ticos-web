import apiClient from "@/lib/axios";

export type WarehouseType = "MAIN" | "SECONDARY" | "TRANSIT" | "VIRTUAL";

export interface Warehouse {
    id: string;
    name: string;
    type?: WarehouseType;
    address?: string;
    active: boolean;
    companyId: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateWarehousePayload {
    name: string;
    type?: WarehouseType;
    address?: string;
}

export type UpdateWarehousePayload = Partial<CreateWarehousePayload>;

export const warehousesService = {
    getAll: async () => {
        const response = await apiClient.get<Warehouse[]>("/warehouses");
        return response.data;
    },

    getById: async (id: string) => {
        const response = await apiClient.get<Warehouse>(`/warehouses/${id}`);
        return response.data;
    },

    create: async (payload: CreateWarehousePayload) => {
        const response = await apiClient.post<Warehouse>("/warehouses", payload);
        return response.data;
    },

    update: async (id: string, payload: UpdateWarehousePayload) => {
        const response = await apiClient.patch<Warehouse>(`/warehouses/${id}`, payload);
        return response.data;
    },

    delete: async (id: string) => {
        await apiClient.delete(`/warehouses/${id}`);
    },

    restore: async (id: string) => {
        const response = await apiClient.patch<Warehouse>(`/warehouses/${id}/restore`);
        return response.data;
    },
};
