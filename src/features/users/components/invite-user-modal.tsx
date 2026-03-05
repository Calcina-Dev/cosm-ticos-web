"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usersService, Role } from "@/features/users/users.service";
import { toast } from "sonner";
import { UserPlus, Mail, Lock, Shield } from "lucide-react";

interface InviteUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    roles: Role[];
}

export function InviteUserModal({ isOpen, onClose, roles }: InviteUserModalProps) {
    const queryClient = useQueryClient();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [roleId, setRoleId] = useState("");

    const mutation = useMutation({
        mutationFn: () => usersService.inviteUser({ email, roleId, password }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["team"] });
            toast.success("Usuario invitado/creado con éxito");
            handleClose();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Error al invitar al usuario");
        }
    });

    const handleClose = () => {
        setEmail("");
        setPassword("");
        setRoleId("");
        onClose();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !roleId) {
            toast.error("El correo y el rol son obligatorios.");
            return;
        }
        mutation.mutate();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[425px] rounded-3xl p-6">
                <DialogHeader className="mb-4">
                    <div className="mx-auto w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
                        <UserPlus className="h-6 w-6" />
                    </div>
                    <DialogTitle className="text-xl font-black text-center text-slate-800">Invitar Miembro</DialogTitle>
                    <DialogDescription className="text-center">
                        Ingresa los datos del nuevo miembro para darle acceso al sistema.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-xs font-bold uppercase text-slate-500">Correo Electrónico</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <Input
                                id="email"
                                type="email"
                                placeholder="usuario@empresa.com"
                                className="pl-10 rounded-xl"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-xs font-bold uppercase text-slate-500">Contraseña (Opcional si ya existe)</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <Input
                                id="password"
                                type="password"
                                placeholder="********"
                                className="pl-10 rounded-xl"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="role" className="text-xs font-bold uppercase text-slate-500">Rol Principal</Label>
                        <Select value={roleId} onValueChange={setRoleId}>
                            <SelectTrigger className="rounded-xl">
                                <div className="flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-slate-400" />
                                    <SelectValue placeholder="Seleccionar un rol" />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                {roles.map((role) => (
                                    <SelectItem key={role.id} value={role.id} className="cursor-pointer">
                                        <div className="flex flex-col">
                                            <span className="font-bold">{role.name}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <Button type="button" variant="outline" className="flex-1 rounded-xl font-bold" onClick={handleClose}>
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 rounded-xl font-bold shadow-lg shadow-indigo-100"
                            disabled={mutation.isPending}
                        >
                            {mutation.isPending ? "Procesando..." : "Invitar y Asignar"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
