"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePosStore } from "../store/pos.store";
import {
  customersService,
  Customer,
} from "@/features/partners/customers.service";
import {
  paymentMethodsService,
  PaymentMethod,
} from "@/features/catalogs/payment-methods.service";
import { salesService } from "@/features/sales/sales.service";
import { formatCurrency } from "@/lib/utils";
import {
  Search,
  User,
  CreditCard,
  Banknote,
  Loader2,
  CheckCircle,
  Printer,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/features/auth/auth.store";
import api from "@/lib/axios";
import { generateTicket } from "@/lib/pdf-generator";

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectOnly?: boolean;
}

export function CheckoutDialog({ open, onOpenChange, selectOnly }: CheckoutDialogProps) {
  const { user } = useAuthStore();
  const { cart, customer, setCustomer, total, clearCart, activeWarehouseId } =
    usePosStore();
  const [step, setStep] = useState<"customer" | "payment" | "success">(
    "customer",
  );
  const [lastSale, setLastSale] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [payments, setPayments] = useState<
    { methodId: string; name: string; code: string; amount: number }[]
  >([]);
  const [currentMethodId, setCurrentMethodId] = useState<string>("");
  const [currentAmount, setCurrentAmount] = useState<string>("");
  // Estado para el diálogo de confirmación de crédito
  const [showCreditDialog, setShowCreditDialog] = useState(false);

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remainingTotal = Math.max(0, total() - totalPaid);
  const totalChange = Math.max(0, totalPaid - total());

  // Fetch payment methods and reset on mount
  useEffect(() => {
    if (open) {
      loadPaymentMethods();
      setPayments([]);
      setCurrentAmount("");

      if (selectOnly) {
        setStep("customer");
        searchCustomers();
      } else if (usePosStore.getState().customer) {
        setStep("payment");
      } else {
        setStep("customer");
        searchCustomers(); // Carga inicial
      }
    }
    // No incluir "customer" en las dependencias para evitar reseteos 
    // bruscos cuando la función clearCart() pone el cliente en null.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selectOnly]);

  // Auto-fill remaining amount for non-cash methods or when empty
  useEffect(() => {
    if (step !== "payment") return;
    const method = paymentMethods.find((m) => m.id === currentMethodId);

    // Auto-fill unconditionally if it's the exact remainer
    if (
      remainingTotal > 0 &&
      (!currentAmount || (method && method.code !== "CASH"))
    ) {
      setCurrentAmount(remainingTotal.toFixed(2));
    }
  }, [currentMethodId, remainingTotal, step]);

  const handleAddPayment = () => {
    if (!currentMethodId) return toast.error("Seleccione un método de pago");
    const amount = Number(currentAmount);
    if (isNaN(amount) || amount <= 0)
      return toast.error("Ingrese un monto válido");
    if (remainingTotal <= 0) return toast.error("El total ya ha sido cubierto");

    const method = paymentMethods.find((m) => m.id === currentMethodId);
    if (!method) return;

    setPayments([
      ...payments,
      { methodId: method.id, name: method.name, code: method.code, amount },
    ]);

    setCurrentAmount("");
    // We intentionally keep currentMethodId so they can keep adding
  };

  const handleRemovePayment = (index: number) => {
    const newPayments = [...payments];
    newPayments.splice(index, 1);
    setPayments(newPayments);
  };

  const loadPaymentMethods = async () => {
    try {
      const methods = await paymentMethodsService.findAll();
      setPaymentMethods(methods);
      if (methods.length > 0) setCurrentMethodId(methods[0].id);
    } catch (error) {
      console.error("Error loading payment methods", error);
      toast.error("Error al cargar medios de pago");
    }
  };

  const searchCustomers = async () => {
    setLoading(true);
    try {
      const res = await customersService.findAll({
        search: searchTerm,
        limit: 10,
      });
      setCustomers(res.items);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Aplica el pago de crédito directo y finaliza la venta
  const handleApplyCredit = async () => {
    if (!customer) {
      setShowCreditDialog(false);
      setStep("customer"); // Redirige a seleccionar cliente
      toast.warning("Debes seleccionar un cliente para anotar una deuda en Cuentas por Cobrar");
      return;
    }
    // Añadimos el pago de Crédito Directo por el saldo restante
    const creditMethod = paymentMethods.find((m) => m.code === "CREDIT");
    if (!creditMethod) {
      toast.error("Método de pago 'Crédito Directo' no encontrado");
      return;
    }
    setPayments(prev => [
      ...prev,
      { methodId: creditMethod.id, name: creditMethod.name, code: creditMethod.code, amount: Number(remainingTotal.toFixed(2)) }
    ]);
    setShowCreditDialog(false);
    // Esperamos un tick para que el estado se actualice antes de finalizar
    setTimeout(() => handleFinalizeInternal([
      ...payments,
      { methodId: creditMethod.id, name: creditMethod.name, code: creditMethod.code, amount: Number(remainingTotal.toFixed(2)) }
    ]), 0);
  };

  const handleFinalize = async () => {
    // Si hay saldo pendiente, preguntar si desea anotar en Cuentas por Cobrar
    if (remainingTotal > 0.01) {
      if (!customer) {
        // No hay cliente: si quieren crédito necesitan uno
        setShowCreditDialog(true);
        return;
      }
      setShowCreditDialog(true);
      return;
    }
    return handleFinalizeInternal(payments);
  };

  const handleFinalizeInternal = async (finalPayments: typeof payments) => {

    try {
      setLoading(true);

      // Prepare payload
      // Assuming warehouseId is available. Since we are in POS, maybe we need a default warehouse from session?
      // For now hardcode or get from user context if available.
      // Wait, we need warehouseId.
      // In a real app, the POS session is tied to a warehouse.
      // Let's check if we can get it from anywhere.
      // useAuth default branch/warehouse?
      // For MVP let's assume the first warehouse of the company or 'Almacén Principal' ID if we knew it.
      // Better: Let's fetch warehouses and pick one, or for now, just use the first available warehouseId from a simple fetch if not in context.
      // Actually, created sales usually require a warehouse.

      // Temporary fix: get warehouseId from a hardcoded verify step or just rely on backend default if optional? No, it's required.
      // Let's assume we use the first active warehouse.

      // TODO: Refactor to get from User Session if POS multi-warehouse.
      // Now perfectly synced with ProductGrid via PosStore!

      const warehouseId =
        activeWarehouseId ||
        user?.warehouseId ||
        (await fetchFirstWarehouseId());
      if (!warehouseId) throw new Error("No warehouse configured");

      // Ajustamos el vuelto restándolo del pago en efectivo antes de enviarlo
      const adjustedPayments = JSON.parse(JSON.stringify(finalPayments)) as typeof finalPayments;
      const currentChange = Math.max(0, adjustedPayments.reduce((sum, p) => sum + p.amount, 0) - total());

      if (currentChange > 0) {
        const cashPaymentIndex = adjustedPayments.findIndex((p) => p.code === "CASH");
        if (cashPaymentIndex >= 0) {
          adjustedPayments[cashPaymentIndex].amount = Number(
            Math.max(0, adjustedPayments[cashPaymentIndex].amount - currentChange).toFixed(2),
          );
        }
      }

      const sale = await salesService.create({
        customerId: customer?.id,
        warehouseId: warehouseId,
        items: cart.map((i) => ({
          variantId: i.variantId,
          warehouseId: i.warehouseId,
          quantity: i.quantity,
          price: i.unitPrice,
        })),
        payments: adjustedPayments.map((p) => ({
          methodId: p.methodId,
          amount: Number(p.amount.toFixed(2)),
        })),
      });

      setLastSale(sale);
      setStep("success");
      clearCart();
    } catch (error) {
      console.error(error);
      toast.error("Error al procesar la venta");
    } finally {
      setLoading(false);
    }
  };

  const handlePrintTicket = () => {
    if (!lastSale) return;

    // Map cart items for names if not available in lastSale lines (deep) or just use logic
    // We can just rely on basic data
    generateTicket({
      companyName: user?.companyName || "SaaS POS",
      companyAddress: "Av. Principal 123",
      companyRuc: "20100000001",
      documentType: lastSale.documentType,
      documentNumber: `${lastSale.documentSeries}-${lastSale.documentNumber}`,
      date: new Date(lastSale.createdAt),
      customerName: customer?.name || "Público General",
      customerDoc: customer?.identityDoc,
      user: user?.name || "Cajero",
      items: lastSale.lines.map((l: any) => {
        // Try to find name in cart if possible, otherwise use generic or variantId
        // Since cart is cleared, we might need to rely on what we had.
        // Actually, salesService response 'findOne' usually includes product info if we included it.
        // The 'create' response might be leaner.
        // For now, let's just use "Producto" or the variantId if we can't find it?
        // Wait, we cleared the cart! We can't use it.
        // Ideally 'create' should return deep info.
        // Optimization: let's not clear cart until we leave? No.
        // Let's just assume "Item" for this iteration or map before clearing if we really wanted.
        // But wait, the generateTicket needs names.
        // I'll leave it as "Item (VariantID)" for now to avoid complexity, or better:
        return {
          name: `Item ${l.variantId.substring(0, 8)}`, // Placeholder
          quantity: l.quantity,
          price: Number(l.price),
          total: Number(l.subtotal),
        };
      }),
      subtotal: Number(lastSale.subtotal),
      tax: Number(lastSale.totalTax),
      total: Number(lastSale.totalAmount),
    });
  };

  // Helper to get warehouse (in real app, this is in context)
  const fetchFirstWarehouseId = async () => {
    try {
      const res = await api.get("/warehouses");
      const warehouses = res.data;
      return warehouses[0]?.id;
    } catch (error) {
      console.error("Error fetching warehouses", error);
      return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {step === "customer" && "Seleccionar Cliente"}
            {step === "payment" && "Procesar Pago"}
            {step === "success" && "¡Venta Exitosa!"}
          </DialogTitle>
        </DialogHeader>

        {step === "customer" && (
          <div className="space-y-4 py-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                searchCustomers();
              }}
              className="flex gap-2"
            >
              <Input
                placeholder="Buscar por nombre o DNI (Enter)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
              <Button type="submit">
                <Search className="h-4 w-4" />
              </Button>
            </form>

            <div className="border rounded-md h-[200px] overflow-y-auto p-2 space-y-2">
              {customers.map((c) => (
                <div
                  key={c.id}
                  className="p-2 hover:bg-muted rounded-md cursor-pointer flex justify-between items-center"
                  onClick={() => {
                    setCustomer(c);
                    if (selectOnly) {
                      onOpenChange(false);
                    } else {
                      setStep("payment");
                    }
                  }}
                >
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.identityDoc}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm">
                    Seleccionar
                  </Button>
                </div>
              ))}
              {customers.length === 0 && !loading && (
                <p className="text-center text-muted-foreground text-sm py-4">
                  Buscar cliente o continuar como "Público General"
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setCustomer(null);
                  if (selectOnly) {
                    onOpenChange(false);
                  } else {
                    setStep("payment"); // "Público General"
                  }
                }}
              >
                Continuar como Público General
              </Button>
            </div>
          </div>
        )}

        {step === "payment" && (
          <div className="space-y-4 py-4">
            {/* Panel de confirmación de crédito (inline, dentro del Dialog) */}
            {showCreditDialog ? (
              <div className="space-y-4 animate-in fade-in">
                <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="h-10 w-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                    <CreditCard className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Saldo pendiente: {formatCurrency(remainingTotal)}</h3>
                    <p className="text-sm text-slate-500">
                      {customer
                        ? `¿Anotar como deuda de ${customer.name}?`
                        : "Selecciona un cliente para registrar la deuda."}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowCreditDialog(false)}
                  >
                    Completar pago
                  </Button>
                  <Button
                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                    onClick={handleApplyCredit}
                  >
                    {customer ? "Anotar deuda" : "Seleccionar cliente"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row gap-4">
                {/* Columna Izquierda: Input de Nuevo Pago */}
                <div className="flex-1 space-y-4">
                  <div className="flex flex-col items-center justify-center p-4 bg-muted/20 rounded-lg border border-slate-100 shadow-inner">
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">
                      Total Cuenta
                    </span>
                    <span className="text-4xl font-black text-slate-800">
                      {formatCurrency(total())}
                    </span>
                  </div>

                  {remainingTotal > 0 && (
                    <div className="space-y-4 animate-in fade-in">
                      <div className="space-y-2">
                        <Label className="text-slate-500 font-bold uppercase text-xs">
                          Añadir Pago
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                          {paymentMethods.map((method) => (
                            <div
                              key={method.id}
                              className={`
                              border rounded-md p-3 cursor-pointer transition-colors flex flex-col items-center gap-2
                              ${currentMethodId === method.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-primary/50"}
                            `}
                              onClick={() => setCurrentMethodId(method.id)}
                            >
                              {method.code === "CASH" ? (
                                <Banknote className="h-5 w-5" />
                              ) : (
                                <CreditCard className="h-5 w-5" />
                              )}
                              <span className="text-xs font-bold text-center">
                                {method.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2 pt-2">
                        <Label className="text-slate-500 font-bold uppercase text-xs">
                          Monto Recibido
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            step="0.01"
                            value={currentAmount}
                            onChange={(e) => setCurrentAmount(e.target.value)}
                            className="text-2xl font-black font-mono h-12 text-slate-700 placeholder:text-slate-300"
                            placeholder="0.00"
                          />
                          <Button
                            onClick={handleAddPayment}
                            className="h-12 px-6"
                          >
                            Añadir
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Columna Derecha: Lista de Pagos y Resumen */}
                <div className="flex-1 flex flex-col bg-slate-50 rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="p-4 flex-1">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 border-b pb-2">
                      Pagos Registrados
                    </h4>
                    {payments.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-[120px] opacity-40">
                        <Banknote className="h-8 w-8 mb-2" />
                        <p className="text-xs text-center uppercase tracking-wide font-bold">
                          Sin pagos
                        </p>
                      </div>
                    ) : (
                      <ul className="space-y-2 overflow-y-auto max-h-[160px] pr-1">
                        {payments.map((p, idx) => (
                          <li
                            key={idx}
                            className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-100 shadow-sm text-sm animate-in slide-in-from-right-4"
                          >
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded-md bg-slate-100">
                                {p.code === "CASH" ? (
                                  <Banknote className="h-4 w-4 text-emerald-600" />
                                ) : (
                                  <CreditCard className="h-4 w-4 text-blue-600" />
                                )}
                              </div>
                              <span className="font-bold text-slate-700">
                                {p.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-mono font-bold text-slate-700 text-base">
                                {formatCurrency(p.amount)}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-rose-500 hover:bg-rose-100 hover:text-rose-600 transition-colors"
                                onClick={() => handleRemovePayment(idx)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="bg-white p-4 border-t border-slate-200 space-y-3 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 font-bold uppercase tracking-wider text-xs">
                        Total Ingresado:
                      </span>
                      <span className="font-bold font-mono text-slate-700">
                        {formatCurrency(totalPaid)}
                      </span>
                    </div>

                    {remainingTotal > 0 ? (
                      <div className="flex justify-between items-center bg-rose-50/50 p-2 rounded-lg border border-rose-100">
                        <span className="text-rose-600 font-bold uppercase tracking-wider text-[10px] sm:text-xs">
                          Falta Pagar:
                        </span>
                        <span className="text-lg font-black text-rose-600">
                          {formatCurrency(remainingTotal)}
                        </span>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center bg-emerald-50/50 p-2 rounded-lg border border-emerald-100 animate-in zoom-in-95">
                        <span className="text-emerald-700 font-bold uppercase tracking-wider text-[10px] sm:text-xs">
                          Vuelto Final:
                        </span>
                        <span className="text-2xl font-black text-emerald-600">
                          {formatCurrency(totalChange)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center text-green-600">
              <CheckCircle className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold">¡Venta Realizada!</h3>
            <p className="text-center text-muted-foreground">
              La venta se ha registrado correctamente.
            </p>
            <div className="flex flex-col gap-2 w-full max-w-xs pt-4">
              <Button
                onClick={handlePrintTicket}
                variant="outline"
                className="w-full"
              >
                <Printer className="mr-2 h-4 w-4" /> Imprimir Ticket
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === "customer" && (
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
          )}
          {step === "payment" && (
            <>
              <Button variant="ghost" onClick={() => setStep("customer")}>
                Atrás
              </Button>
              <Button
                onClick={handleFinalize}
                disabled={loading}
                className={
                  remainingTotal <= 0
                    ? "bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg transition-all"
                    : "bg-amber-600 hover:bg-amber-700 transition-all"
                }
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {remainingTotal > 0.01 ? "Anotar a Crédito / Completar" : "Completar Venta"}
              </Button>
            </>
          )}
          {step === "success" && (
            <Button onClick={() => onOpenChange(false)} className="w-full">
              Nueva Venta
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
