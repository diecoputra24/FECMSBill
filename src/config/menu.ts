import {
    Users,
    CreditCard,
    Settings,
    List,
    LayoutDashboard,
    Package,
    Palette,
    Router as RouterIcon,
    Network,
    Map,
    Building2,
    Percent,
    Compass,
    Target,
    FileText,
    Calculator,
    History,
    Handshake,
    UserPlus,
    ArrowUpDown,
    Activity,
    UserMinus,
    TrendingUp,
    DollarSign,
    Presentation,
    Home,
    ClipboardList,
    CheckCircle,
    Edit3,
    Shield,
    type LucideIcon
} from "lucide-react";

export interface MenuItem {
    id: string;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }> | LucideIcon;
    href?: string;
    children?: MenuItem[];
    permission?: string;
}

export const menuItems: MenuItem[] = [
    {
        id: "dashboard",
        label: "Home",
        icon: Home,
        href: "/",
        permission: "dashboard.view"
    },
    {
        id: "opportunity",
        label: "Opportunity",
        icon: Compass,
        permission: "opportunity.view",
        children: [
            { id: "pelanggan-create-main", label: "Pendaftaran Pelanggan", icon: UserPlus, href: "/pelanggan/create", permission: "opportunity.create" },
            { id: "track-opportunity", label: "Track Opportunity", icon: Target, href: "/opportunity/track", permission: "opportunity.track" },
            { id: "list-opportunity", label: "List Opportunity", icon: List, href: "/opportunity/list", permission: "opportunity.list" },
            { id: "detail-opportunity", label: "Detail Opportunity", icon: FileText, href: "/opportunity/detail", permission: "opportunity.detail" },
        ]
    },
    {
        id: "pelanggan",
        label: "Pelanggan",
        icon: Users,
        permission: "customer.view",
        children: [
            { id: "pelanggan-list", label: "List Pelanggan", icon: List, href: "/pelanggan", permission: "customer.list" },
            {
                id: "upgrade-downgrade",
                label: "Upgrade/Downgrade",
                icon: ArrowUpDown,
                permission: "customer.upgrade",
                children: [
                    { id: "upgrade-request", label: "Request Upgrade / Downgrade", icon: ClipboardList, href: "/pelanggan/upgrade", permission: "customer.upgrade" },
                    { id: "upgrade-approval", label: "Approval Upgrade / Downgrade", icon: CheckCircle, href: "/pelanggan/upgrade/approval", permission: "customer.upgrade" },
                ]
            },
            {
                id: "perubahan-data",
                label: "Perubahan Data",
                icon: Edit3,
                permission: "customer.change",
                children: [
                    { id: "change-request", label: "Request Perubahan Data", icon: ClipboardList, href: "/pelanggan/change", permission: "customer.change" },
                    { id: "change-approval", label: "Approval Perubahan Data", icon: CheckCircle, href: "/pelanggan/change/approval", permission: "customer.change" },
                ]
            },
            {
                id: "status-pelanggan",
                label: "Status Pelanggan",
                icon: UserMinus,
                permission: "customer.status",
                children: [
                    { id: "status-request", label: "Request Perubahan Status", icon: ClipboardList, href: "/pelanggan/status", permission: "customer.status" },
                    { id: "status-approval", label: "Approval Perubahan Status", icon: CheckCircle, href: "/pelanggan/status/approval", permission: "customer.status" },
                ]
            },
            {
                id: "koneksi-parent",
                label: "Koneksi",
                icon: Activity,
                permission: "customer.connection",
                children: [
                    { id: "connection-request", label: "Request Perubahan Koneksi", icon: ClipboardList, href: "/pelanggan/connection", permission: "customer.connection" },
                    { id: "connection-approval", label: "Approval Perubahan Koneksi", icon: CheckCircle, href: "/pelanggan/connection/approval", permission: "customer.connection" },
                ]
            },
        ]
    },

    {
        id: "billing",
        label: "Billing",
        icon: CreditCard,
        permission: "billing.view",
        children: [
            { id: "tagihan", label: "Tagihan", icon: FileText, href: "/tagihan", permission: "billing.invoice.view" },
            { id: "transaksi", label: "Riwayat Transaksi", icon: History, href: "/transaksi", permission: "billing.transaction.view" },
            { id: "janji-bayar", label: "Janji Bayar", icon: Handshake, href: "/tagihan/janji-bayar", permission: "billing.promise.view" },
        ]
    },
    {
        id: "eis",
        label: "EIS",
        icon: Presentation,
        permission: "eis.view",
        children: [
            { id: "eis-summary", label: "Dashboard Ringkasan", icon: LayoutDashboard, href: "/eis/summary", permission: "eis.summary" },
            { id: "eis-revenue", label: "Analisis Pendapatan", icon: DollarSign, href: "/eis/revenue", permission: "eis.revenue" },
            { id: "eis-growth", label: "Statistik Pelanggan", icon: TrendingUp, href: "/eis/growth", permission: "eis.growth" },
            { id: "eis-operational", label: "Kinerja Operasional", icon: Activity, href: "/eis/operational", permission: "eis.operational" },
        ]
    },
    {
        id: "layanan",
        label: "Layanan",
        icon: Package,
        permission: "service.view",
        children: [
            {
                id: "paket",
                label: "Paket",
                icon: Package,
                permission: "service.package.view",
                children: [
                    { id: "paket-list", label: "Daftar Paket", icon: List, href: "/layanan", permission: "service.package.view" },
                    { id: "paket-create", label: "Tambah Paket", icon: Package, href: "/layanan/create", permission: "service.package.create" },
                ]
            },
            {
                id: "addon",
                label: "Addon",
                icon: List,
                permission: "service.addon.view",
                children: [
                    { id: "addon-list", label: "Daftar Addon", icon: List, href: "/layanan/addon", permission: "service.addon.view" },
                    { id: "addon-create", label: "Tambah Addon", icon: Package, href: "/layanan/addon/create", permission: "service.addon.create" },
                ]
            },
            {
                id: "diskon",
                label: "Diskon",
                icon: Percent,
                permission: "service.discount.view",
                children: [
                    { id: "diskon-list", label: "Daftar Diskon", icon: List, href: "/layanan/diskon", permission: "service.discount.view" },
                    { id: "diskon-create", label: "Tambah Diskon", icon: Package, href: "/layanan/diskon/create", permission: "service.discount.create" },
                ]
            },
        ]
    },
    {
        id: "mapping",
        label: "Mapping",
        icon: Network,
        permission: "mapping.view",
        children: [
            { id: "mapping-calculator", label: "Kalkulator Redaman", icon: Calculator, href: "/mapping/calculator", permission: "mapping.calculator" },
            { id: "mapping-network", label: "Visual Mapping", icon: Map, href: "/mapping/network", permission: "mapping.network" },
        ]
    },

    {
        id: "infrastruktur",
        label: "Infra",
        icon: Network,
        permission: "infra.view",
        children: [
            {
                id: "area",
                label: "Area",
                icon: Map,
                permission: "infra.area.view",
                children: [
                    { id: "area-list", label: "List Area", icon: List, href: "/pengaturan/area", permission: "infra.area.view" },
                    { id: "area-create", label: "Buat Area", icon: Package, href: "/pengaturan/area/create", permission: "infra.area.create" },
                ]
            },
            {
                id: "odp",
                label: "ODP",
                icon: List,
                permission: "infra.odp.view",
                children: [
                    { id: "odp-list", label: "List ODP", icon: List, href: "/pengaturan/odp", permission: "infra.odp.view" },
                    { id: "odp-create", label: "Buat ODP", icon: Package, href: "/pengaturan/odp/create", permission: "infra.odp.create" },
                ]
            },
        ]
    },
    {
        id: "settings",
        label: "Settings",
        icon: Settings,
        permission: "system.view",
        children: [
            {
                id: "ppn-parent",
                label: "PPN",
                icon: FileText,
                permission: "service.ppn.view",
                children: [
                    { id: "ppn-list", label: "List PPN", icon: List, href: "/layanan/ppn", permission: "service.ppn.view" },
                    { id: "ppn-create", label: "Tambah PPN", icon: UserPlus, href: "/layanan/ppn/create", permission: "service.ppn.create" },
                ]
            },
            {
                id: "users-management",
                label: "Users",
                icon: Users,
                permission: "system.user.view",
                children: [
                    {
                        id: "user-parent",
                        label: "User",
                        icon: Users,
                        permission: "system.user.view",
                        children: [
                            { id: "user-list", label: "List Users", icon: List, href: "/pengaturan/user", permission: "system.user.view" },
                            { id: "user-create", label: "Tambah User", icon: UserPlus, href: "/pengaturan/user/create", permission: "system.user.create" },
                        ]
                    },
                    {
                        id: "role-parent",
                        label: "Role",
                        icon: Shield,
                        permission: "system.role.view",
                        children: [
                            { id: "role-list", label: "List Role", icon: List, href: "/pengaturan/role", permission: "system.role.view" },
                            { id: "role-create", label: "Tambah Role", icon: UserPlus, href: "/pengaturan/role/create", permission: "system.role.create" },
                        ]
                    },
                ]
            },
            {
                id: "router",
                label: "Router",
                icon: RouterIcon,
                permission: "system.router.view",
                children: [
                    { id: "router-list", label: "List Router", icon: List, href: "/pengaturan/router", permission: "system.router.view" },
                    { id: "router-create", label: "Buat Router", icon: Package, href: "/pengaturan/router/create", permission: "system.router.create" },
                ]
            },
            {
                id: "branch",
                label: "Cabang",
                icon: Building2,
                permission: "system.branch.view",
                children: [
                    { id: "branch-list", label: "List Cabang", icon: List, href: "/pengaturan/branch", permission: "system.branch.view" },
                    { id: "branch-create", label: "Buat Cabang", icon: Package, href: "/pengaturan/branch/create", permission: "system.branch.create" },
                ]
            },
            {
                id: "vendor",
                label: "Vendor / Perusahaan",
                icon: Building2,
                permission: "system.vendor.view",
                children: [
                    { id: "vendor-list", label: "List Vendor", icon: List, href: "/pengaturan/vendor", permission: "system.vendor.view" },
                    { id: "vendor-create", label: "Tambah Vendor", icon: Package, href: "/pengaturan/vendor/create", permission: "system.vendor.create" },
                ]
            },
            { id: "pengaturan-umum", label: "Pengaturan Umum", icon: Settings, href: "/pengaturan", permission: "system.settings.view" },
            { id: "theme", label: "Tema", icon: Palette, href: "/pengaturan/theme", permission: "system.theme.view" },
        ]
    },
];

// Helper to find title by href
export const findMenuByHref = (href: string, items: MenuItem[] = menuItems): MenuItem | null => {
    for (const item of items) {
        if (item.href === href) return item;
        if (item.children) {
            const found = findMenuByHref(href, item.children);
            if (found) return found;
        }
    }
    return null;
};
