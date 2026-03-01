import api from "@/lib/axios";

export interface SalesSummary {
    totalSales: number;
    totalAmount: number;
    totalSubtotal: number;
    totalTax: number;
    totalMargin: number;
    averageTicket: number;
    salesByPaymentMethod: {
        paymentMethodId: string;
        paymentMethodName: string;
        count: number;
        amount: number;
    }[];
    salesByDay: {
        date: string;
        count: number;
        amount: number;
        tax: number;
        margin: number;
    }[];
}

export interface TopProduct {
    variantId: string;
    productName: string;
    variantSku: string;
    quantitySold: number;
    totalRevenue: number;
}

export interface StockStatus {
    warehouseId: string;
    warehouseName: string;
    variants: {
        variantId: string;
        productName: string;
        sku: string;
        onHand: number;
        avgCost: number;
        totalValue: number;
        status: 'OUT_OF_STOCK' | 'LOW' | 'OK';
    }[];
}

export interface InventoryValuation {
    totalValue: number;
    byWarehouse: {
        warehouseId: string;
        warehouseName: string;
        value: number;
    }[];
}

export interface CashSession {
    sessionId: string;
    registerName: string;
    userName: string;
    startTime: string;
    endTime: string | null;
    startAmount: number;
    endAmount: number | null;
    totalIncome: number;
    totalExpense: number;
    expectedBalance: number;
    status: 'OPEN' | 'CLOSED';
}

export interface CashSessionsSummary {
    sessions: CashSession[];
}

export interface CashTransaction {
    id: string;
    sessionId: string;
    type: 'INCOME' | 'EXPENSE';
    amount: number;
    description: string;
    createdAt: string;
}

export interface CashTransactionsReport {
    transactions: CashTransaction[];
    summary: {
        totalIncome: number;
        totalExpense: number;
        netCash: number;
    };
}

export const reportsService = {
    getSalesSummary: async (params: { startDate: string; endDate: string; warehouseId?: string }) => {
        const response = await api.get<SalesSummary>("/reports/sales/summary", { params });
        return response.data;
    },

    getTopProducts: async (params: { startDate: string; endDate: string; limit?: number }) => {
        const response = await api.get<TopProduct[]>("/reports/sales/top-products", { params });
        return response.data;
    },

    getStockStatus: async (params: { warehouseId?: string; lowStockThreshold?: number }) => {
        const response = await api.get<StockStatus[]>("/reports/inventory/stock-status", { params });
        return response.data;
    },

    getInventoryValuation: async (warehouseId?: string) => {
        const response = await api.get<InventoryValuation>("/reports/inventory/valuation", { params: { warehouseId } });
        return response.data;
    },

    getCashSessionsSummary: async (params: { startDate: string; endDate: string; registerId?: string; userId?: string }) => {
        const response = await api.get<CashSessionsSummary>("/reports/cash/sessions-summary", { params });
        return response.data;
    },

    getCashTransactions: async (params: { startDate: string; endDate: string; sessionId?: string; type?: 'INCOME' | 'EXPENSE' }) => {
        const response = await api.get<CashTransactionsReport>("/reports/cash/transactions", { params });
        return response.data;
    }
};
