"use client";

import { useQuery } from "@tanstack/react-query";
import { creditsService, CreditAccount } from "@/features/credits/credits.service";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Eye, PlusCircle, Wallet } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { AccountDetailsModal } from "@/features/credits/components/account-details-modal";

export default function ReceivablesPage() {
    const [selectedAccount, setSelectedAccount] = useState<CreditAccount | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data: accounts, isLoading, refetch } = useQuery({
        queryKey: ["credit-accounts", "receivables"],
        queryFn: () => creditsService.getAccounts({}),
        select: (data) => data.filter(acc => acc.customerId) // Only customer accounts
    });

    const handleViewDetails = (account: CreditAccount) => {
        setSelectedAccount(account);
        setIsModalOpen(true);
    };

    const columns: ColumnDef<CreditAccount>[] = [
        {
            id: "customer_name",
            accessorKey: "customer.name",
            header: "Cliente",
            cell: ({ row }) => <span className="font-medium">{row.original.customer?.name}</span>
        },
        {
            accessorKey: "balance",
            header: "Saldo Pendiente",
            cell: ({ row }) => (
                <span className={`font-bold ${Number(row.original.balance) > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                    {formatCurrency(row.original.balance)}
                </span>
            )
        },
        {
            accessorKey: "creditLimit",
            header: "Límite de Crédito",
            cell: ({ row }) => formatCurrency(row.original.creditLimit)
        },
        {
            id: "usage",
            header: "Utilización",
            cell: ({ row }) => {
                const percent = (Number(row.original.balance) / Number(row.original.creditLimit)) * 100;
                return (
                    <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full ${percent > 90 ? "bg-rose-500" : percent > 50 ? "bg-amber-500" : "bg-emerald-500"}`}
                                style={{ width: `${Math.min(percent, 100)}%` }}
                            />
                        </div>
                        <span className="text-[10px] text-muted-foreground">{percent.toFixed(0)}%</span>
                    </div>
                );
            }
        },
        {
            id: "status",
            header: "Estado",
            cell: ({ row }) => {
                const hasDebt = Number(row.original.balance) > 0;
                return (
                    <Badge variant={hasDebt ? "outline" : "secondary"}>
                        {hasDebt ? "Pendiente" : "Al día"}
                    </Badge>
                );
            }
        },
        {
            id: "actions",
            cell: ({ row }) => (
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleViewDetails(row.original)}>
                        <Eye className="h-4 w-4 mr-1" />
                        Detalles
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <Wallet className="h-6 w-6 text-primary" />
                        <h2 className="text-3xl font-bold tracking-tight">Cuentas por Cobrar</h2>
                    </div>
                    <p className="text-muted-foreground text-sm">Gestión de créditos y cobranzas a clientes.</p>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={accounts || []}
                searchKey="customer_name" // Note: DataTable implementation might need adjustment for nested keys or I should flatten
                placeholder="Buscar cliente..."
            />

            {selectedAccount && (
                <AccountDetailsModal
                    account={selectedAccount}
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedAccount(null);
                        refetch();
                    }}
                />
            )}
        </div>
    );
}
