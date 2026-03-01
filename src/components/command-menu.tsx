"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { searchService, SearchResult } from "@/features/search/search.service";
import { useQuery } from "@tanstack/react-query";
import { Package, Users, Receipt, Search, Loader2, LayoutList } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export function CommandMenu() {
    const [open, setOpen] = React.useState(false);
    const [query, setQuery] = React.useState("");
    const router = useRouter();

    // Atajo de teclado Cmd+K o Ctrl+K
    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const { data, isLoading } = useQuery<SearchResult>({
        queryKey: ["global-search", query],
        queryFn: () => searchService.globalSearch(query),
        enabled: query.length >= 2,
        staleTime: 500,
    });

    const runCommand = React.useCallback((command: () => void) => {
        setOpen(false);
        command();
    }, []);

    return (
        <CommandDialog open={open} onOpenChange={setOpen} shouldFilter={false}>
            <CommandInput
                placeholder="Busca productos, clientes o comprobantes... (Cmd+K)"
                value={query}
                onValueChange={setQuery}
            />
            <CommandList>
                {isLoading && (
                    <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                )}

                <CommandEmpty>No se encontraron resultados.</CommandEmpty>

                {data?.products && data.products.length > 0 && (
                    <CommandGroup heading="Productos">
                        {data.products.map((p) => (
                            <CommandItem
                                key={p.id}
                                onSelect={() => runCommand(() => router.push(`/catalog/products?search=${encodeURIComponent(query)}`))}
                            >
                                <Package className="mr-2 h-4 w-4" />
                                <span>{p.name}</span>
                                {p.variants?.[0] && (
                                    <span className="ml-2 text-xs text-muted-foreground">
                                        {formatCurrency(Number(p.variants[0].price))}
                                    </span>
                                )}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}

                {data?.customers && data.customers.length > 0 && (
                    <CommandGroup heading="Clientes">
                        {data.customers.map((c) => (
                            <CommandItem
                                key={c.id}
                                onSelect={() => runCommand(() => router.push(`/partners/customers?search=${encodeURIComponent(query)}`))}
                            >
                                <Users className="mr-2 h-4 w-4" />
                                <span>{c.name}</span>
                                {c.identityDoc && (
                                    <span className="ml-2 text-xs text-muted-foreground">
                                        {c.identityDoc}
                                    </span>
                                )}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}

                {data?.sales && data.sales.length > 0 && (
                    <CommandGroup heading="Comprobantes">
                        {data.sales.map((s) => (
                            <CommandItem
                                key={s.id}
                                onSelect={() => runCommand(() => router.push(`/sales?search=${encodeURIComponent(query)}`))}
                            >
                                <Receipt className="mr-2 h-4 w-4" />
                                <span>
                                    {s.documentSeries}-{s.documentNumber}
                                </span>
                                <span className="ml-2 text-xs text-muted-foreground italic">
                                    {s.customer?.name || "Cliente Varios"}
                                </span>
                                <span className="ml-auto text-xs text-muted-foreground">
                                    {formatCurrency(Number(s.totalAmount))}
                                </span>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}

                {data?.stockMovements && data.stockMovements.length > 0 && (
                    <CommandGroup heading="Movimientos de Inventario (Kardex)">
                        {data.stockMovements.map((m) => (
                            <CommandItem
                                key={m.id}
                                onSelect={() => runCommand(() => router.push(`/inventory/kardex?variantId=${m.variantId}`))}
                            >
                                <LayoutList className="mr-2 h-4 w-4" />
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">
                                        {m.reason} - {m.variant?.product?.name}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">
                                        {m.warehouse?.name} · {new Date(m.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <span className={`ml-auto font-mono text-xs ${m.type === 'INPUT' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {m.type === 'INPUT' ? '+' : '-'}{m.quantity}
                                </span>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}
            </CommandList>
        </CommandDialog>
    );
}
