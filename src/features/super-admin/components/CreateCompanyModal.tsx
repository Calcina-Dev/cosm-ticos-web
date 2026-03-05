'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { superAdminService } from '../services/super-admin.service';
import { CreateCompanyDto } from '../types';
import { toast } from 'sonner';
import { Building2, Mail, Lock, CheckCircle2 } from 'lucide-react';

interface CreateCompanyModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function CreateCompanyModal({ open, onOpenChange, onSuccess }: CreateCompanyModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<CreateCompanyDto>({
        name: '',
        ruc: '',
        adminEmail: '',
        adminPassword: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await superAdminService.createCompany(formData);
            toast.success('Empresa creada correctamente');
            onSuccess();
            onOpenChange(false);
            setFormData({ name: '', ruc: '', adminEmail: '', adminPassword: '' });
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al crear la empresa');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-primary" />
                            Registrar Nueva Empresa
                        </DialogTitle>
                        <DialogDescription>
                            Completa los datos para dar de alta un nuevo cliente en el SaaS.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-6">
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold border-b pb-2 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-500" /> Datos de la Empresa
                            </h3>
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nombre Comercial *</Label>
                                <Input
                                    id="name"
                                    required
                                    placeholder="Ej. Distribuidora S.A.C."
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="ruc">RUC (Opcional)</Label>
                                <Input
                                    id="ruc"
                                    placeholder="20123456789"
                                    value={formData.ruc}
                                    onChange={(e) => setFormData({ ...formData, ruc: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold border-b pb-2 flex items-center gap-2">
                                <Mail className="w-4 h-4 text-blue-500" /> Administrador Inicial
                            </h3>
                            <div className="grid gap-2">
                                <Label htmlFor="adminEmail">Correo Electrónico *</Label>
                                <Input
                                    id="adminEmail"
                                    type="email"
                                    required
                                    placeholder="admin@empresa.com"
                                    value={formData.adminEmail}
                                    onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="adminPassword">Contraseña Inicial *</Label>
                                <div className="relative">
                                    <Input
                                        id="adminPassword"
                                        type="password"
                                        required
                                        placeholder="••••••••"
                                        value={formData.adminPassword}
                                        onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                                    />
                                    <Lock className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Creando...' : 'Crear Empresa'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
