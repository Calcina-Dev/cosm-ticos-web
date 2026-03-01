import api from "@/lib/axios";

export enum DocumentType {
    SALE = 'SALE',
    PURCHASE = 'PURCHASE',
    QUOTATION = 'QUOTATION',
    STOCK_MOVEMENT = 'STOCK_MOVEMENT',
    CREDIT_MOVEMENT = 'CREDIT_MOVEMENT',
    CASH_TRANSACTION = 'CASH_TRANSACTION',
    STOCK_TRANSFER = 'STOCK_TRANSFER',
    PURCHASE_INVOICE = 'PURCHASE_INVOICE'
}

export interface FlowNode {
    id: string;
    type: string;
    data: {
        label: string;
        total?: number;
        status?: string;
        createdAt?: string;
        customer?: string;
        supplier?: string;
        product?: string;
        warehouse?: string;
        amount?: number;
    };
    position?: { x: number, y: number };
}

export interface FlowEdge {
    id: string;
    source: string;
    target: string;
    label?: string;
}

export interface DocumentFlowResponse {
    nodes: FlowNode[];
    edges: FlowEdge[];
}

export const documentFlowService = {
    getFlow: async (id: string, type: DocumentType): Promise<DocumentFlowResponse> => {
        const response = await api.get(`/reports/document-flow/${id}`, {
            params: { type }
        });
        return response.data;
    }
};
