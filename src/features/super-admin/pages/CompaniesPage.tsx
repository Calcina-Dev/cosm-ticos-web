'use client';

// ... importaciones
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { superAdminService } from '../services/super-admin.service';
import { SuperAdminCompany } from '../types';
import { CreateCompanyModal } from '../components/CreateCompanyModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Building2, Users, MapPin, Calendar, LogIn, Info, Search, Activity, SearchX, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuthStore } from '@/features/auth/auth.store';
import { CompanyDetailsDialog } from '../components/CompanyDetailsDialog';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'sonner';
import { User } from '@/features/auth/types';
import { motion, AnimatePresence } from 'framer-motion';

export default function CompaniesPage() {
    const router = useRouter();
    const { setUser, setCompanyId, setToken } = useAuthStore();
    const [companies, setCompanies] = useState<SuperAdminCompany[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [impersonatingId, setImpersonatingId] = useState<string | null>(null);
    const [selectedDetailsId, setSelectedDetailsId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadCompanies();
    }, []);

    const loadCompanies = async () => {
        try {
            const data = await superAdminService.getCompanies();
            setCompanies(data);
        } catch (error) {
            console.error('Error loading companies:', error);
            toast.error('Error al cargar la lista de empresas');
        } finally {
            setLoading(false);
        }
    };

    const handleImpersonate = async (companyId: string) => {
        setImpersonatingId(companyId);
        try {
            const { access_token } = await superAdminService.impersonate(companyId);
            const decoded: any = jwtDecode(access_token);

            const user: User = {
                id: decoded.sub,
                email: decoded.email,
                name: decoded.name,
                companyName: decoded.companyName,
                role: decoded.role,
                permissions: decoded.permissions || [],
                active: true,
            };

            const storage = JSON.parse(localStorage.getItem('auth-storage') || '{}');
            storage.state.token = access_token;
            storage.state.user = user;
            storage.state.companyId = decoded.companyId;
            storage.state.isAuthenticated = true;
            localStorage.setItem('auth-storage', JSON.stringify(storage));

            setToken(access_token);
            setUser(user);
            setCompanyId(decoded.companyId);

            toast.success(`Bienvenido a ${decoded.companyName}`);
            router.push('/dashboard');
        } catch (error) {
            toast.error('Error al entrar a la empresa');
            console.error(error);
        } finally {
            setImpersonatingId(null);
        }
    };

    const filteredCompanies = useMemo(() => {
        return companies.filter(c =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.ruc && c.ruc.includes(searchTerm))
        );
    }, [companies, searchTerm]);

    const activeCount = companies.filter(c => c.active).length;
    const totalUsersCount = companies.reduce((acc, curr) => acc + (curr._count?.users || 0), 0);

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
                        Empresas
                    </h1>
                    <p className="text-lg text-muted-foreground">
                        Gestión centralizada de inquilinos (Tenants) en la plataforma.
                    </p>
                </div>
                <Button
                    className="gap-2 shadow-md hover:shadow-lg transition-all"
                    size="lg"
                    onClick={() => setIsModalOpen(true)}
                >
                    <Plus className="w-5 h-5" /> Registrar Empresa
                </Button>
            </div>

            {/* Metrics Section */}
            {!loading && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6"
                >
                    <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Empresas</CardTitle>
                            <Building2 className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{companies.length}</div>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Empresas Activas</CardTitle>
                            <Activity className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{activeCount}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {companies.length > 0 ? Math.round((activeCount / companies.length) * 100) : 0}% del total
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-violet-500 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Usuarios Globales</CardTitle>
                            <Users className="h-4 w-4 text-violet-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{totalUsersCount}</div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Search and Filter Section */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nombre o RUC..."
                        className="pl-10 shadow-sm h-11"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <CreateCompanyModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                onSuccess={loadCompanies}
            />

            <CompanyDetailsDialog
                companyId={selectedDetailsId}
                onOpenChange={(open) => !open && setSelectedDetailsId(null)}
            />

            {/* Content Section */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-64 rounded-xl bg-muted/60 animate-pulse border border-border" />
                    ))}
                </div>
            ) : filteredCompanies.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed rounded-xl bg-slate-50/50"
                >
                    <div className="bg-slate-100 p-4 rounded-full mb-4">
                        <SearchX className="h-10 w-10 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-700">No se encontraron empresas</h3>
                    <p className="text-slate-500 mt-2 max-w-sm">
                        {searchTerm ? "No hay coinicidencias para tu búsqueda. Intenta con otros términos." : "No hay empresas registradas actualmente. Comienza agregando una nueva."}
                    </p>
                    {!searchTerm && (
                        <Button className="mt-6" onClick={() => setIsModalOpen(true)}>
                            Registrar primera empresa
                        </Button>
                    )}
                </motion.div>
            ) : (
                <motion.div
                    layout
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                >
                    <AnimatePresence>
                        {filteredCompanies.map((company) => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                key={company.id}
                            >
                                <Card className="group h-full flex flex-col hover:border-primary/40 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300 relative overflow-hidden">
                                    {/* Accent top line */}
                                    <div className={`absolute top-0 left-0 right-0 h-1 ${company.active ? 'bg-emerald-500' : 'bg-slate-300'}`} />

                                    <CardHeader className="pb-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="p-2.5 bg-primary/10 rounded-xl text-primary group-hover:scale-110 transition-transform duration-300">
                                                <Building2 className="w-5 h-5" />
                                            </div>
                                            <Badge variant={company.active ? "default" : "secondary"} className={company.active ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200" : ""}>
                                                {company.active ? 'Activa' : 'Inactiva'}
                                            </Badge>
                                        </div>
                                        <CardTitle className="text-xl line-clamp-1" title={company.name}>
                                            {company.name}
                                        </CardTitle>
                                        <CardDescription className="font-mono text-xs mt-1">
                                            RUC: {company.ruc || 'N/A'}
                                        </CardDescription>
                                    </CardHeader>

                                    <CardContent className="flex-1 flex flex-col justify-between pt-0 space-y-4">
                                        <div className="space-y-3 bg-slate-50/80 rounded-lg p-3 border border-slate-100">
                                            <div className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <Users className="w-4 h-4" />
                                                    <span>Usuarios</span>
                                                </div>
                                                <span className="font-semibold">{company._count.users}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <MapPin className="w-4 h-4" />
                                                    <span>Sucursales</span>
                                                </div>
                                                <span className="font-semibold">{company._count.branches}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-200">
                                                <div className="flex items-center gap-2 text-slate-500">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    <span className="text-xs">Registro</span>
                                                </div>
                                                <span className="text-xs text-slate-600 font-medium">{format(new Date(company.createdAt), 'MMM yyyy', { locale: es })}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 pt-2">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="shrink-0 group-hover:bg-slate-100 transition-colors"
                                                onClick={() => setSelectedDetailsId(company.id)}
                                                title="Ver Detalles"
                                            >
                                                <Info className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                className="w-full gap-2 relative overflow-hidden transition-all group-hover:bg-primary group-hover:text-primary-foreground"
                                                variant={impersonatingId === company.id ? "secondary" : "default"}
                                                onClick={() => handleImpersonate(company.id)}
                                                disabled={impersonatingId === company.id}
                                            >
                                                {impersonatingId === company.id ? (
                                                    <div className="flex items-center justify-center gap-2 animate-pulse">
                                                        <Activity className="w-4 h-4" />
                                                        Entrando...
                                                    </div>
                                                ) : (
                                                    <>
                                                        <span>Ingresar</span>
                                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}
        </div>
    );
}
