"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    LineChart,
    BarChart,
    PieChart,
    FileText,
    TrendingUp,
    Package,
    ArrowRight,
    DollarSign,
    ShoppingCart,
    AlertTriangle
} from "lucide-react";
import Link from "next/link";

export default function ReportsHubPage() {
    const modules = [
        {
            title: "Reporte de Ventas",
            description: "Análisis detallado de ingresos, márgenes, ticket promedio y métodos de pago.",
            icon: LineChart,
            color: "text-blue-600",
            bg: "bg-blue-50",
            href: "/reports/sales",
            stats: "Ver rendimiento"
        },
        {
            title: "Análisis de Inventario",
            description: "Valoración de stock, rotación de productos y alertas de stock bajo.",
            icon: Package,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            href: "/reports/inventory",
            stats: "Optimizar stock"
        },
        {
            title: "Reportes de Caja",
            description: "Resumen de sesiones, arqueos y transacciones de efectivo.",
            icon: DollarSign,
            color: "text-amber-600",
            bg: "bg-amber-50",
            href: "/reports/cash",
            stats: "Historial de caja"
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h2 className="text-3xl font-black tracking-tighter text-slate-800">Centro de Reportes</h2>
                <p className="text-muted-foreground">Selecciona un área para visualizar métricas detalladas y análisis de rendimiento.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {modules.map((module) => (
                    <Link key={module.href} href={module.href}>
                        <Card className="h-full hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer border-none shadow-sm group">
                            <CardHeader>
                                <div className={`w-12 h-12 ${module.bg} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                    <module.icon className={`h-6 w-6 ${module.color}`} />
                                </div>
                                <CardTitle className="text-xl font-bold">{module.title}</CardTitle>
                                <CardDescription className="text-sm leading-relaxed">
                                    {module.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between text-sm font-bold text-primary">
                                    <span>{module.stats}</span>
                                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-none shadow-sm bg-gradient-to-br from-slate-900 to-slate-800 text-white">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            Próximamente: Proyecciones Inteligentes
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                            Estamos trabajando en modelos de IA para predecir tus ventas y necesidades de stock.
                        </CardDescription>
                    </CardHeader>
                </Card>

                <Card className="border-none shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Reportes Personalizados
                        </CardTitle>
                        <CardDescription>
                            ¿Necesitas un reporte específico? Contáctanos para diseñar una vista a tu medida.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        </div>
    );
}
