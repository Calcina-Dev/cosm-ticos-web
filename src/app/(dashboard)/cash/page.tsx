"use client";

import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Loader2,
  DollarSign,
  Lock,
  Unlock,
  AlertCircle,
  ArrowUpCircle,
  ArrowDownCircle,
  Plus,
  Wallet,
  TrendingUp,
  TrendingDown,
  Clock,
  Receipt,
  Settings2,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CashSession,
  CashRegister,
  cashSessionsService,
} from "@/features/cash/services/cash-sessions.service";
import { formatCurrency } from "@/lib/utils";
import { TransactionModal } from "@/features/cash/components/transaction-modal";
import { CashClosingModal } from "@/features/cash/components/cash-closing-modal";
import { PaymentMethodDetailModal } from "@/features/cash/components/payment-method-detail-modal";
import {
  cashTransactionsService,
  CreateTransactionDto,
} from "@/features/cash/services/cash-transactions.service";
import { CashTransaction } from "@/features/cash/services/cash-sessions.service";

const openSessionSchema = z.object({
  startAmount: z.coerce
    .number()
    .min(0, "El monto inicial no puede ser negativo"),
  registerId: z.string().min(1, "Debe seleccionar una caja"),
});

export default function CashPage() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<CashSession | null>(null);
  const [registers, setRegisters] = useState<CashRegister[]>([]);
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [isTransactionOpen, setIsTransactionOpen] = useState(false);
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);

  // Payment Method Detail State
  const [isMethodDetailOpen, setIsMethodDetailOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState("");

  const openForm = useForm<z.infer<typeof openSessionSchema>>({
    resolver: zodResolver(openSessionSchema) as any,
    defaultValues: {
      startAmount: 0,
      registerId: "",
    },
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sessionData, registersData] = await Promise.all([
        cashSessionsService.getActiveSession().catch(() => null),
        cashSessionsService.getRegisters().catch(() => []),
      ]);

      setSession(sessionData);
      setRegisters(registersData || []);

      if (sessionData) {
        const txs = await cashTransactionsService.findAll(sessionData.id);
        setTransactions(txs);
      } else {
        setTransactions([]);
      }

      if (!sessionData && registersData && registersData.length === 1) {
        openForm.setValue("registerId", registersData[0].id);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Error al cargar datos de caja");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onOpenSession = async (values: z.infer<typeof openSessionSchema>) => {
    setActionLoading(true);
    try {
      await cashSessionsService.openSession(values);
      toast.success("Caja abierta correctamente");
      fetchData();
    } catch (error) {
      console.error("Error opening session:", error);
      toast.error("Error al abrir la caja");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSessionClosed = () => {
    setSession(null);
    fetchData();
  };

  const metrics = useMemo(() => {
    let incomes = 0;
    let expenses = 0;
    let physicalIncomes = 0; // Dinero físico
    let physicalExpenses = 0; // Egreso físico

    transactions.forEach((tx) => {
      if (tx.type === "INCOME") {
        incomes += Number(tx.amount);
        // Si no tiene nombre de banco entre paréntesis, asumimos que es efectivo que entró a la gaveta
        if (!tx.description?.match(/\((.*?)\)/)) {
          physicalIncomes += Number(tx.amount);
        }
      }
      if (tx.type === "EXPENSE") {
        expenses += Number(tx.amount);
        // Solo descontamos del cuadro físico de caja si no fue devuelto usando método bancario/tarjeta
        if (!tx.description?.match(/\((.*?)\)/)) {
          physicalExpenses += Number(tx.amount);
        }
      }
    });

    const net = incomes - expenses;
    const currentTotal = (session?.startAmount || 0) + physicalIncomes - physicalExpenses;

    return { incomes, expenses, net, currentTotal };
  }, [transactions, session]);

  if (loading) {
    return (
      <div className="flex h-full min-h-[60vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
        <p className="text-slate-500 font-medium animate-pulse">
          Cargando información de caja...
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-slate-50/50 min-h-[calc(100vh-4rem)]">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900">
            Gestión de Caja
          </h2>
          <p className="text-slate-500 font-medium mt-1">
            Control de flujo de efectivo y transacciones diarias
          </p>
        </div>
        <div className="flex gap-3">
          {session && (
            <>
              <Button
                onClick={() => setIsClosingModalOpen(true)}
                variant="outline"
                className="h-11 bg-white border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
              >
                <Lock className="mr-2 h-4 w-4" /> Arqueo y Cierre
              </Button>
              <Button
                onClick={() => setIsTransactionOpen(true)}
                className="h-11 bg-emerald-600 hover:bg-emerald-700 shadow-md hover:shadow-lg transition-all"
              >
                <Plus className="mr-2 h-5 w-5" /> Movimiento Rápido
              </Button>
            </>
          )}
          <Link href="/cash/registers">
            <Button
              variant="ghost"
              className="h-11 text-slate-600 hover:bg-slate-200"
            >
              <Settings2 className="mr-2 h-4 w-4" /> Ajustes
            </Button>
          </Link>
        </div>
      </div>

      {!session ? (
        /* ESTADO: CAJA CERRADA */
        <div className="max-w-md mx-auto mt-12 animate-in fade-in zoom-in-95 duration-500">
          <Card className="border-0 shadow-2xl rounded-2xl overflow-hidden">
            <div className="h-2 w-full bg-gradient-to-r from-emerald-400 to-teal-500" />
            <CardHeader className="text-center pb-2 pt-8">
              <div className="mx-auto bg-emerald-100 p-4 rounded-full w-20 h-20 flex items-center justify-center mb-4">
                <Wallet className="h-10 w-10 text-emerald-600" />
              </div>
              <CardTitle className="text-2xl font-bold">
                Apertura de Caja
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Inicia tu turno registrando el saldo actual en caja.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8 pt-6">
              <Form {...openForm}>
                <form
                  onSubmit={openForm.handleSubmit(onOpenSession)}
                  className="space-y-6"
                >
                  <FormField
                    control={openForm.control}
                    name="registerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="uppercase text-xs font-bold text-slate-500 tracking-wider">
                          Seleccionar Caja
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-12 border-slate-200 text-base">
                              <SelectValue placeholder="Elige la caja a operar" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {registers.map((reg) => (
                              <SelectItem
                                key={reg.id}
                                value={reg.id}
                                className="font-medium"
                              >
                                {reg.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={openForm.control}
                    name="startAmount"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="uppercase text-xs font-bold text-slate-500 tracking-wider">
                          Saldo Inicial (Base)
                        </FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400">
                              $
                            </span>
                            <Input
                              className="h-16 pl-10 text-3xl font-black text-slate-800 transition-all focus-visible:ring-emerald-500"
                              type="number"
                              step="0.01"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {registers.length === 0 && (
                    <Alert
                      variant="destructive"
                      className="bg-rose-50 text-rose-700 border-none"
                    >
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Falta Configuración</AlertTitle>
                      <AlertDescription>
                        No hay cajas creadas. Ve a 'Ajustes' para crear una.
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-14 text-lg font-bold bg-emerald-600 hover:bg-emerald-700 shadow-lg hover:shadow-xl transition-all"
                    disabled={actionLoading || registers.length === 0}
                  >
                    {actionLoading ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <Unlock className="mr-2 h-5 w-5" />
                    )}
                    Iniciar Turno
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* ESTADO: CAJA ABIERTA */
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          {/* Metrics Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-0 shadow-sm overflow-hidden bg-white">
              <div className="p-5 flex flex-col h-full justify-between">
                <div className="flex items-center justify-between space-y-0">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                    Saldo Actual
                  </h3>
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <Wallet className="h-4 w-4 text-slate-700" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-black text-slate-900 tracking-tight">
                    {formatCurrency(metrics.currentTotal)}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs font-medium text-slate-500 flex items-center">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
                      SESIÓN ABIERTA
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Solo Efectivo
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="border-0 shadow-sm overflow-hidden bg-white">
              <div className="p-5 flex flex-col h-full justify-between">
                <div className="flex items-center justify-between space-y-0">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                    Monto Inicial
                  </h3>
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Clock className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-2xl font-bold text-slate-700">
                    {formatCurrency(session.startAmount)}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Apertura:{" "}
                    {new Date(session.startTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="border-0 shadow-sm overflow-hidden bg-white relative">
              <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-100/50 rounded-bl-full -z-0" />
              <div className="p-5 flex flex-col h-full justify-between relative z-10">
                <div className="flex items-center justify-between space-y-0">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-700">
                    Ingresos Totales
                  </h3>
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-emerald-700" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-2xl font-bold text-emerald-600">
                    +{formatCurrency(metrics.incomes)}
                  </div>
                  <p className="text-xs text-emerald-600/80 mt-1 font-medium">
                    (Todos los métodos)
                  </p>
                </div>
              </div>
            </Card>

            <Card className="border-0 shadow-sm overflow-hidden bg-white relative">
              <div className="absolute right-0 top-0 w-24 h-24 bg-rose-100/50 rounded-bl-full -z-0" />
              <div className="p-5 flex flex-col h-full justify-between relative z-10">
                <div className="flex items-center justify-between space-y-0">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-rose-700">
                    Egresos Totales
                  </h3>
                  <div className="p-2 bg-rose-100 rounded-lg">
                    <TrendingDown className="h-4 w-4 text-rose-700" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-2xl font-bold text-rose-600">
                    -{formatCurrency(metrics.expenses)}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Payment Methods Summary Widget */}
          {session.paymentSummary && session.paymentSummary.length > 0 && (
            <div className="bg-slate-800 text-white rounded-xl p-5 shadow-lg relative overflow-hidden animate-in fade-in slide-in-from-bottom-2">
              <div className="absolute top-0 right-0 w-64 h-64 bg-slate-700 rounded-bl-full opacity-50 -z-0" />
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-emerald-400" />
                    Resumen de Cobros del Turno
                  </h3>
                  <p className="text-sm text-slate-300">
                    Incluye todas las ventas realizadas, agrupadas por medio de
                    pago.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                  {session.paymentSummary.map((ps, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setSelectedMethod(ps.method)
                        setIsMethodDetailOpen(true)
                      }}
                      className="bg-slate-700/80 backdrop-blur-md px-4 py-2 rounded-lg border border-slate-600/50 flex-1 md:flex-none cursor-pointer hover:bg-slate-700 hover:border-emerald-500/50 hover:scale-105 hover:-translate-y-1 transition-all group"
                      title={`Ver detalles de ${ps.method}`}
                    >
                      <p className="text-xs text-slate-400 uppercase font-bold tracking-wider group-hover:text-emerald-400 transition-colors">
                        {ps.method}
                      </p>
                      <p className="text-lg font-black text-white group-hover:text-emerald-300 transition-colors">
                        {formatCurrency(ps.total)}
                      </p>
                    </div>
                  ))}
                  <div className="bg-emerald-900/50 backdrop-blur-md px-4 py-2 rounded-lg border border-emerald-500/30 flex-1 md:flex-none">
                    <p className="text-xs text-emerald-300 uppercase font-bold tracking-wider">
                      Ventas Totales
                    </p>
                    <p className="text-xl font-black text-emerald-400">
                      {formatCurrency(
                        session.paymentSummary.reduce(
                          (acc, curr) => acc + curr.total,
                          0,
                        ),
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Transactions Table */}
          <Card className="border-0 shadow-sm rounded-xl overflow-hidden">
            <CardHeader className="bg-white border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-slate-500" />
                  Historial de Movimientos
                </CardTitle>
                {transactions.length > 0 && (
                  <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2.5 py-1 rounded-full">
                    {transactions.length} registros
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0 bg-white">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                    <TableHead className="font-bold text-slate-500 w-[120px]">
                      Hora
                    </TableHead>
                    <TableHead className="font-bold text-slate-500 w-[150px]">
                      Tipo
                    </TableHead>
                    <TableHead className="font-bold text-slate-500">
                      Descripción
                    </TableHead>
                    <TableHead className="font-bold text-slate-500">
                      Comprobante
                    </TableHead>
                    <TableHead className="text-right font-bold text-slate-500">
                      Monto
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-16">
                        <div className="flex flex-col items-center justify-center text-slate-400 space-y-3">
                          <div className="bg-slate-100 p-4 rounded-full">
                            <Receipt className="h-8 w-8 text-slate-300" />
                          </div>
                          <p className="font-medium text-base">
                            Aún no hay movimientos
                          </p>
                          <p className="text-sm opacity-75">
                            Las aperturas, ingresos y egresos aparecerán aquí.
                          </p>
                          <Button
                            variant="link"
                            className="text-emerald-600 hover:text-emerald-700 mt-2 font-bold"
                            onClick={() => setIsTransactionOpen(true)}
                          >
                            Crear primer movimiento
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((tx) => (
                      <TableRow
                        key={tx.id}
                        className="cursor-pointer transition-colors hover:bg-slate-50"
                      >
                        <TableCell className="font-medium text-slate-500 border-b-slate-100">
                          {tx.createdAt
                            ? new Date(tx.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                            : "-"}
                        </TableCell>
                        <TableCell className="border-b-slate-100">
                          {tx.type === "INCOME" ? (
                            <div className="inline-flex items-center px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-bold">
                              <ArrowUpCircle className="mr-1.5 h-3.5 w-3.5" />{" "}
                              Ingreso
                            </div>
                          ) : (
                            <div className="inline-flex items-center px-2 py-1 rounded-md bg-rose-50 text-rose-700 text-xs font-bold">
                              <ArrowDownCircle className="mr-1.5 h-3.5 w-3.5" />{" "}
                              Egreso
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-slate-700 border-b-slate-100">
                          {tx.description}
                        </TableCell>
                        <TableCell className="border-b-slate-100">
                          {tx.documentSeries ? (
                            <span className="text-xs font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                              {tx.documentSeries}-{String(tx.documentNumber).padStart(6, '0')}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </TableCell>
                        <TableCell
                          className={`text-right font-black border-b-slate-100 ${tx.type === "INCOME" ? "text-emerald-600" : "text-rose-600"}`}
                        >
                          {tx.type === "INCOME" ? "+" : "-"}
                          {formatCurrency(tx.amount)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      <TransactionModal
        open={isTransactionOpen}
        onOpenChange={setIsTransactionOpen}
        onSuccess={fetchData}
      />

      <PaymentMethodDetailModal
        open={isMethodDetailOpen}
        onOpenChange={setIsMethodDetailOpen}
        methodName={selectedMethod}
        transactions={transactions}
      />

      {session && (
        <CashClosingModal
          open={isClosingModalOpen}
          onOpenChange={setIsClosingModalOpen}
          sessionId={session.id}
          onSuccess={handleSessionClosed}
        />
      )}
    </div>
  );
}
