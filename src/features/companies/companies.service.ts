import apiClient from "@/lib/axios";
import { Branch, Company, CompanyUser } from "./types";

export const companiesService = {
    getUserCompanies: async (): Promise<CompanyUser[]> => {
        // Assuming backend has an endpoint to get companies associated with the user
        // Provide a fallback or mock if the endpoint logic is strictly /auth/profile with includes
        // But typically: GET /companies/my-companies or similar.
        // Let's assume GET /users/me/companies based on typical patterns, or filter from profile.

        // For now, let's use a hypothetical endpoint. If it fails, we can adjust.
        const { data } = await apiClient.get<CompanyUser[]>("/companies/user/list");
        return data;
    },

    getCompanyBranches: async (companyId: string): Promise<Branch[]> => {
        const { data } = await apiClient.get<Branch[]>(`/companies/${companyId}/branches`);
        return data;
    },

    getPublicCompanies: async (): Promise<Partial<Company>[]> => {
        const { data } = await apiClient.get<Partial<Company>[]>("/companies");
        return data;
    },
};
