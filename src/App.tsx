import { Routes, Route, Navigate } from "react-router-dom"
import { Suspense, lazy } from "react"
// Router configuration
import { AdminLayout } from "./components/layout/admin-layout"
import { Dashboard } from "./pages/dashboard"
import { AuthGuard } from "./components/auth/AuthGuard"
import { PermissionGuard } from "./components/auth/PermissionGuard"

const LoginPage = lazy(() => import("./pages/auth/login"));
const ThemePage = lazy(() => import("./pages/pengaturan/theme"));
const RolePage = lazy(() => import("./pages/pengaturan/role"));
const RoleCreatePage = lazy(() => import("./pages/pengaturan/role-create"));
const UserPage = lazy(() => import("./pages/pengaturan/user"));
const UserCreatePage = lazy(() => import("./pages/pengaturan/user-create"));
const BranchPage = lazy(() => import("./pages/pengaturan/branch"));
const VendorPage = lazy(() => import("./pages/pengaturan/vendor"));
const VendorCreatePage = lazy(() => import("./pages/pengaturan/vendor-create"));

const BranchCreatePage = lazy(() => import("./pages/pengaturan/branch-create"));
const AreaPage = lazy(() => import("./pages/pengaturan/area")); // Was AreaList
const AreaCreatePage = lazy(() => import("./pages/pengaturan/area-create"));
const OdpPage = lazy(() => import("./pages/pengaturan/odp")); // Was OdpList
const OdpCreatePage = lazy(() => import("./pages/pengaturan/odp-create"));
const RouterPage = lazy(() => import("./pages/pengaturan/router")); // Was RouterList
const RouterCreatePage = lazy(() => import("./pages/pengaturan/router-create"));
const PackagePage = lazy(() => import("./pages/layanan/paket")); // Was PackageList
const PackageCreatePage = lazy(() => import("./pages/layanan/paket-create"));
const AddonPage = lazy(() => import("./pages/layanan/addon"));
const AddonCreatePage = lazy(() => import("./pages/layanan/addon-create"));
const CustomerPage = lazy(() => import("./pages/pelanggan/customer"));
const CustomerCreatePage = lazy(() => import("./pages/pelanggan/customer-create"));
const InvoicePage = lazy(() => import("./pages/tagihan/tagihan"));
const RumusPage = lazy(() => import("./pages/rumus/rumus-page"));
const NetworkMapPage = lazy(() => import("./pages/mapping/network-map"));
const OpportunityDetailPage = lazy(() => import("./pages/opportunity/detail"));
const TransactionPage = lazy(() => import("./pages/transaksi/riwayat"));
const PromiseToPayPage = lazy(() => import("./pages/tagihan/janji-bayar"));
const UpgradePage = lazy(() => import("./pages/pelanggan/upgrade"));
const UpgradeApprovalPage = lazy(() => import("./pages/pelanggan/upgrade-approval"));
const CustomerChangePage = lazy(() => import("./pages/pelanggan/customer-change"));
const CustomerChangeApprovalPage = lazy(() => import("./pages/pelanggan/customer-change-approval"));
const CustomerStatusPage = lazy(() => import("./pages/pelanggan/customer-status"));
const CustomerStatusApprovalPage = lazy(() => import("./pages/pelanggan/customer-status-approval"));
const ConnectionChangePage = lazy(() => import("./pages/pelanggan/connection"));
const ConnectionApprovalPage = lazy(() => import("./pages/pelanggan/connection-approval"));
const EISSummaryPage = lazy(() => import("./pages/eis/summary"));
const EISRevenuePage = lazy(() => import("./pages/eis/revenue"));
const EISGrowthPage = lazy(() => import("./pages/eis/growth"));
const EISOperationalPage = lazy(() => import("./pages/eis/operational"));
const PPNPage = lazy(() => import("./pages/layanan/ppn"));
const PPNCreatePage = lazy(() => import("./pages/layanan/ppn-create"));


