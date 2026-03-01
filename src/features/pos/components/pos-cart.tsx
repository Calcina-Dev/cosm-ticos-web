"use client";
import { useState } from "react";
import { usePosStore } from "../store/pos.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, ShoppingCart, User, Plus, Minus, MapPin } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

import { CheckoutDialog } from "./checkout-dialog";

export function PosCart() {
  const { cart, customer, removeFromCart, updateQuantity, clearCart, total } =
    usePosStore();
  const [showCheckout, setShowCheckout] = useState(false);
  const [showCustomerSelect, setShowCustomerSelect] = useState(false);

  return (
    <div className="flex flex-col h-full bg-card border-l">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          <h2 className="font-bold">Carrito Actual</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearCart}
          className="text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Limpiar
        </Button>
      </div>

      <div className="p-4 border-b bg-muted/20">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => setShowCustomerSelect(true)}
        >
          <User className="mr-2 h-4 w-4" />
          {customer ? customer.name : "Seleccionar Cliente (General)"}
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="text-center text-muted-foreground py-10">
              Carrito vacío
            </div>
          ) : (
            cart.map((item) => (
              <div key={`${item.variantId}-${item.warehouseId}`} className="flex gap-4 items-start">
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.productName}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <MapPin className="h-3 w-3" />
                    <span>{item.warehouseName || "Almacén Principal"}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{item.sku}</p>
                  <div className="text-primary font-bold mt-1">
                    {formatCurrency(item.unitPrice * item.quantity)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() =>
                      updateQuantity(item.variantId, item.warehouseId, item.quantity - 1)
                    }
                    disabled={item.quantity <= 1}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center font-medium">
                    {item.quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() =>
                      updateQuantity(item.variantId, item.warehouseId, item.quantity + 1)
                    }
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => removeFromCart(item.variantId, item.warehouseId)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t bg-muted/10 space-y-4">
        <div className="flex justify-between items-center text-lg font-bold">
          <span>Total</span>
          <span>{formatCurrency(total())}</span>
        </div>
        <Button
          size="lg"
          className="w-full"
          onClick={() => setShowCheckout(true)}
          disabled={cart.length === 0}
        >
          Cobrar {formatCurrency(total())}
        </Button>
      </div>

      <CheckoutDialog
        open={showCustomerSelect}
        onOpenChange={setShowCustomerSelect}
        selectOnly
      />
      <CheckoutDialog open={showCheckout} onOpenChange={setShowCheckout} />
    </div>
  );
}
