import api from "@/lib/axios"

export interface PaymentMethod {
    id: string
    name: string
    code: string
    isActive: boolean
}

export const paymentMethodsService = {
    findAll: async () => {
        const response = await api.get<PaymentMethod[]>("/payment-methods")
        return response.data
    },

    create: async (data: Partial<PaymentMethod>) => {
        const response = await api.post<PaymentMethod>("/payment-methods", data)
        return response.data
    },

    update: async (id: string, data: Partial<PaymentMethod>) => {
        const response = await api.patch<PaymentMethod>(`/payment-methods/${id}`, data)
        return response.data
    },

    delete: async (id: string) => {
        const response = await api.delete<PaymentMethod>(`/payment-methods/${id}`)
        return response.data
    }
}