function App() {
  return (
    <Suspense fallback={<div className="flex h-screen w-screen items-center justify-center">Loading...</div>}>
      <Routes>
        {/* Public routes */}
        <Route path="/auth/login" element={<LoginPage />} />

        {/* Protected routes — wrapped with AuthGuard */}
        <Route path="/*" element={
          <AuthGuard>
            <AdminLayout>
              <Routes>
                <Route path="/" element={<Dashboard />} />

                <Route path="/pelanggan" element={<PermissionGuard permission="customer.view"><CustomerPage /></PermissionGuard>} />
                <Route path="/pelanggan/create" element={<PermissionGuard permission="customer.create"><CustomerCreatePage /></PermissionGuard>} />
                <Route path="/pelanggan/upgrade" element={<UpgradePage />} />
                <Route path="/pelanggan/upgrade/approval" element={<UpgradeApprovalPage />} />
                <Route path="/pelanggan/change" element={<CustomerChangePage />} />
                <Route path="/pelanggan/change/approval" element={<CustomerChangeApprovalPage />} />
                <Route path="/pelanggan/status" element={<CustomerStatusPage />} />
                <Route path="/pelanggan/status/approval" element={<CustomerStatusApprovalPage />} />
                <Route path="/pelanggan/connection" element={<ConnectionChangePage />} />
                <Route path="/pelanggan/connection/approval" element={<ConnectionApprovalPage />} />


                <Route path="/layanan" element={<PermissionGuard permission="service.package.view"><PackagePage /></PermissionGuard>} />
                <Route path="/layanan/create" element={<PermissionGuard permission="service.package.create"><PackageCreatePage /></PermissionGuard>} />
                <Route path="/layanan/addon" element={<PermissionGuard permission="service.addon.view"><AddonPage /></PermissionGuard>} />
                <Route path="/layanan/addon/create" element={<PermissionGuard permission="service.addon.create"><AddonCreatePage /></PermissionGuard>} />

                <Route path="/layanan/diskon" element={<div className="p-8"><h1 className="text-2xl font-bold">Daftar Diskon</h1><p className="text-slate-500 mt-2">Kelola daftar diskon di sini.</p></div>} />
                <Route path="/layanan/diskon/create" element={<div className="p-8"><h1 className="text-2xl font-bold">Tambah Diskon</h1><p className="text-slate-500 mt-2">Buat promo atau diskon baru di sini.</p></div>} />

                <Route path="/pengaturan/branch" element={<PermissionGuard permission="system.branch.view"><BranchPage /></PermissionGuard>} />
                <Route path="/pengaturan/branch/create" element={<PermissionGuard permission="system.branch.create"><BranchCreatePage /></PermissionGuard>} />

                <Route path="/pengaturan/vendor" element={<PermissionGuard permission="system.vendor.view"><VendorPage /></PermissionGuard>} />
                <Route path="/pengaturan/vendor/create" element={<PermissionGuard permission="system.vendor.create"><VendorCreatePage /></PermissionGuard>} />
                <Route path="/pengaturan/vendor/edit/:id" element={<PermissionGuard permission="system.vendor.create"><VendorCreatePage /></PermissionGuard>} />

                <Route path="/pengaturan/area" element={<PermissionGuard permission="infra.area.view"><AreaPage /></PermissionGuard>} />
                <Route path="/pengaturan/area/create" element={<PermissionGuard permission="infra.area.create"><AreaCreatePage /></PermissionGuard>} />

                <Route path="/pengaturan/odp" element={<PermissionGuard permission="infra.odp.view"><OdpPage /></PermissionGuard>} />
                <Route path="/pengaturan/odp/create" element={<PermissionGuard permission="infra.odp.create"><OdpCreatePage /></PermissionGuard>} />

                <Route path="/pengaturan/router" element={<PermissionGuard permission="system.router.view"><RouterPage /></PermissionGuard>} />
                <Route path="/pengaturan/router/create" element={<PermissionGuard permission="system.router.create"><RouterCreatePage /></PermissionGuard>} />
                <Route path="/pengaturan/router/edit/:id" element={<PermissionGuard permission="system.router.create"><RouterCreatePage /></PermissionGuard>} />



                <Route path="/tagihan" element={<PermissionGuard permission="billing.invoice.view"><InvoicePage /></PermissionGuard>} />
                <Route path="/tagihan/janji-bayar" element={<PermissionGuard permission="billing.promise.view"><PromiseToPayPage /></PermissionGuard>} />
                <Route path="/transaksi" element={<PermissionGuard permission="billing.transaction.view"><TransactionPage /></PermissionGuard>} />

                {/* EIS Routes */}
                <Route path="/eis/summary" element={<PermissionGuard permission="eis.summary"><EISSummaryPage /></PermissionGuard>} />
                <Route path="/eis/revenue" element={<PermissionGuard permission="eis.revenue"><EISRevenuePage /></PermissionGuard>} />
                <Route path="/eis/growth" element={<PermissionGuard permission="eis.growth"><EISGrowthPage /></PermissionGuard>} />
                <Route path="/eis/operational" element={<PermissionGuard permission="eis.operational"><EISOperationalPage /></PermissionGuard>} />

                <Route path="/layanan/ppn" element={<PermissionGuard permission="service.ppn.view"><PPNPage /></PermissionGuard>} />
                <Route path="/layanan/ppn/create" element={<PermissionGuard permission="service.ppn.create"><PPNCreatePage /></PermissionGuard>} />

                <Route path="/laporan" element={<div className="p-8"><h1 className="text-2xl font-bold">Laporan</h1><p className="text-slate-500 mt-2">Analitik dan laporan bulanan.</p></div>} />

                {/* Mapping Routes */}
                <Route path="/mapping/calculator" element={<RumusPage />} />
                <Route path="/mapping/network" element={<NetworkMapPage />} />

                <Route path="/pengaturan" element={<div className="p-8"><h1 className="text-2xl font-bold">Pengaturan</h1><p className="text-slate-500 mt-2">Pengaturan sistem dan preferensi.</p></div>} />

                <Route path="/opportunity/track" element={<div className="p-8"><h1 className="text-2xl font-bold">Track Opportunity</h1><p className="text-slate-500 mt-2">Lacak peluang bisnis.</p></div>} />
                <Route path="/opportunity/list" element={<div className="p-8"><h1 className="text-2xl font-bold">List Opportunity</h1><p className="text-slate-500 mt-2">Daftar semua peluang.</p></div>} />
                <Route path="/opportunity/detail" element={<OpportunityDetailPage />} />

                <Route path="/pengaturan/theme" element={<PermissionGuard permission="system.theme.view"><ThemePage /></PermissionGuard>} />
                <Route path="/pengaturan/role" element={<PermissionGuard permission="system.role.view"><RolePage /></PermissionGuard>} />
                <Route path="/pengaturan/role/create" element={<PermissionGuard permission="system.role.create"><RoleCreatePage /></PermissionGuard>} />
                <Route path="/pengaturan/user" element={<PermissionGuard permission="system.user.view"><UserPage /></PermissionGuard>} />
                <Route path="/pengaturan/user/create" element={<PermissionGuard permission="system.user.create"><UserCreatePage /></PermissionGuard>} />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AdminLayout>
          </AuthGuard>
        } />
      </Routes>
    </Suspense>
  );
}

export default App
