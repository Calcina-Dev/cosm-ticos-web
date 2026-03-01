import api from "@/lib/axios";

export interface SearchResult {
    products: any[];
    customers: any[];
    sales: any[];
    stockMovements: any[];
}

export const searchService = {
    globalSearch: async (query: string): Promise<SearchResult> => {
        if (!query || query.length < 2) return { products: [], customers: [], sales: [], stockMovements: [] };
        const { data } = await api.get(`/search/global?q=${encodeURIComponent(query)}`);
        return data;
    },
};
