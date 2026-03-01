"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/features/auth/auth.store";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated, _hasHydrated } = useAuthStore();

    useEffect(() => {
        // Prevent redirect until state is hydrated
        if (!_hasHydrated) return;

        // If not authenticated and not on login page, redirect to login
        if (!isAuthenticated && pathname !== "/login") {
            router.push("/login");
        }
        // If authenticated and on login page, redirect to dashboard
        if (isAuthenticated && pathname === "/login") {
            router.push("/dashboard");
        }
    }, [isAuthenticated, _hasHydrated, pathname, router]);

    // Show nothing while rehydrating to prevent flash of content or premature redirect
    if (!_hasHydrated) return null;

    return <>{children}</>;
}
