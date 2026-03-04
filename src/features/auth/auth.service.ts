import apiClient from "@/lib/axios";
import { AuthResponse, LoginPayload, User } from "./types";

export const authService = {
    login: async (payload: LoginPayload): Promise<AuthResponse> => {
        const { data } = await apiClient.post<AuthResponse>("/auth/login", payload);
        return data;
    },

    getProfile: async (): Promise<User> => {
        const { data } = await apiClient.get<User>("/auth/me");
        return data;
    },
};
