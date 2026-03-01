import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User, LoginPayload, AuthResponse } from "./types";
import { authService } from "./auth.service";
import { jwtDecode } from "jwt-decode";

interface AuthState {
    user: User | null;
    token: string | null;
    companyId: string | null;
    branchId: string | null;
    isAuthenticated: boolean;
    login: (payload: LoginPayload) => Promise<AuthResponse>;
    logout: () => void;
    setUser: (user: User) => void;
    setCompanyId: (id: string | null) => void;
    setBranchId: (id: string | null) => void;
    _hasHydrated: boolean;
    setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            companyId: null,
            branchId: null,
            isAuthenticated: false,
            login: async (payload: LoginPayload) => {
                try {
                    const response = await authService.login(payload);

                    if (response.requiresSelection) {
                        return response;
                    }

                    const token = response.access_token!;
                    const decoded: any = jwtDecode(token);

                    const user: User = {
                        id: decoded.sub,
                        email: decoded.email,
                        name: decoded.name,
                        companyName: decoded.companyName,
                        role: decoded.role,
                        permissions: decoded.permissions || [],
                        active: true,
                    };

                    set({
                        user,
                        token,
                        isAuthenticated: true,
                        companyId: decoded.companyId,
                        branchId: null,
                    });

                    return response;
                } catch (error) {
                    throw error;
                }
            },
            logout: () => {
                set({ user: null, token: null, isAuthenticated: false, companyId: null, branchId: null });
                localStorage.removeItem("auth-storage"); // Clear persisted state
            },
            setUser: (user: User) => set({ user }),
            setCompanyId: (id: string | null) => set({ companyId: id }),
            setBranchId: (id: string | null) => set({ branchId: id }),
            _hasHydrated: false,
            setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
        }),
        {
            name: "auth-storage",
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);

                // If we have a token but user data is incomplete (old session), re-decode
                if (state?.token && (!state.user?.role || !state.user?.permissions)) {
                    try {
                        const decoded: any = jwtDecode(state.token);
                        const updatedUser: User = {
                            id: decoded.sub,
                            email: decoded.email,
                            name: decoded.name,
                            companyName: decoded.companyName,
                            role: decoded.role,
                            permissions: decoded.permissions || [],
                            active: true,
                        };
                        state.setUser(updatedUser);
                    } catch (e) {
                        console.error("Error re-decoding session token during hydration", e);
                    }
                }
            },
        }
    )
);
