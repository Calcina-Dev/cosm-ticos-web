"use client";

import { useState, useEffect } from "react";
import { productsService } from "@/features/products/products.service";
import { usePosStore } from "../store/pos.store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Loader2, PackageX, MapPin } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import api from "@/lib/axios";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";



export function ProductGrid() {
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const addToCart = usePosStore((state) => state.addToCart);
  const activeWarehouseId = usePosStore((state) => state.activeWarehouseId);
  const setActiveWarehouseId = usePosStore(
    (state) => state.setActiveWarehouseId,
  );




  const fetchWarehouses = async () => {
    try {
      const resW = await api.get("/warehouses");
      const fetchedWarehouses = resW.data;
      setWarehouses(fetchedWarehouses);
      if (!activeWarehouseId && fetchedWarehouses.length > 0) {
        setActiveWarehouseId(fetchedWarehouses[0].id);
      }
    } catch (e) {
      console.error("Could not fetch warehouses", e);
    }
  };

  const searchProducts = async (query: string = "") => {
    try {
      setLoading(true);

      const res = await productsService.findAll({
        search: query,
        limit: 20,
        warehouseId: activeWarehouseId || undefined,
      });
      setProducts(res.items);
    } catch (error) {
      console.error("Error fetching products", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  // Debounce search effect (Wait 500ms after user stops typing to trigger search)
  useEffect(() => {
    if (!activeWarehouseId) return;

    const delayDebounceFn = setTimeout(() => {
      searchProducts(search);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [search, activeWarehouseId]);

  // Flatten variants for easier display in POS
  // Or display Product -> Select Variant?
  // For speed, let's flatten: show each variant as a card.
  const flatItems = products.flatMap((p) =>
    p.variants.map((v: any) => ({
      ...v,
      productName: p.name,
      productId: p.id,
    })),
  );

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex flex-1 gap-2">
          <Input
            placeholder="Buscar productos (nombre, sku)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
          <Button variant="secondary" onClick={() => searchProducts(search)}>
            <Search className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-full sm:w-[240px]">
          <Select
            value={activeWarehouseId || ""}
            onValueChange={(val) => setActiveWarehouseId(val)}
          >
            <SelectTrigger className="w-full">
              <div className="flex flex-row items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Seleccionar Almacén..." />
              </div>
            </SelectTrigger>
            <SelectContent>

              {warehouses.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {flatItems.map((item) => {
              const stockAvailable = item.stock || 0;
              const isOutOfStock = stockAvailable <= 0;

              return (
                <Card
                  key={item.id}
                  className={`relative transition-all overflow-hidden ${isOutOfStock
                    ? "opacity-60 cursor-not-allowed bg-slate-50 border-dashed"
                    : "cursor-pointer hover:border-primary hover:shadow-md"
                    }`}
                  onClick={() => {
                    if (isOutOfStock) return;



                    addToCart({
                      variantId: item.id,
                      warehouseId: activeWarehouseId!,
                      warehouseName:
                        warehouses.find((w) => w.id === activeWarehouseId)
                          ?.name || "Almacén",
                      quantity: 1,
                      unitPrice: Number(item.price),
                      productName: `${item.productName} ${item.name ? "- " + item.name : ""}`,
                      sku: item.sku,
                    });
                  }}
                >
                  {/* Stock Badges by Warehouse */}
                  <div className="absolute top-2 right-2 flex flex-col items-end gap-1 z-10 w-3/4 pointer-events-none">
                    {isOutOfStock ? (
                      <div className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 shadow-sm">
                        Agotado
                      </div>
                    ) : (
                      <div className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 shadow-sm">
                        Stock: {stockAvailable}
                      </div>
                    )}
                  </div>

                  <CardContent className="p-4 flex flex-col gap-2 relative">
                    <div className="h-20 bg-slate-100 rounded-md flex items-center justify-center text-slate-400">
                      {isOutOfStock ? (
                        <PackageX className="h-8 w-8 opacity-50" />
                      ) : (
                        <div className="text-xs">No Image</div>
                      )}
                    </div>
                    <div>
                      <h3
                        className={`font-semibold text-sm line-clamp-2 ${isOutOfStock ? "text-slate-500" : ""}`}
                      >
                        {item.productName} {item.name && `- ${item.name}`}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {item.sku}
                      </p>
                    </div>
                    <div
                      className={`font-black text-lg ${isOutOfStock ? "text-slate-400" : "text-primary"}`}
                    >
                      {formatCurrency(Number(item.price) || 0)}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        {!loading && flatItems.length === 0 && (
          <div className="text-center text-muted-foreground p-8">
            No se encontraron productos
          </div>
        )}
      </div>


    </div>
  );
}
