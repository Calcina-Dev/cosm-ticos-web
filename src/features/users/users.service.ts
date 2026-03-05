import api from "@/lib/axios";

export interface User {
    id: string;
    email: string;
    active: boolean;
    createdAt: string;
}

export interface Role {
    id: string;
    companyId: string;
    name: string;
    permissions: string[];
}

export interface CompanyMembership {
    id: string;
    companyId: string;
    userId: string;
    roleId: string | null;
    permissions: string[];
    user: User;
    role: Role | null;
}

export const usersService = {
    findAll: async () => {
        const response = await api.get<CompanyMembership[]>("/users");
        return response.data;
    },

    getRoles: async () => {
        const response = await api.get<Role[]>("/users/roles");
        return response.data;
    },

    updateMembership: async (membershipId: string, data: { roleId?: string; permissions?: string[] }) => {
        const response = await api.patch<CompanyMembership>(`/users/${membershipId}`, data);
        return response.data;
    },

    inviteUser: async (data: { email: string; roleId: string; password?: string }) => {
        const response = await api.post<CompanyMembership>("/users/invite", data);
        return response.data;
    },

    updatePin: async (pin: string) => {
        const response = await api.put<User>("/users/me/pin", { pin });
        return response.data;
    }
};
