import api from "@/lib/axios";

export enum CreditMovementType {
    CHARGE = "CHARGE",
    PAYMENT = "PAYMENT"
}

export interface CreditAccount {
    id: string;
    companyId: string;
    customerId?: string;
    supplierId?: string;
    balance: number;
    creditLimit: number;
    createdAt: string;
    updatedAt: string;
    customer?: {
        id: string;
        name: string;
        email?: string;
        phone?: string;
    };
    supplier?: {
        id: string;
        name: string;
        email?: string;
    };
}

export interface CreditMovement {
    id: string;
    accountId: string;
    type: CreditMovementType;
    amount: number;
    description: string;
    referenceType: string;
    referenceId?: string;
    documentSeries?: string;
    documentNumber?: number;
    dueDate?: string;
    createdAt: string;
}
export interface CreatePaymentDto {
    accountId: string;
    amount: number;
    methodId: string;
    description?: string;
    referenceId?: string;
    referenceType?: string;
}

export const creditsService = {
    getAccounts: async (params: { customerId?: string; supplierId?: string }) => {
        const response = await api.get<CreditAccount[]>("/credits/accounts", { params });
        return response.data;
    },

    getAccount: async (id: string) => {
        const response = await api.get<CreditAccount>(`/credits/accounts/${id}`);
        return response.data;
    },

    getMovements: async (id: string) => {
        const response = await api.get<CreditMovement[]>(`/credits/accounts/${id}/movements`);
        return response.data;
    },

    registerPayment: async (dto: CreatePaymentDto) => {
        const response = await api.post<CreditMovement>("/credits/payments", dto);
        return response.data;
    },

    getOverdue: async (customerId?: string) => {
        const response = await api.get<any[]>("/credits/overdue", { params: { customerId } });
        return response.data;
    },

    updateLimit: async (id: string, creditLimit: number) => {
        const response = await api.patch(`/credits/accounts/${id}/limit`, { creditLimit });
        return response.data;
    },

    getPendingInvoices: async (id: string) => {
        const response = await api.get<any[]>(`/credits/accounts/${id}/pending-invoices`);
        return response.data;
    }
};
