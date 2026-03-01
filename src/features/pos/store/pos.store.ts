import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface PosItem {
  variantId: string;
  warehouseId: string;
  warehouseName?: string;
  quantity: number;
  unitPrice: number;
  productName: string;
  sku?: string;
}

export interface PosCustomer {
  id: string;
  name: string;
  email?: string;
  identityDoc?: string;
}

interface PosState {
  cart: PosItem[];
  customer: PosCustomer | null;
  activeWarehouseId: string | null;
  addToCart: (item: PosItem) => void;
  removeFromCart: (variantId: string, warehouseId: string) => void;
  updateQuantity: (variantId: string, warehouseId: string, quantity: number) => void;
  clearCart: () => void;
  setCustomer: (customer: PosCustomer | null) => void;
  setActiveWarehouseId: (id: string | null) => void;
  total: () => number;
}

export const usePosStore = create<PosState>()(
  persist(
    (set, get) => ({
      cart: [],
      customer: null,
      activeWarehouseId: null,
      addToCart: (item) =>
        set((state) => {
          const existing = state.cart.find(
            (i) => i.variantId === item.variantId && i.warehouseId === item.warehouseId,
          );
          if (existing) {
            return {
              cart: state.cart.map((i) =>
                i.variantId === item.variantId && i.warehouseId === item.warehouseId
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i,
              ),
            };
          }
          return { cart: [...state.cart, item] };
        }),
      removeFromCart: (variantId, warehouseId) =>
        set((state) => ({
          cart: state.cart.filter((i) => !(i.variantId === variantId && i.warehouseId === warehouseId)),
        })),
      updateQuantity: (variantId, warehouseId, quantity) =>
        set((state) => ({
          cart: state.cart.map((i) =>
            i.variantId === variantId && i.warehouseId === warehouseId
              ? { ...i, quantity: Math.max(0, quantity) }
              : i,
          ),
        })),
      clearCart: () => set({ cart: [], customer: null }),
      setCustomer: (customer) => set({ customer }),
      setActiveWarehouseId: (id) => set({ activeWarehouseId: id }),
      total: () => {
        const state = get();
        return state.cart.reduce(
          (acc, item) => acc + item.quantity * item.unitPrice,
          0,
        );
      },
    }),
    {
      name: "pos-storage",
    },
  ),
);
