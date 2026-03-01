import api from "@/lib/axios";

export enum AuditAction {
    CREATE = "CREATE",
    UPDATE = "UPDATE",
    DELETE = "DELETE",
    PRICE_CHANGE = "PRICE_CHANGE",
    CREDIT_LIMIT_CHANGE = "CREDIT_LIMIT_CHANGE",
    STOCK_ADJUSTMENT = "STOCK_ADJUSTMENT",
    OVERRIDE = "OVERRIDE"
}

export interface AuditLog {
    id: string;
    companyId: string;
    userId: string;
    entityType: string;
    entityId: string;
    action: AuditAction;
    oldData: any;
    newData: any;
    metadata: any;
    createdAt: string;
    user: {
        id: string;
        email: string;
    };
}

export const auditService = {
    findAll: async (params: {
        userId?: string;
        entityType?: string;
        action?: string;
        startDate?: string;
        endDate?: string;
    }) => {
        const response = await api.get<AuditLog[]>("/audit", { params });
        return response.data;
    },

    getEntityLogs: async (entityType: string, entityId: string) => {
        const response = await api.get<AuditLog[]>(`/audit/${entityType}/${entityId}`);
        return response.data;
    }
};
