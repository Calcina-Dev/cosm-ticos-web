"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersService, CompanyMembership } from "@/features/users/users.service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Users,
    Shield,
    UserPlus,
    MoreVertical,
    CheckCircle2,
    XCircle,
    ShieldAlert,
    ChevronDown
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export default function UsersSettingsPage() {
    const queryClient = useQueryClient();

    const { data: team, isLoading } = useQuery({
        queryKey: ["team"],
        queryFn: () => usersService.findAll(),
    });

    const { data: roles } = useQuery({
        queryKey: ["roles"],
        queryFn: () => usersService.getRoles(),
    });

    const mutation = useMutation({
        mutationFn: ({ id, roleId }: { id: string; roleId: string }) =>
            usersService.updateMembership(id, { roleId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["team"] });
            toast.success("Rol actualizado con éxito");
        },
        onError: () => toast.error("Error al actualizar el rol")
    });

    const columns: ColumnDef<CompanyMembership>[] = [
        {
            accessorKey: "user.email",
            header: "Usuario",
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                        <Users className="h-4 w-4 text-slate-500" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-sm text-slate-700">{row.original.user.email}</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                            Miembro desde {formatDate(row.original.user.createdAt).split(' ')[0]}
                        </span>
                    </div>
                </div>
            )
        },
        {
            accessorKey: "role.name",
            header: "Rol Principal",
            cell: ({ row }) => {
                const roleName = row.original.role?.name || "Sin Rol";
                const isAdmin = roleName === "ADMIN";

                return (
                    <Badge
                        variant={isAdmin ? "default" : "secondary"}
                        className={`rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-tighter ${isAdmin ? 'bg-indigo-600' : 'bg-slate-100 text-slate-600'}`}
                    >
                        {roleName}
                    </Badge>
                );
            }
        },
        {
            accessorKey: "user.active",
            header: "Estado",
            cell: ({ row }) => (
                <div className="flex items-center gap-1.5">
                    {row.original.user.active ? (
                        <>
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            <span className="text-xs font-medium text-emerald-700">Activo</span>
                        </>
                    ) : (
                        <>
                            <XCircle className="h-3.5 w-3.5 text-rose-500" />
                            <span className="text-xs font-medium text-rose-700">Inactivo</span>
                        </>
                    )}
                </div>
            )
        },
        {
            id: "actions",
            cell: ({ row }) => (
                <div className="flex justify-end">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2">
                            <DropdownMenuLabel className="text-[10px] uppercase font-bold text-slate-400">Cambiar Rol</DropdownMenuLabel>
                            {roles?.map((role) => (
                                <DropdownMenuItem
                                    key={role.id}
                                    className="rounded-xl cursor-pointer"
                                    onClick={() => mutation.mutate({ id: row.original.id, roleId: role.id })}
                                >
                                    <Shield className={`h-4 w-4 mr-2 ${role.name === "ADMIN" ? "text-indigo-600" : "text-slate-400"}`} />
                                    <span className="text-sm font-medium">{role.name}</span>
                                </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-rose-600 rounded-xl font-bold bg-rose-50 hover:bg-rose-100 cursor-pointer">
                                <ShieldAlert className="h-4 w-4 mr-2" />
                                Revocar Acceso
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="bg-indigo-100 p-2 rounded-2xl">
                            <Shield className="h-6 w-6 text-indigo-600" />
                        </div>
                        <h2 className="text-3xl font-black tracking-tighter text-slate-800">Gestión de Equipo</h2>
                    </div>
                    <p className="text-muted-foreground">Administra los roles y permisos de acceso para tu personal.</p>
                </div>

                <Button className="rounded-2xl gap-2 font-bold shadow-lg shadow-indigo-100">
                    <UserPlus className="h-4 w-4" />
                    Invitar Miembro
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="border-none shadow-sm md:col-span-3 overflow-hidden rounded-3xl">
                    <DataTable
                        columns={columns}
                        data={team || []}
                        searchKey="user.email"
                        placeholder="Buscar por correo..."
                    />
                </Card>

                <div className="space-y-6">
                    <Card className="border-none shadow-sm bg-indigo-600 text-white rounded-3xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Shield className="h-20 w-20 rotate-12" />
                        </div>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-black uppercase tracking-widest opacity-80">Info RBAC</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs leading-relaxed font-medium">
                                Los roles definen qué módulos puede ver tu personal. El rol <span className="underline decoration-indigo-400 underline-offset-4">ADMIN</span> tiene acceso total incluyendo finanzas y reportes.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-slate-50 border border-slate-200 rounded-3xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-black uppercase text-slate-500 tracking-widest">Estadísticas</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Total Personal</span>
                                <span className="font-black text-slate-800">{team?.length || 0}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Administradores</span>
                                <span className="font-black text-indigo-600">
                                    {team?.filter(u => u.role?.name === "ADMIN").length || 0}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
