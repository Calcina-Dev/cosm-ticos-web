import apiClient from "@/lib/axios";
import { StockBalance, StockMovement, CreateMovementPayload, StockTransfer, CreateTransferPayload } from "./types";

interface PaginatedResponse<T> {
    items: T[];
    meta: {
        total: number;
        page: number;
        lastPage: number;
        limit: number;
        offset: number;
    };
}

interface GetMovementsParams {
    limit?: number;
    offset?: number;
    page?: number;
    variantId?: string;
    warehouseId?: string;
    type?: string;
    search?: string;
    fromDate?: string;
    toDate?: string;
}

export const stockService = {
    getSummary: async (): Promise<StockBalance[]> => {
        const { data } = await apiClient.get<StockBalance[]>("/stock/summary");
        return data;
    },

    getMovements: async (params: GetMovementsParams = {}): Promise<PaginatedResponse<StockMovement>> => {
        const { data } = await apiClient.get<PaginatedResponse<StockMovement>>("/stock/movements", {
            params,
        });
        return data;
    },

    createMovement: async (payload: CreateMovementPayload): Promise<StockMovement> => {
        const { data } = await apiClient.post<StockMovement>("/stock/movements", payload);
        return data;
    },

    getTransfers: async (params: any = {}): Promise<PaginatedResponse<StockTransfer>> => {
        const { data } = await apiClient.get<PaginatedResponse<StockTransfer>>("/stock/transfers", {
            params,
        });
        return data;
    },

    getTransferById: async (id: string): Promise<StockTransfer> => {
        const { data } = await apiClient.get<StockTransfer>(`/stock/transfers/${id}`);
        return data;
    },

    createTransfer: async (payload: CreateTransferPayload): Promise<StockTransfer> => {
        const { data } = await apiClient.post<StockTransfer>("/stock/transfers", payload);
        return data;
    },
};
