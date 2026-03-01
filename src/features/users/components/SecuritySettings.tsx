"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { usersService } from "@/features/users/users.service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Shield, Lock, CheckCircle2, AlertCircle } from "lucide-react";

export function SecuritySettings() {
    const [pin, setPin] = useState("");
    const [confirmPin, setConfirmPin] = useState("");

    const mutation = useMutation({
        mutationFn: (newPin: string) => usersService.updatePin(newPin),
        onSuccess: () => {
            toast.success("PIN de seguridad actualizado con éxito");
            setPin("");
            setConfirmPin("");
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || "Error al actualizar el PIN";
            toast.error(message);
        }
    });

    const isPinValid = /^\d{4}$/.test(pin);
    const pinsMatch = pin === confirmPin && pin !== "";

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isPinValid) {
            toast.error("El PIN debe tener 4 dígitos numéricos");
            return;
        }
        if (!pinsMatch) {
            toast.error("Los PINs no coinciden");
            return;
        }
        mutation.mutate(pin);
    };

    return (
        <Card className="border-none shadow-lg rounded-3xl overflow-hidden">
            <CardHeader className="bg-slate-900 text-white pb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-white/10 p-2 rounded-xl">
                        <Lock className="h-5 w-5 text-indigo-300" />
                    </div>
                    <div>
                        <CardTitle className="text-xl font-black tracking-tight">PIN de Supervisor</CardTitle>
                        <CardDescription className="text-slate-400 text-xs">
                            Establece una clave de 4 dígitos para autorizar acciones críticas.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Nuevo PIN (4 dígitos)</label>
                        <Input
                            type="password"
                            inputMode="numeric"
                            maxLength={4}
                            placeholder="****"
                            className="h-12 text-center text-2xl font-black tracking-[1em] rounded-2xl border-slate-200 focus:border-indigo-500 transition-all"
                            value={pin}
                            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Confirmar PIN</label>
                        <Input
                            type="password"
                            inputMode="numeric"
                            maxLength={4}
                            placeholder="****"
                            className="h-12 text-center text-2xl font-black tracking-[1em] rounded-2xl border-slate-200 focus:border-indigo-500 transition-all"
                            value={confirmPin}
                            onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                        />
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl space-y-2">
                        <div className="flex items-center gap-2">
                            {isPinValid ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            ) : (
                                <AlertCircle className="h-4 w-4 text-slate-300" />
                            )}
                            <span className={`text-xs font-medium ${isPinValid ? 'text-emerald-700' : 'text-slate-500'}`}>
                                Debe contener exactamente 4 números
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            {pinsMatch ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            ) : (
                                <AlertCircle className="h-4 w-4 text-slate-300" />
                            )}
                            <span className={`text-xs font-medium ${pinsMatch ? 'text-emerald-700' : 'text-slate-500'}`}>
                                Los PINs coinciden
                            </span>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-12 rounded-2xl font-black uppercase tracking-tighter shadow-lg shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        disabled={!isPinValid || !pinsMatch || mutation.isPending}
                    >
                        {mutation.isPending ? "Actualizando..." : "Guardar PIN de Seguridad"}
                    </Button>
                </form>

                <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                    <div className="flex gap-3">
                        <Shield className="h-5 w-5 text-indigo-600 shrink-0" />
                        <p className="text-[11px] text-indigo-700 leading-relaxed">
                            <span className="font-bold">Protección de Datos:</span> Este PIN será requerido para anular ventas, autorizar descuentos especiales o realizar ajustes manuales de caja. <span className="underline font-black">No lo compartas con nadie.</span>
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
