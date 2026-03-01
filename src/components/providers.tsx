'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { ReactNode, useState } from 'react';
import AuthGuard from "@/components/auth-guard";

export default function Providers({ children }: { children: ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000,
                retry: (failureCount, error: any) => {
                    const status = error?.response?.status;
                    if (status && status >= 400 && status < 500) {
                        return false;
                    }
                    return failureCount < 1;
                },
            },
            mutations: {
                networkMode: 'always',
            }
        },
    }));

    return (
        <QueryClientProvider client={queryClient}>
            <NextThemesProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
            >
                <AuthGuard>
                    {children}
                </AuthGuard>
            </NextThemesProvider>
        </QueryClientProvider>
    );
}
