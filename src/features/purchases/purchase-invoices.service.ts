import apiClient from '@/lib/axios';
import { PaginatedResponse, PurchaseInvoice, CreatePurchaseInvoicePayload } from './types';

export const purchaseInvoicesService = {
    async findAll(params?: { limit?: number; page?: number; purchaseId?: string }): Promise<PaginatedResponse<PurchaseInvoice>> {
        const { data } = await apiClient.get('/purchase-invoices', { params });
        return data;
    },

    async findOne(id: string): Promise<PurchaseInvoice> {
        const { data } = await apiClient.get(`/purchase-invoices/${id}`);
        return data;
    },

    async create(payload: CreatePurchaseInvoicePayload): Promise<PurchaseInvoice> {
        const { data } = await apiClient.post('/purchase-invoices', payload);
        return data;
    },

    async cancel(id: string): Promise<PurchaseInvoice> {
        const { data } = await apiClient.post(`/purchase-invoices/${id}/cancel`);
        return data;
    }
};
