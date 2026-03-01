import api from "@/lib/axios";
import { CashTransaction } from "./cash-sessions.service";

export interface CreateTransactionDto {
    type: 'INCOME' | 'EXPENSE';
    amount: number;
    description: string;
    expenseTypeId?: string;
}

export const cashTransactionsService = {
    create: async (data: CreateTransactionDto) => {
        const response = await api.post<CashTransaction>('/cash-transactions', data);
        return response.data;
    },

    findAll: async (sessionId?: string) => {
        const params = sessionId ? { sessionId } : {};
        const response = await api.get<CashTransaction[]>('/cash-transactions', { params });
        return response.data;
    }
};
