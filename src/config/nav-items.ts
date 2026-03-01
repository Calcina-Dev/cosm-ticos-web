import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Users,
    Settings,
    FileText,
    Truck,
    History,
    Store,
    Wallet,
    ShieldCheck,
} from "lucide-react";

export interface NavItem {
    title: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    submenu?: boolean;
    subMenuItems?: { title: string; href: string; requiredPermission?: string }[];
    requiredPermission?: string;
}

export const navItems: NavItem[] = [
    {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "Ventas (POS)",
        href: "/pos",
        icon: ShoppingCart,
        submenu: true,
        requiredPermission: "SALES_VIEW",
        subMenuItems: [
            { title: "Punto de Venta", href: "/pos", requiredPermission: "SALES_CREATE" },
            { title: "Historial de Ventas", href: "/sales", requiredPermission: "SALES_VIEW" },
            { title: "Gestión de Caja", href: "/cash", requiredPermission: "CASH_VIEW" },
        ],
    },
    {
        title: "Catálogo",
        href: "/catalog",
        icon: Package,
        submenu: true,
        requiredPermission: "PRODUCTS_VIEW",
        subMenuItems: [
            { title: "Productos", href: "/catalog/products", requiredPermission: "PRODUCTS_VIEW" },
            { title: "Categorías", href: "/catalog/categories", requiredPermission: "PRODUCTS_MANAGE" },
            { title: "Marcas", href: "/catalog/brands", requiredPermission: "PRODUCTS_MANAGE" },
            { title: "Unidades", href: "/catalog/units", requiredPermission: "PRODUCTS_MANAGE" },
        ],
    },
    {
        title: "Inventario",
        href: "/inventory",
        icon: Store,
        submenu: true,
        requiredPermission: "STOCK_VIEW",
        subMenuItems: [
            { title: "Resumen (Stock)", href: "/inventory", requiredPermission: "STOCK_VIEW" },
            { title: "Kardex / Movimientos", href: "/inventory/kardex", requiredPermission: "STOCK_VIEW" },
            { title: "Transferencias", href: "/inventory/transfers", requiredPermission: "STOCK_TRANSFER" },
            { title: "Almacenes", href: "/inventory/warehouses", requiredPermission: "STOCK_VIEW" },
        ],
    },
    {
        title: "Compras",
        href: "/purchases",
        icon: Truck,
        submenu: true,
        requiredPermission: "PURCHASES_VIEW",
        subMenuItems: [
            { title: "Órdenes de Compra", href: "/purchases/orders", requiredPermission: "PURCHASES_VIEW" },
            { title: "Facturas / Ingresos", href: "/purchases/invoices", requiredPermission: "PURCHASES_VIEW" },
        ],
    },
    {
        title: "Socios",
        href: "/partners",
        icon: Users,
        submenu: true,
        requiredPermission: "CUSTOMERS_VIEW",
        subMenuItems: [
            { title: "Clientes", href: "/partners/customers", requiredPermission: "CUSTOMERS_VIEW" },
            { title: "Proveedores", href: "/partners/suppliers", requiredPermission: "SUPPLIERS_VIEW" },
        ],
    },
    {
        title: "Reportes",
        href: "/reports",
        icon: FileText,
        submenu: true,
        requiredPermission: "SALES_REPORTS",
        subMenuItems: [
            { title: "Ventas", href: "/reports/sales", requiredPermission: "SALES_REPORTS" },
            { title: "Inventario", href: "/reports/inventory", requiredPermission: "SALES_REPORTS" },
            { title: "Caja", href: "/reports/cash", requiredPermission: "SALES_REPORTS" },
        ],
    },
    {
        title: "Finanzas",
        href: "/finance",
        icon: Wallet,
        submenu: true,
        requiredPermission: "CASH_VIEW",
        subMenuItems: [
            { title: "Cuentas por Cobrar", href: "/finance/receivables", requiredPermission: "CASH_VIEW" },
            { title: "Cuentas por Pagar", href: "/finance/payables", requiredPermission: "CASH_VIEW" },
            { title: "Auditoría", href: "/finance/audit", requiredPermission: "SETTINGS_MANAGE" },
        ],
    },
    {
        title: "Configuración",
        href: "/config",
        icon: Settings,
        submenu: true,
        requiredPermission: "SETTINGS_MANAGE",
        subMenuItems: [
            { title: "Series de Documentos", href: "/config/series", requiredPermission: "SETTINGS_MANAGE" },
            { title: "Métodos de Pago", href: "/catalog/payment-methods", requiredPermission: "SETTINGS_MANAGE" },
            { title: "Seguridad y PIN", href: "/settings/security", requiredPermission: "SETTINGS_MANAGE" },
            { title: "Equipo y Roles", href: "/settings/users", requiredPermission: "SETTINGS_MANAGE" },
        ],
    },
];
