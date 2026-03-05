"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, ShieldCheck, Eye, EyeOff, Sparkles, Building2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/features/auth/auth.store";
import Link from "next/link";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
    email: z.string().email({ message: "Ingresa un email válido" }),
    password: z.string().min(6, { message: "La contraseña es muy corta" }),
});

export default function LoginPage() {
    const router = useRouter();
    const login = useAuthStore((state) => state.login);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // State for multi-tenant selection
    const [requiresSelection, setRequiresSelection] = useState(false);
    const [availableCompanies, setAvailableCompanies] = useState<{ id: string; name: string }[]>([]);
    const [storedCredentials, setStoredCredentials] = useState<z.infer<typeof loginSchema> | null>(null);

    const form = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    async function handleLogin(values: z.infer<typeof loginSchema>, companyId?: string) {
        setIsLoading(true);
        try {
            const response = await login({
                email: values.email,
                password: values.password,
                companyId: companyId,
            });

            if (response.requiresSelection && response.companies) {
                setRequiresSelection(true);
                setAvailableCompanies(response.companies);
                setStoredCredentials(values);
                toast.info("Selecciona una empresa para continuar");
            } else {
                toast.success("Bienvenido al sistema", {
                    icon: <Sparkles className="h-4 w-4 text-blue-500" />,
                });

                // Redirección inteligente basada en el rol
                const user = useAuthStore.getState().user;
                if (user?.role === 'SUPER_ADMIN') {
                    router.push("/super-admin/companies");
                } else {
                    router.push("/dashboard");
                }
            }
        } catch (error: any) {
            console.error(error);
            toast.error("Error de acceso", {
                description: "Credenciales incorrectas o el usuario no tiene acceso.",
            });
        } finally {
            setIsLoading(false);
        }
    }

    const onSelectCompany = (companyId: string) => {
        if (storedCredentials) {
            handleLogin(storedCredentials, companyId);
        }
    };

    return (
        <div className="container relative h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0 overflow-hidden bg-zinc-50 dark:bg-zinc-950">
            {/* Background for small screens */}
            <div className="absolute inset-0 lg:hidden -z-10">
                <img
                    src="/Users/calcina/.gemini/antigravity/brain/0e418dc6-9695-4b6e-a500-9a0bfd6b12d9/saas_dashboard_abstract_bg_1772319067347.png"
                    alt="Background"
                    className="h-full w-full object-cover blur-[2px] opacity-40"
                />
            </div>

            {/* Left Panel: SaaS Corporate Experience */}
            <div className="relative hidden h-full flex-col p-12 text-white lg:flex select-none">
                <div className="absolute inset-0 bg-slate-950">
                    <img
                        src="/Users/calcina/.gemini/antigravity/brain/0e418dc6-9695-4b6e-a500-9a0bfd6b12d9/saas_dashboard_abstract_bg_1772319067347.png"
                        alt="SaaS Platform"
                        className="h-full w-full object-cover opacity-40 transition-transform duration-[20s] hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-950/20 to-transparent" />
                </div>

                <div className="relative z-20 flex items-center gap-3 text-2xl font-bold tracking-tight animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-500/20">
                        <ShieldCheck className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex flex-col leading-tight">
                        <span className="text-xl">SaaS <span className="font-light text-slate-400">Core</span></span>
                        <span className="text-[10px] uppercase tracking-[0.3em] text-blue-400 font-medium">Enterprise Suite</span>
                    </div>
                </div>

                <div className="relative z-20 mt-auto animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <div className="space-y-6 max-w-md">
                        <h2 className="text-4xl font-bold leading-tight tracking-tighter">
                            Optimiza tu operación con <span className="text-blue-400">datos en tiempo real</span>.
                        </h2>
                        <p className="text-slate-400 text-lg font-light leading-relaxed">
                            Control de inventarios, finanzas y ventas en una sola plataforma diseñada para escalar tu negocio.
                        </p>
                        <div className="flex items-center gap-4 pt-4">
                            <div className="flex -space-x-2">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="h-8 w-8 rounded-full border-2 border-slate-950 bg-slate-800 flex items-center justify-center text-[10px] font-bold">
                                        USR
                                    </div>
                                ))}
                            </div>
                            <span className="text-xs text-slate-500 font-medium">+1,000 empresas confían en nosotros</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel: Login Flow */}
            <div className="relative flex min-h-screen items-center justify-center p-8">
                <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[400px] animate-in fade-in zoom-in-95 duration-500">

                    {!requiresSelection ? (
                        <>
                            <div className="flex flex-col space-y-2 text-center">
                                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                                    Iniciar Sesión
                                </h1>
                                <p className="text-slate-500 dark:text-slate-400">
                                    Ingresa tus credenciales corporativas
                                </p>
                            </div>

                            <Form {...form}>
                                <form onSubmit={form.handleSubmit((v) => handleLogin(v))} className="space-y-5">
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-500">Email Corporativo</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="nombre@empresa.com"
                                                        {...field}
                                                        className="h-12 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20"
                                                    />
                                                </FormControl>
                                                <FormMessage className="text-xs" />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-500">Contraseña</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input
                                                            type={showPassword ? "text" : "password"}
                                                            placeholder="••••••••"
                                                            {...field}
                                                            className="h-12 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl pr-12 focus:ring-2 focus:ring-blue-500/20"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowPassword(!showPassword)}
                                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                                        >
                                                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                                        </button>
                                                    </div>
                                                </FormControl>
                                                <FormMessage className="text-xs" />
                                            </FormItem>
                                        )}
                                    />
                                    <Button
                                        type="submit"
                                        className="w-full h-12 mt-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-blue-600 dark:hover:bg-blue-500 font-semibold"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Continuar"}
                                    </Button>
                                </form>
                            </Form>
                        </>
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="flex flex-col space-y-2 text-center">
                                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                    Selecciona tu Entorno
                                </h1>
                                <p className="text-slate-500 dark:text-slate-400">
                                    Hemos detectado múltiples empresas asociadas a tu cuenta
                                </p>
                            </div>

                            <div className="grid gap-3">
                                {availableCompanies.map((company) => (
                                    <button
                                        key={company.id}
                                        onClick={() => onSelectCompany(company.id)}
                                        disabled={isLoading}
                                        className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-500/5 transition-all text-left group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900 transition-colors">
                                                <Building2 className="h-5 w-5 text-slate-500 group-hover:text-blue-600 dark:text-slate-400 dark:group-hover:text-blue-400" />
                                            </div>
                                            <div>
                                                <div className="font-semibold text-slate-900 dark:text-white capitalize">{company.name.toLowerCase()}</div>
                                                <div className="text-xs text-slate-500 uppercase tracking-tighter">Entorno Activo</div>
                                            </div>
                                        </div>
                                        <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => {
                                    setRequiresSelection(false);
                                    setStoredCredentials(null);
                                }}
                                className="w-full py-2 text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors"
                            >
                                ← Volver al inicio
                            </button>
                        </div>
                    )}

                    <div className="text-center text-xs text-slate-400 pt-8 border-t border-slate-100 dark:border-slate-900">
                        <p>© 2026 SaaS Core Enterprise.</p>
                        <p className="mt-1">Seguridad avanzada y gestión descentralizada.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
