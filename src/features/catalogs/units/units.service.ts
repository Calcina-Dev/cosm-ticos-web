import apiClient from "@/lib/axios";
import { CreateUnitPayload, Unit, UpdateUnitPayload } from "./types";

const BASE_URL = "/units"; // Verify backend route, usually /config/units or /units

export const unitsService = {
    getAll: async (): Promise<Unit[]> => {
        const { data } = await apiClient.get<Unit[]>(BASE_URL);
        return data;
    },

    getById: async (id: string): Promise<Unit> => {
        const { data } = await apiClient.get<Unit>(`${BASE_URL}/${id}`);
        return data;
    },

    create: async (payload: CreateUnitPayload): Promise<Unit> => {
        const { data } = await apiClient.post<Unit>(BASE_URL, payload);
        return data;
    },

    update: async (id: string, payload: UpdateUnitPayload): Promise<Unit> => {
        const { data } = await apiClient.patch<Unit>(`${BASE_URL}/${id}`, payload);
        return data;
    },

    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`${BASE_URL}/${id}`);
    },
};
