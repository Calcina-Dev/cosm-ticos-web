"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { AuditLog } from "@/features/audit/audit.service";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface AuditDetailsDialogProps {
    log: AuditLog | null;
    isOpen: boolean;
    onClose: () => void;
}

export function AuditDetailsDialog({ log, isOpen, onClose }: AuditDetailsDialogProps) {
    if (!log) return null;

    const renderJson = (data: any) => {
        if (!data || Object.keys(data).length === 0) return <span className="text-muted-foreground italic">N/A</span>;
        return (
            <pre className="text-[10px] bg-slate-900 text-slate-100 p-4 rounded-xl overflow-x-auto font-mono">
                {JSON.stringify(data, null, 2)}
            </pre>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 overflow-hidden rounded-3xl">
                <DialogHeader className="p-6 bg-slate-50 border-b">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <DialogTitle className="text-xl font-bold tracking-tight flex items-center gap-2">
                                Detalle de Auditoría
                                <Badge variant="outline" className="text-[10px] uppercase">{log.action}</Badge>
                            </DialogTitle>
                            <p className="text-xs text-muted-foreground">
                                Realizado por <span className="font-bold text-slate-700">{log.user.email}</span> el {formatDate(log.createdAt)}
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1 p-6">
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-3 rounded-xl border">
                                <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Entidad</p>
                                <p className="text-sm font-medium">{log.entityType}</p>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-xl border">
                                <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">ID Entidad</p>
                                <p className="text-[10px] font-mono truncate">{log.entityId}</p>
                            </div>
                        </div>

                        <Separator />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <h4 className="text-xs font-bold text-rose-600 uppercase flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-rose-600 rounded-full" />
                                    Datos Anteriores
                                </h4>
                                {renderJson(log.oldData)}
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-xs font-bold text-emerald-600 uppercase flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />
                                    Datos Nuevos
                                </h4>
                                {renderJson(log.newData)}
                            </div>
                        </div>

                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                            <>
                                <Separator />
                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase">Contexto Adicional (Metadata)</h4>
                                    {renderJson(log.metadata)}
                                </div>
                            </>
                        )}
                    </div>
                </ScrollArea>

                <DialogFooter className="p-4 bg-slate-50 border-t">
                    <Button onClick={onClose} className="rounded-xl">Cerrar Detalle</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
