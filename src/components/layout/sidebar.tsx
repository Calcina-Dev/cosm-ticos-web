"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navItems, type NavItem } from "@/config/nav-items";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Menu, Package2, ChevronRight } from "lucide-react";
import { useState, useMemo } from "react";

interface SidebarProps {
    className?: string;
}

import { useAuthStore } from "@/features/auth/auth.store";

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
    const pathname = usePathname();
    const { user } = useAuthStore();
    const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

    const toggleMenu = (href: string) => {
        setOpenMenus((prev) => ({ ...prev, [href]: !prev[href] }));
    };

    // Filter items based on user permissions
    const filteredNavItems = useMemo(() => {
        if (!user) return [];

        // Admin sees everything
        const isAdmin = user.role?.toUpperCase() === 'ADMIN';
        if (isAdmin) return navItems;

        const userPermissions = user.permissions || [];

        return navItems.filter((item: NavItem) => {
            // If item requires permission, check it
            if (item.requiredPermission && !userPermissions.includes(item.requiredPermission)) {
                return false;
            }

            // If it has a submenu, filter subitems too
            if (item.subMenuItems) {
                const visibleSubItems = item.subMenuItems.filter((sub: any) =>
                    !sub.requiredPermission || userPermissions.includes(sub.requiredPermission)
                );

                // If it's a submenu but no subitems are visible, hide main item
                if (visibleSubItems.length === 0) return false;

                // Keep the item but with filtered subitems (shallow copy to not mutate original)
                // The original item is not mutated, a new object is returned for the filtered list.
                // This ensures the original navItems array remains untouched for subsequent renders or other uses.
                return {
                    ...item,
                    subMenuItems: visibleSubItems
                };
            }

            return true;
        });
    }, [user]);

    return (
        <div className="space-y-1">
            {filteredNavItems.map((item) => {
                const isActive =
                    pathname === item.href ||
                    pathname.startsWith(item.href + "/");
                const isOpen = openMenus[item.href] ?? isActive;

                if (item.submenu && item.subMenuItems) {
                    return (
                        <Collapsible
                            key={item.href}
                            open={isOpen}
                            onOpenChange={() => toggleMenu(item.href)}
                        >
                            <CollapsibleTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className={cn(
                                        "w-full justify-start font-medium",
                                        isActive ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm hover:bg-sidebar-primary/90 hover:text-sidebar-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                    )}
                                >
                                    <item.icon className="mr-2 h-4 w-4" />
                                    {item.title}
                                    <ChevronRight
                                        className={cn(
                                            "ml-auto h-4 w-4 transition-transform duration-200",
                                            isOpen && "rotate-90"
                                        )}
                                    />
                                </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="pl-6 space-y-1 mt-1 relative">
                                {/* Vertical Line for Submenu */}
                                <div className="absolute left-[1.35rem] top-0 bottom-0 w-px bg-border" />
                                {item.subMenuItems.map((sub) => {
                                    const isSubActive = pathname === sub.href || pathname.startsWith(sub.href + "/");
                                    return (
                                        <Button
                                            key={sub.href}
                                            variant="ghost"
                                            className={cn(
                                                "w-full justify-start text-sm h-9 pl-6 relative",
                                                isSubActive ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
                                            )}
                                            asChild
                                        >
                                            <Link
                                                href={sub.href}
                                                onClick={onNavigate}
                                            >
                                                {/* Dot indicator for subitems if needed, or just text */}
                                                {sub.title}
                                            </Link>
                                        </Button>
                                    );
                                })}
                            </CollapsibleContent>
                        </Collapsible>
                    );
                }

                return (
                    <Button
                        key={item.href}
                        variant="ghost"
                        className={cn(
                            "w-full justify-start font-medium",
                            isActive ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm hover:bg-sidebar-primary/90 hover:text-sidebar-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                        asChild
                    >
                        <Link href={item.href} onClick={onNavigate}>
                            <item.icon className="mr-2 h-4 w-4" />
                            {item.title}
                        </Link>
                    </Button>
                );
            })}
        </div>
    );
}

export function Sidebar({ className }: SidebarProps) {
    const { user } = useAuthStore();
    return (
        <div className={cn("pb-12 border-r bg-sidebar text-sidebar-foreground", className)}>
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    <div className="flex items-center px-4 mb-6">
                        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center mr-2">
                            <Package2 className="h-5 w-5 text-white" />
                        </div>
                        <h2 className="text-xl font-bold tracking-tight text-foreground truncate">
                            {user?.companyName || "SaaS POS"}
                        </h2>
                    </div>
                    <ScrollArea className="h-[calc(100vh-8rem)]">
                        <SidebarNav />
                    </ScrollArea>
                </div>
            </div>
        </div>
    );
}

export function MobileSidebar() {
    const [open, setOpen] = useState(false);
    const { user } = useAuthStore();

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button
                    variant="ghost"
                    className="mr-2 px-0 text-base hover:bg-transparent hover:text-primary md:hidden"
                >
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Toggle Menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="pr-0 w-64">
                <div className="px-4 mb-6 flex items-center">
                    <Package2 className="mr-2 h-5 w-5" />
                    <span className="font-bold truncate">{user?.companyName || "SaaS POS"}</span>
                </div>
                <ScrollArea className="h-[calc(100vh-6rem)] pb-10">
                    <div className="px-3">
                        <SidebarNav onNavigate={() => setOpen(false)} />
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
