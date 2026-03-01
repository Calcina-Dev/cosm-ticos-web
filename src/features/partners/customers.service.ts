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

export interface Customer {
    id: string
    name: string
    email?: string
    identityDoc?: string
    phone?: string
}

export const customersService = {
    findAll: async (params?: any) => {
        const response = await api.get<PaginatedResponse<Customer>>("/customers", { params })
        return response.data
    },

    create: async (data: any) => {
        const response = await api.post("/customers", data)
        return response.data
    }
}
