import api from "@/lib/axios";

export interface CashRegister {
    id: string;
    name: string;
    active: boolean;
    companyId: string;
    branchId: string;
    branch?: {
        id: string;
        name: string;
    };
}

export interface Branch {
    id: string;
    name: string;
    address?: string;
}

export interface CreateCashRegisterDto {
    name: string;
    branchId: string;
}

export interface UpdateCashRegisterDto {
    name?: string;
    active?: boolean;
}

export const cashRegistersService = {
    getAll: async () => {
        const response = await api.get<CashRegister[]>('/cash-registers');
        return response.data;
    },

    // Solo cajas sin sesión activa (para el dropdown de apertura)
    getAvailable: async () => {
        const response = await api.get<CashRegister[]>('/cash-registers?availableOnly=true');
        return response.data;
    },

    getBranches: async () => {
        const response = await api.get<Branch[]>('/branches');
        return response.data;
    },

    getById: async (id: string) => {
        const response = await api.get<CashRegister>(`/cash-registers/${id}`);
        return response.data;
    },

    create: async (data: CreateCashRegisterDto) => {
        const response = await api.post<CashRegister>('/cash-registers', data);
        return response.data;
    },

    update: async (id: string, data: UpdateCashRegisterDto) => {
        const response = await api.patch<CashRegister>(`/cash-registers/${id}`, data);
        return response.data;
    },

    delete: async (id: string) => {
        const response = await api.delete(`/cash-registers/${id}`);
        return response.data;
    }
};
