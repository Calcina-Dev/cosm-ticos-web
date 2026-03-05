'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { superAdminService } from '../services/super-admin.service';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Users, MapPin, Mail, Shield } from 'lucide-react';

interface CompanyDetailsDialogProps {
    companyId: string | null;
    onOpenChange: (open: boolean) => void;
}

export function CompanyDetailsDialog({ companyId, onOpenChange }: CompanyDetailsDialogProps) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (companyId) {
            loadDetails();
        }
    }, [companyId]);

    const loadDetails = async () => {
        setLoading(true);
        try {
            const details = await superAdminService.getCompanyDetails(companyId!);
            setData(details);
        } catch (error) {
            console.error('Error loading details:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={!!companyId} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Building2 className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <DialogTitle>{data?.name || 'Cargando...'}</DialogTitle>
                            <DialogDescription>
                                Detalles técnicos y recursos de la empresa
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {loading ? (
                    <div className="py-12 flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    </div>
                ) : data && (
                    <Tabs defaultValue="branches" className="mt-4">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="branches" className="gap-2">
                                <MapPin className="w-4 h-4" /> Sucursales ({data.branches.length})
                            </TabsTrigger>
                            <TabsTrigger value="users" className="gap-2">
                                <Users className="w-4 h-4" /> Usuarios ({data.users.length})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="branches" className="space-y-4 pt-4">
                            <div className="grid gap-3">
                                {data.branches.map((branch: any) => (
                                    <div key={branch.id} className="p-4 rounded-xl border bg-muted/30 flex justify-between items-center group hover:bg-muted transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-background border flex items-center justify-center">
                                                <MapPin className="w-5 h-5 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <div className="font-semibold">{branch.name}</div>
                                                <div className="text-xs text-muted-foreground font-mono">{branch.id}</div>
                                            </div>
                                        </div>
                                        <Badge variant={branch.active ? 'default' : 'secondary'}>
                                            {branch.active ? 'Activa' : 'Inactiva'}
                                        </Badge>
                                    </div>
                                ))}
                                {data.branches.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No hay sucursales registradas.
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="users" className="space-y-4 pt-4">
                            <div className="grid gap-3">
                                {data.users.map((item: any) => (
                                    <div key={item.id} className="p-4 rounded-xl border bg-muted/30 flex justify-between items-center hover:bg-muted transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-background border flex items-center justify-center">
                                                <Users className="w-5 h-5 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <div className="font-semibold flex items-center gap-2">
                                                    {item.user.email}
                                                    {item.id === data.ownerId && (
                                                        <Badge variant="outline" className="text-[10px] bg-yellow-50 text-yellow-700 border-yellow-200">Owner</Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <div className="text-xs flex items-center gap-1 text-muted-foreground">
                                                        <Shield className="w-3 h-3" /> {item.role.name}
                                                    </div>
                                                    <div className="text-xs flex items-center gap-1 text-muted-foreground font-mono">
                                                        ID: {item.user.id.substring(0, 8)}...
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <Badge variant={item.user.active ? 'default' : 'secondary'}>
                                            {item.user.active ? 'Activo' : 'Inactivo'}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>
                )}
            </DialogContent>
        </Dialog>
    );
}
