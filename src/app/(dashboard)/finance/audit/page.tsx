"use client";

import { useQuery } from "@tanstack/react-query";
import { auditService, AuditLog } from "@/features/audit/audit.service";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Eye, ShieldCheck, User } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { AuditDetailsDialog } from "@/features/audit/components/audit-details-dialog";

export default function AuditPage() {
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data: logs, isLoading } = useQuery({
        queryKey: ["audit-logs"],
        queryFn: () => auditService.findAll({}),
    });

    const columns: ColumnDef<AuditLog>[] = [
        {
            accessorKey: "createdAt",
            header: "Fecha y Hora",
            cell: ({ row }) => <span className="text-xs text-muted-foreground">{formatDate(row.original.createdAt)}</span>
        },
        {
            accessorKey: "user.email",
            header: "Usuario",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <div className="bg-slate-100 p-1 rounded-full">
                        <User className="h-3 w-3 text-slate-500" />
                    </div>
                    <span className="font-medium text-xs">{row.original.user.email}</span>
                </div>
            )
        },
        {
            accessorKey: "action",
            header: "Acción",
            cell: ({ row }) => (
                <Badge variant="outline" className="text-[10px] font-bold py-0 h-5 px-1.5 uppercase tracking-tight">
                    {row.original.action}
                </Badge>
            )
        },
        {
            accessorKey: "entityType",
            header: "Módulo/Entidad",
            cell: ({ row }) => (
                <span className="text-xs bg-slate-50 px-2 py-0.5 rounded border border-slate-200 font-mono">
                    {row.original.entityType}
                </span>
            )
        },
        {
            id: "actions",
            cell: ({ row }) => (
                <div className="flex justify-end">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setSelectedLog(row.original);
                            setIsModalOpen(true);
                        }}
                    >
                        <Eye className="h-4 w-4 mr-1 text-primary" />
                        <span className="text-xs">Ver Cambio</span>
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
                        <ShieldCheck className="h-6 w-6 text-primary" />
                        <h2 className="text-3xl font-bold tracking-tight">Registro de Auditoría</h2>
                    </div>
                    <p className="text-muted-foreground text-sm">Monitoreo de acciones críticas y cambios en los datos del sistema.</p>
                </div>
            </div>

            <div className="bg-white rounded-3xl border shadow-sm p-2">
                <DataTable
                    columns={columns}
                    data={logs || []}
                    searchKey="entityType"
                    placeholder="Filtrar por entidad..."
                />
            </div>

            <AuditDetailsDialog
                log={selectedLog}
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedLog(null);
                }}
            />
        </div>
    );
}
