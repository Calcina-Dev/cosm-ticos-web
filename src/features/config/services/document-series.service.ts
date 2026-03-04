import api from "@/lib/axios";

export enum DocumentType {
    NOTA_VENTA = 'NOTA_VENTA',
    BOLETA = 'BOLETA',
    FACTURA = 'FACTURA',
    NOTA_DEBITO = 'NOTA_DEBITO',
    GUIA_REMISION = 'GUIA_REMISION',
    ORDEN_COMPRA = 'ORDEN_COMPRA',
    RECIBO_COBRO = 'RECIBO_COBRO',
    RECIBO_PAGO = 'RECIBO_PAGO',
    NOTA_INGRESO = 'NOTA_INGRESO',
    NOTA_SALIDA = 'NOTA_SALIDA',
}

export interface DocumentSeries {
    id: string;
    companyId: string;
    branchId?: string;
    type: DocumentType;
    series: string;
    currentNumber: number;
    isActive: boolean;
}

export interface CreateDocumentSeriesDto {
    type: DocumentType;
    series: string;
    branchId?: string;
    initialNumber?: number;
}

export const documentSeriesService = {
    getAll: async () => {
        const response = await api.get<DocumentSeries[]>('/document-series');
        return response.data;
    },

    create: async (data: CreateDocumentSeriesDto) => {
        const response = await api.post<DocumentSeries>('/document-series', data);
        return response.data;
    },

    delete: async (id: string) => {
        await api.delete(`/document-series/${id}`);
    }
};
