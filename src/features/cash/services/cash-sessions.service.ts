import api from "@/lib/axios";

export interface CashTransaction {
    id: string;
    type: 'INCOME' | 'EXPENSE';
    amount: number;
    description?: string;
    expenseType?: {
        name: string;
    };
    createdAt?: string;
    documentType?: string;
    documentSeries?: string;
    documentNumber?: number;
}

export interface CashSession {
    id: string;
    companyId: string;
    userId: string;
    registerId: string;
    status: 'OPEN' | 'CLOSED';
    startTime: string;
    endTime?: string;
    startAmount: number;
    endAmount?: number;
    difference?: number;
    transactions?: CashTransaction[];
    paymentSummary?: { method: string, total: number }[];
    user?: {
        name: string;
        email: string;
    };
}

export interface OpenSessionDto {
    registerId: string;
    startAmount: number;
}

export interface CloseSessionDto {
    finalAmount: number;
}

export interface CashRegister {
    id: string;
    name: string;
    active: boolean;
}

export const cashSessionsService = {
    getActiveSession: async () => {
        const response = await api.get<CashSession>('/cash-sessions/active');
        return response.data;
    },

    getRegisters: async () => {
        // Solo cajas disponibles (sin sesión OPEN activa)
        const response = await api.get<CashRegister[]>('/cash-registers?availableOnly=true');
        return response.data;
    },

    openSession: async (data: OpenSessionDto) => {
        const response = await api.post<CashSession>('/cash-sessions', {
            registerId: data.registerId,
            startAmount: data.startAmount,
        });
        return response.data;
    },

    closeSession: async (sessionId: string, data: CloseSessionDto) => {
        const response = await api.patch<CashSession>(`/cash-sessions/${sessionId}`, {
            status: 'CLOSED',
            endAmount: data.finalAmount
        });
        return response.data;
    },

    findOne: async (id: string) => {
        const response = await api.get<CashSession>(`/cash-sessions/${id}`);
        return response.data;
    }
};
