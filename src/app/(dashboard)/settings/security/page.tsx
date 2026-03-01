"use client";

import { SecuritySettings } from "@/features/users/components/SecuritySettings";
import { Lock, ChevronRight, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function SecurityPage() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-2xl mx-auto pb-10">
            {/* Header */}
            <div className="space-y-1">
                <div className="flex items-center gap-2">
                    <div className="bg-indigo-100 p-2 rounded-2xl">
                        <Lock className="h-6 w-6 text-indigo-600" />
                    </div>
                    <h2 className="text-3xl font-black tracking-tighter text-slate-800">Seguridad de Cuenta</h2>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Link href="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
                    <ChevronRight className="h-3 w-3" />
                    <span className="font-bold">Seguridad</span>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {/* PIN Management Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 px-2">
                        <ShieldCheck className="h-5 w-5 text-emerald-500" />
                        <h3 className="font-bold text-slate-700">Autorización de Supervisor</h3>
                    </div>
                    <SecuritySettings />
                </div>

                {/* Information Alert */}
                <div className="bg-amber-50 border border-amber-100 p-4 rounded-3xl">
                    <div className="flex gap-4">
                        <div className="bg-amber-100 p-2 h-fit rounded-xl">
                            <Lock className="h-5 w-5 text-amber-600" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-sm font-black text-amber-800 uppercase tracking-tight">Acerca de tu PIN</h4>
                            <p className="text-xs text-amber-700 leading-relaxed font-medium">
                                Esta clave es personal e intransferible. El sistema la solicitará cada vez que intentes realizar una operación restringida fuera de tus permisos habituales o cuando la sesión de caja requiera una validación extra.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
