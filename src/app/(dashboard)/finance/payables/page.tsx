"use client";

import { useQuery } from "@tanstack/react-query";
import { creditsService, CreditAccount } from "@/features/credits/credits.service";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Eye, Truck } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { AccountDetailsModal } from "@/features/credits/components/account-details-modal";

export default function PayablesPage() {
    const [selectedAccount, setSelectedAccount] = useState<CreditAccount | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data: accounts, isLoading, refetch } = useQuery({
        queryKey: ["credit-accounts", "payables"],
        queryFn: () => creditsService.getAccounts({}),
        select: (data) => data.filter(acc => acc.supplierId) // Only supplier accounts
    });

    const handleViewDetails = (account: CreditAccount) => {
        setSelectedAccount(account);
        setIsModalOpen(true);
    };

    const columns: ColumnDef<CreditAccount>[] = [
        {
            id: "supplier_name",
            accessorKey: "supplier.name",
            header: "Proveedor",
            cell: ({ row }) => <span className="font-medium">{row.original.supplier?.name}</span>
        },
        {
            accessorKey: "balance",
            header: "Saldo a Pagar",
            cell: ({ row }) => (
                <span className={`font-bold ${Number(row.original.balance) > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                    {formatCurrency(row.original.balance)}
                </span>
            )
        },
        {
            accessorKey: "creditLimit",
            header: "Línea de Crédito",
            cell: ({ row }) => formatCurrency(row.original.creditLimit)
        },
        {
            id: "status",
            header: "Estado",
            cell: ({ row }) => {
                const hasDebt = Number(row.original.balance) > 0;
                return (
                    <Badge variant={hasDebt ? "destructive" : "secondary"}>
                        {hasDebt ? "Deuda Pendiente" : "Sin deuda"}
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
                        <Truck className="h-6 w-6 text-primary" />
                        <h2 className="text-3xl font-bold tracking-tight">Cuentas por Pagar</h2>
                    </div>
                    <p className="text-muted-foreground text-sm">Registro de deudas y pagos a proveedores.</p>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={accounts || []}
                searchKey="supplier_name"
                placeholder="Buscar proveedor..."
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
