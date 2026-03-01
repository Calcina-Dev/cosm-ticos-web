"use client";

import { ReactNode, useState, useEffect } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import { CashClosingModal } from "@/features/cash/components/cash-closing-modal";
import { TransactionModal } from "@/features/cash/components/transaction-modal";
import { cashSessionsService } from "@/features/cash/services/cash-sessions.service";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface PosLayoutProps {
    children: ReactNode;
}

export function PosLayout({ children }: PosLayoutProps) {
    const router = useRouter();
    const [isClosingOpen, setIsClosingOpen] = useState(false);
    const [isTransactionOpen, setIsTransactionOpen] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);

    // Function to check active session
    const checkSession = async () => {
        try {
            const session = await cashSessionsService.getActiveSession();
            if (session) {
                setSessionId(session.id);
            }
        } catch (error) {
            console.error(error);
        }
    }

    useEffect(() => {
        checkSession();
    }, []);

    const handleCloseSuccess = () => {
        setSessionId(null);
        router.push('/dashboard');
    };

    return (
        <div className="h-screen flex flex-col bg-background">
            <header className="h-14 border-b flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/dashboard">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <h1 className="text-xl font-bold">Punto de Venta</h1>
                </div>
                <div className="flex items-center gap-2">
                    {sessionId && (
                        <>
                            <Button variant="outline" size="sm" onClick={() => setIsTransactionOpen(true)}>
                                <span className="mr-2 font-bold">$</span>
                                Movimientos
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => setIsClosingOpen(true)}>
                                <Lock className="mr-2 h-4 w-4" />
                                Cerrar Caja
                            </Button>
                        </>
                    )}
                    <ThemeToggle />
                </div>
            </header>
            <main className="flex-1 overflow-hidden">
                {children}
            </main>

            {sessionId && (
                <>
                    <CashClosingModal
                        open={isClosingOpen}
                        onOpenChange={setIsClosingOpen}
                        sessionId={sessionId}
                        onSuccess={handleCloseSuccess}
                    />
                    <TransactionModal
                        open={isTransactionOpen}
                        onOpenChange={setIsTransactionOpen}
                    />
                </>
            )}
        </div>
    );
}
