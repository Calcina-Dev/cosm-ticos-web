"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BranchSelector } from "@/components/branch-selector";
import { useAuthStore } from "@/features/auth/auth.store";

export default function SelectBranchPage() {
    const router = useRouter();
    const { branchId, isAuthenticated } = useAuthStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted && isAuthenticated && branchId) {
            router.push("/dashboard");
        }
    }, [mounted, isAuthenticated, branchId, router]);

    if (!mounted) return null;

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
            <Card className="w-full max-w-sm text-center">
                <CardHeader>
                    <CardTitle>Selecciona una Sucursal</CardTitle>
                    <CardDescription>
                        Para continuar, por favor selecciona la empresa y sucursal donde operarás.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center pb-8">
                    <BranchSelector />
                </CardContent>
            </Card>
        </div>
    );
}
