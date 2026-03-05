import axiosInstance from '@/lib/axios';
import { SuperAdminCompany, SuperAdminUser, CreateCompanyDto } from '../types';

export const superAdminService = {
    getCompanies: async (): Promise<SuperAdminCompany[]> => {
        const response = await axiosInstance.get('/super-admin/companies');
        return response.data;
    },

    createCompany: async (data: CreateCompanyDto): Promise<SuperAdminCompany> => {
        const response = await axiosInstance.post('/super-admin/companies', data);
        return response.data;
    },

    getUsers: async (): Promise<SuperAdminUser[]> => {
        const response = await axiosInstance.get('/super-admin/users');
        return response.data;
    },

    getCompanyDetails: async (id: string): Promise<any> => {
        const response = await axiosInstance.get(`/super-admin/companies/${id}/details`);
        return response.data;
    },

    impersonate: async (id: string): Promise<{ access_token: string, companyId: string, companyName: string }> => {
        const response = await axiosInstance.post(`/super-admin/companies/${id}/impersonate`);
        return response.data;
    }
};
