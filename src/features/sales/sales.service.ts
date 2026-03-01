import api from "@/lib/axios"
// import { PaginatedResponse } from "@/types/api"
export interface PaginatedResponse<T> {
    items: T[]
    meta: {
        total: number
        limit: number
        offset: number
    }
}

export interface CreateSaleDto {
    customerId?: string
    warehouseId?: string
    items: {
        variantId: string
        warehouseId: string
        quantity: number
        price: number
    }[]
    payments: {
        methodId: string
        amount: number
        ref?: string
    }[]
}

export interface CancelSaleDto {
    reason: string;
    supervisorPin?: string;
}

export interface ReturnSaleDto {
    reason: string;
    returnToStock: boolean;
    items: {
        saleLineId: string;
        quantity: number;
    }[];
}

export const salesService = {
    create: async (data: CreateSaleDto) => {
        const response = await api.post("/sales", data)
        return response.data
    },

    findAll: async (params?: any) => {
        const response = await api.get<PaginatedResponse<any>>("/sales", { params })
        return response.data
    },

    findOne: async (id: string) => {
        const response = await api.get(`/sales/${id}`)
        return response.data
    },

    cancel: async (id: string, data: CancelSaleDto) => {
        const response = await api.patch(`/sales/${id}/cancel`, data);
        return response.data;
    },

    returnSale: async (id: string, data: ReturnSaleDto) => {
        const response = await api.post(`/sales/${id}/return`, data);
        return response.data;
    }
}
