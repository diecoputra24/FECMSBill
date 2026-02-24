import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouterStore } from "@/store/routerStore";
import { CustomFilter } from "@/components/ui/custom-filter";
import { CustomTable } from "@/components/ui/custom-table";
import { CustomButton } from "@/components/ui/custom-button";
import { CustomInput } from "@/components/ui/custom-input";
import { CustomSelect } from "@/components/ui/custom-select";
import type { Router } from "@/store/routerStore";
import { Power, Wifi, X, Info, Shield } from "lucide-react";
import { ModalConfirm } from "@/components/ui/modal-confirm";
import { ModalMessage } from "@/components/ui/modal-message";
import { ModalLoading } from "@/components/ui/modal-loading";
import { ModalDetail } from "@/components/ui/modal-detail";
import { cn } from "@/lib/utils";

const RouterList: React.FC = () => {
    const {
        routers,
        loading,
        error: routerError,
        fetchRouters,
        addRouter,
        updateRouter,
        deleteRouter,
        testConnection,
        getPppProfiles,
        filterValues,
        appliedFilters,
        sortConfig,
        setFilterValues,
        setAppliedFilters,
        setSortConfig,
        resetFilters
    } = useRouterStore();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [messageConfig, setMessageConfig] = useState<{ type: "success" | "error", title: string, message: string }>({
        type: "success",
        title: "",
        message: ""
    });

    const [editingRouter, setEditingRouter] = useState<Router | null>(null);
    const [routerToDelete, setRouterToDelete] = useState<Router | null>(null);

    // Isolation Profile State
    const [isIsolationModalOpen, setIsIsolationModalOpen] = useState(false);
    const [pppProfiles, setPppProfiles] = useState<any[]>([]);
    const [selectedProfileForIsolation, setSelectedProfileForIsolation] = useState<string | null>(null);
    const [selectedSchemeForIsolation, setSelectedSchemeForIsolation] = useState<string>("CHANGE_PROFILE");
    const [isolationLoading, setIsolationLoading] = useState(false);

    // Selection & Detail states
    const [selectedRouterId, setSelectedRouterId] = useState<number | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedRouterForDetail, setSelectedRouterForDetail] = useState<Router | null>(null);

    const [formData, setFormData] = useState({
        namaRouter: "",
        hostAddress: "",
        apiPort: "8728",
        username: "",
        password: "",
        isActive: true,
        isolir: false,
        isolirProfile: ""
    });

    // Pagination State
    const [pagination, setPagination] = useState({
        currentPage: 1,
        pageSize: 10,
        totalItems: 0
    });

    // Initial fetch
    useEffect(() => {
        if (routers.length === 0 || appliedFilters.selectedRouterId !== "") {
            fetchRouters();
        }
    }, [fetchRouters, routers.length, appliedFilters.selectedRouterId]);

    // Update pagination total items when routers change
    useEffect(() => {
        setPagination(prev => ({ ...prev, totalItems: routers.length }));
    }, [routers]);


    const handleSearch = () => {
        setAppliedFilters({ ...filterValues });
        setSelectedRouterId(null);
    };

    const handleReset = () => {
        resetFilters();
        setSelectedRouterId(null);
    };

    const handleOpenModal = (router?: Router) => {
        if (router) {
            setEditingRouter(router);
            setFormData({
                namaRouter: router.namaRouter,
                hostAddress: router.hostAddress,
                apiPort: router.apiPort.toString(),
                username: router.username,
                password: "", // Avoid pre-filling password
                isActive: router.isActive,
                isolir: router.isolir,
                isolirProfile: router.isolirProfile || ""
            });
        } else {
            setEditingRouter(null);
            setFormData({
                namaRouter: "",
                hostAddress: "",
                apiPort: "8728",
                username: "",
                password: "",
                isActive: true,
                isolir: false,
                isolirProfile: ""
            });
        }
        setIsModalOpen(true);
    };

    const handleOpenDeleteModal = (router: Router) => {
        setRouterToDelete(router);
        setIsDeleteModalOpen(true);
    };

    const handleSelectionChange = (id: string | number | null) => {
        setSelectedRouterId(id ? Number(id) : null);
    };

    const handleRowClick = (router: Router) => {
        setSelectedRouterForDetail(router);
        setIsDetailModalOpen(true);
    };

    const getSelectedRouter = () => routers.find(r => r.id === selectedRouterId);

    const handleEditSelected = () => {
        const router = getSelectedRouter();
        if (router) handleOpenModal(router);
    };

    const handleDeleteSelected = () => {
        const router = getSelectedRouter();
        if (router) handleOpenDeleteModal(router);
    };

    const handleToggleStatusSelected = async () => {
        const router = getSelectedRouter();
        if (router) await handleToggleStatus(router);
    };

    const handleTestConnectionSelected = async () => {
        const router = getSelectedRouter();
        if (router) await handleTestConnection(router);
    };

    const handleOpenIsolationModal = async (router: Router) => {
        setEditingRouter(router);
        setIsolationLoading(true);
        setIsIsolationModalOpen(true);
        setSelectedSchemeForIsolation(router.isolirScheme || "DISABLE");

        try {
            const profiles = await getPppProfiles(router.uuid);
            // Map profiles to have an 'id' property strictly for the table key
            // Use 'name' as ID because it's unique and consistent
            const mappedProfiles = profiles.map((p: any) => ({ ...p, id: p.name }));
            setPppProfiles(mappedProfiles);

            // If router has a profile, try to find its ID to pre-select
            // The table selection works by ID which is now name.
            if (router.isolirProfile) {
                setSelectedProfileForIsolation(router.isolirProfile);
            } else {
                setSelectedProfileForIsolation(null);
            }
        } catch (error) {
            console.error(error);
            setMessageConfig({
                type: "error",
                title: "Gagal Memuat Profil",
                message: "Tidak dapat mengambil daftar profil PPP dari router."
            });
            setIsMessageModalOpen(true);
            setIsIsolationModalOpen(false);
        } finally {
            setIsolationLoading(false);
        }
    };

    const handleSaveIsolationProfile = async () => {
        if (!editingRouter) return;

        const payload: any = { isolirScheme: selectedSchemeForIsolation };

        if (selectedSchemeForIsolation === 'CHANGE_PROFILE') {
            if (!selectedProfileForIsolation) {
                setMessageConfig({
                    type: "error",
                    title: "Pilih Profil",
                    message: "Anda wajib memilih Profil Isolir jika menggunakan skema Ganti Profile."
                });
                setIsMessageModalOpen(true);
                return;
            }

            // Find the name of the selected profile
            const profile = pppProfiles.find(p => p.id === selectedProfileForIsolation);
            if (!profile) return;
            payload.isolirProfile = profile.name;
        }

        try {
            await updateRouter(editingRouter.uuid, payload);
            setMessageConfig({
                type: "success",
                title: "Berhasil!",
                message: "Konfigurasi isolir berhasil disimpan."
            });
            setIsIsolationModalOpen(false);
            setIsMessageModalOpen(true);
            // Clear selection
            setSelectedProfileForIsolation(null);
            setSelectedRouterId(null);
        } catch (error) {
            setMessageConfig({
                type: "error",
                title: "Gagal!",
                message: "Terjadi kesalahan saat menyimpan konfigurasi isolir."
            });
            setIsMessageModalOpen(true);
        }
    };

    const handleIsolationClick = () => {
        const router = getSelectedRouter();
        if (router) handleOpenIsolationModal(router);
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                namaRouter: formData.namaRouter,
                hostAddress: formData.hostAddress,
                apiPort: parseInt(formData.apiPort),
                username: formData.username,
                isActive: formData.isActive,
                isolir: formData.isolir,
                ...(formData.password ? { password: formData.password } : {})
            };

            if (editingRouter) {
                await updateRouter(editingRouter.uuid, payload);
                setMessageConfig({
                    type: "success",
                    title: "Berhasil!",
                    message: "Data router berhasil diperbarui."
                });
            } else {
                if (!formData.password) {
                    setMessageConfig({
                        type: "error",
                        title: "Validasi Gagal",
                        message: "Password wajib diisi untuk router baru."
                    });
                    setIsMessageModalOpen(true);
                    return;
                }
                await addRouter(payload as any);
                setMessageConfig({
                    type: "success",
                    title: "Berhasil!",
                    message: "Router baru berhasil ditambahkan."
                });
            }
            setIsModalOpen(false);
            setIsMessageModalOpen(true);
            setSelectedRouterId(null);
        } catch (error) {
            setMessageConfig({
                type: "error",
                title: "Gagal!",
                message: "Terjadi kesalahan saat menyimpan data."
            });
            setIsMessageModalOpen(true);
        }
    };

    const handleDelete = async () => {
        if (!routerToDelete) return;
        try {
            await deleteRouter(routerToDelete.uuid);
            setMessageConfig({
                type: "success",
                title: "Berhasil!",
                message: "Data router berhasil dihapus."
            });
            setIsDeleteModalOpen(false);
            setIsMessageModalOpen(true);
            setSelectedRouterId(null);
        } catch (error) {
            setMessageConfig({
                type: "error",
                title: "Gagal!",
                message: "Terjadi kesalahan saat menghapus data."
            });
            setIsDeleteModalOpen(false);
            setIsMessageModalOpen(true);
        }
    };

    const handleToggleStatus = async (router: Router) => {
        try {
            await updateRouter(router.uuid, { isActive: !router.isActive });
        } catch (error) {
            console.error("Failed to toggle status", error);
        }
    }

    const [isTestLoading, setIsTestLoading] = useState(false);

    const handleTestConnection = async (router: Router) => {
        setIsTestLoading(true);
        try {
            const result = await testConnection(router.uuid);
            setIsTestLoading(false);

            if (result.status === 'success') {
                setMessageConfig({
                    type: "success",
                    title: "Koneksi Berhasil!",
                    message: `Terhubung ke ${result.identity?.name || router.namaRouter}. Versi: ${result.identity?.version || 'Unknown'}`
                });
            } else {
                setMessageConfig({
                    type: "error",
                    title: "Koneksi Gagal",
                    message: result.message || "Tidak dapat terhubung ke router."
                });
            }
            setIsMessageModalOpen(true);
        } catch (error: any) {
            setIsTestLoading(false);
            setMessageConfig({
                type: "error",
                title: "Error",
                message: error.message || "Terjadi kesalahan saat menguji koneksi."
            });
            setIsMessageModalOpen(true);
        }
    };

    const filteredRouters = routers.filter(router => {
        const matchesSelected = appliedFilters.selectedRouterId === "all" || router.id.toString() === appliedFilters.selectedRouterId;
        if (appliedFilters.selectedRouterId === "") return false;

        const searchLower = appliedFilters.search.toLowerCase();
        const matchesSearch =
            router.namaRouter.toLowerCase().includes(searchLower) ||
            router.hostAddress.toLowerCase().includes(searchLower) ||
            router.username.toLowerCase().includes(searchLower);

        const matchesStatus = appliedFilters.status === "all" ||
            (appliedFilters.status === "active" && router.isActive) ||
            (appliedFilters.status === "inactive" && !router.isActive);

        return matchesSelected && matchesSearch && matchesStatus;
    });

    const sortedRouters = [...filteredRouters].sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (aValue === undefined || bValue === undefined) return 0;
        if (typeof aValue === 'string' && typeof bValue === 'string') {
            return sortConfig.order === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
        return sortConfig.order === "asc" ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
    });

    const handleSort = (key: string) => {
        setSortConfig({
            key: key as keyof Router,
            order: sortConfig.key === key && sortConfig.order === "asc" ? "desc" : "asc"
        });
    };

    const handlePageChange = (page: number) => {
        setPagination(prev => ({ ...prev, currentPage: page }));
    };

    const handlePageSizeChange = (size: number) => {
        setPagination(prev => ({ ...prev, pageSize: size, currentPage: 1 }));
    };

    const paginatedRouters = sortedRouters.slice(
        (pagination.currentPage - 1) * pagination.pageSize,
        pagination.currentPage * pagination.pageSize
    );

    const columns = [
        {
            header: "NAMA ROUTER",
            sortKey: "namaRouter",
            sortable: true,
            render: (row: Router) => (
                <div className="text-slate-900">{row.namaRouter}</div>
            )
        },
        {
            header: "HOST / IP",
            sortKey: "hostAddress",
            sortable: true,
            render: (row: Router) => (
                <div className="flex items-center gap-2 text-slate-600">
                    <Wifi size={14} className="text-slate-400" />
                    <span>{row.hostAddress}:{row.apiPort}</span>
                </div>
            )
        },
        {
            header: "USERNAME",
            sortKey: "username",
            sortable: true,
            render: (row: Router) => (
                <span className="text-slate-600">{row.username}</span>
            )
        },
        {
            header: "STATUS",
            sortKey: "isActive",
            sortable: true,
            render: (row: Router) => (
                <div className="flex flex-col gap-1">
                    <div className={cn(
                        "font-bold text-[12px]",
                        row.isActive ? "text-green-600" : "text-red-600"
                    )}>
                        {row.isActive ? "ACTIVE" : "INACTIVE"}
                    </div>
                    {row.isolir && (
                        <div className="text-amber-600 text-[11px] font-bold">
                            ISOLIR: {row.isolirProfile || "Belum diset"}
                        </div>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="space-y-4 pb-10">
            <CustomFilter
                onSearch={handleSearch}
                onReset={handleReset}
                loading={loading}
                filters={[
                    {
                        label: "Pilih Router",
                        placeholder: "Pilih Router Terlebih Dahulu",
                        value: filterValues.selectedRouterId,
                        type: "select",
                        options: [
                            { label: "Semua Router", value: "all" },
                            ...routers.map(r => ({ label: r.namaRouter, value: r.id.toString() }))
                        ],
                        onChange: (val) => setFilterValues({ selectedRouterId: val })
                    },
                    {
                        label: "Status",
                        placeholder: filterValues.selectedRouterId ? "Semua Status" : "Pilih Router dulu",
                        value: filterValues.status,
                        type: "select",
                        disabled: !filterValues.selectedRouterId,
                        options: [
                            { label: "Semua Status", value: "all" },
                            { label: "Active", value: "active" },
                            { label: "Inactive", value: "inactive" }
                        ],
                        onChange: (val) => setFilterValues({ status: val })
                    },
                    {
                        label: "Cari Router",
                        placeholder: filterValues.selectedRouterId ? "Nama router, IP, atau username..." : "Pilih Router dulu",
                        value: filterValues.search,
                        type: "text",
                        disabled: !filterValues.selectedRouterId,
                        onChange: (val) => setFilterValues({ search: val })
                    }
                ]}
            />

            <CustomTable
                data={paginatedRouters}
                columns={columns}
                loading={loading}
                error={!!routerError}
                errorMessage={routerError || undefined}
                emptyMessage={appliedFilters.selectedRouterId === "" ? "Silakan pilih Router dan klik Cari untuk memuat data." : "Tidak ada data router ditemukan."}
                sorting={{
                    sortKey: sortConfig.key,
                    sortOrder: sortConfig.order,
                    onSort: handleSort
                }}
                pagination={{
                    ...pagination,
                    totalItems: filteredRouters.length,
                    onPageChange: handlePageChange,
                    onPageSizeChange: handlePageSizeChange
                }}
                enableSelection={true}
                selectedId={selectedRouterId}
                onSelectionChange={handleSelectionChange}
                onRowClick={handleRowClick}
                actionButtons={selectedRouterId ? (
                    <>
                        <CustomButton
                            variant="secondary"
                            size="sm"
                            className="h-8 shadow-sm bg-white border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
                            onClick={handleTestConnectionSelected}
                            title="Test Connection"
                        >
                            <Wifi size={14} className="mr-1.5" />
                            Tes Koneksi
                        </CustomButton>
                        <CustomButton
                            variant="secondary"
                            size="sm"
                            className="h-8 shadow-sm bg-white border-slate-200 text-slate-600 hover:text-amber-600 hover:bg-amber-50"
                            onClick={handleIsolationClick}
                            title="Konfigurasi Profil Isolir"
                        >
                            <Shield size={14} className="mr-1.5" />
                            Profil Isolir
                        </CustomButton>
                        <CustomButton
                            variant="secondary"
                            size="sm"
                            className={cn(
                                "h-8 shadow-sm bg-white border-slate-200",
                                getSelectedRouter()?.isActive ? "text-red-500 hover:text-red-600 hover:bg-red-50" : "text-green-500 hover:text-green-600 hover:bg-green-50"
                            )}
                            onClick={handleToggleStatusSelected}
                        >
                            <Power size={14} className="mr-1.5" />
                            {getSelectedRouter()?.isActive ? "Nonaktifkan" : "Aktifkan"}
                        </CustomButton>
                        <CustomButton
                            variant="secondary"
                            size="sm"
                            className="h-8 shadow-sm bg-white border-slate-200 text-slate-600 hover:text-primary hover:bg-slate-50"
                            onClick={handleEditSelected}
                        >
                            Edit
                        </CustomButton>
                        <CustomButton
                            variant="danger"
                            size="sm"
                            className="h-8 shadow-sm"
                            onClick={handleDeleteSelected}
                        >
                            Hapus
                        </CustomButton>
                    </>
                ) : null}
            />

            {/* Edit/Create Modal */}
            {isModalOpen && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] animate-in fade-in duration-300" onClick={() => setIsModalOpen(false)} />
                    <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200">
                        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-800 tracking-tight">
                                {editingRouter ? "Edit Router" : "Tambah Router"}
                            </h3>
                            <CustomButton variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} className="rounded-sm h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                                <X size={18} />
                            </CustomButton>
                        </div>
                        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[90vh]">
                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Informasi Umum</h4>
                                        <CustomInput
                                            label="Nama Router"
                                            required
                                            value={formData.namaRouter}
                                            onChange={(e) => setFormData({ ...formData, namaRouter: e.target.value })}
                                            placeholder="Contoh: Router Utama"
                                        />
                                        <div className="grid grid-cols-2 gap-4">
                                            <CustomSelect
                                                label="Status"
                                                required
                                                value={formData.isActive.toString()}
                                                onChange={(val) => setFormData({ ...formData, isActive: val === "true" })}
                                                options={[
                                                    { label: "Active", value: "true" },
                                                    { label: "Inactive", value: "false" }
                                                ]}
                                                placeholder="Pilih Status"
                                            />
                                            <CustomSelect
                                                label="Isolir"
                                                required
                                                value={formData.isolir.toString()}
                                                onChange={(val) => setFormData({ ...formData, isolir: val === "true" })}
                                                options={[
                                                    { label: "Ya", value: "true" },
                                                    { label: "Tidak", value: "false" }
                                                ]}
                                                placeholder="Pilih Isolir"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Koneksi & Autentikasi</h4>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="col-span-2">
                                                <CustomInput
                                                    label="Host Address"
                                                    required
                                                    value={formData.hostAddress}
                                                    onChange={(e) => setFormData({ ...formData, hostAddress: e.target.value })}
                                                    placeholder="192.168.88.1"
                                                />
                                            </div>
                                            <CustomInput
                                                label="Port API"
                                                type="number"
                                                required
                                                value={formData.apiPort}
                                                onChange={(e) => setFormData({ ...formData, apiPort: e.target.value })}
                                                placeholder="8728"
                                            />
                                        </div>
                                        <CustomInput
                                            label="Username"
                                            required
                                            value={formData.username}
                                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                            placeholder="admin"
                                        />
                                        <CustomInput
                                            label={editingRouter ? "Password (Kosongkan jika tetap)" : "Password"}
                                            type="password"
                                            required={!editingRouter}
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>

                                <div className="pt-6 flex justify-end gap-2 border-t border-slate-100">
                                    <CustomButton type="button" variant="outline" className="h-8 px-4 font-semibold text-xs text-slate-600" onClick={() => setIsModalOpen(false)}>Batal</CustomButton>
                                    <CustomButton type="submit" variant="primary" className="h-8 px-4 font-bold text-xs shadow-sm" disabled={loading}>
                                        {loading ? "Memproses..." : editingRouter ? "Simpan Perubahan" : "Tambah Router"}
                                    </CustomButton>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            <ModalDetail
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                title="Detail Router"
                icon={Info}
                maxWidth="md"
                onConfirm={() => setIsDetailModalOpen(false)}
                confirmLabel="Tutup"
                cancelLabel=""
                items={[
                    { label: "Nama Router", value: selectedRouterForDetail?.namaRouter || "-" },
                    { label: "Host Address", value: `${selectedRouterForDetail?.hostAddress}:${selectedRouterForDetail?.apiPort}` },
                    { label: "Username", value: selectedRouterForDetail?.username || "-" },
                    { label: "Status", value: selectedRouterForDetail?.isActive ? "ACTIVE" : "INACTIVE" },
                    { label: "Isolir", value: selectedRouterForDetail?.isolir ? "YA" : "TIDAK" },
                    { label: "Profil Isolir", value: selectedRouterForDetail?.isolirProfile || "Belum diset" },
                ]}
            />

            <ModalConfirm
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                variant="danger"
                title="Hapus Router?"
                message={`Router "${routerToDelete?.namaRouter}" akan dihapus permanen. Aksi ini tidak dapat dibatalkan.`}
                confirmLabel="Ya, Hapus"
                loading={loading}
            />

            <ModalMessage
                isOpen={isMessageModalOpen}
                onClose={() => setIsMessageModalOpen(false)}
                type={messageConfig.type}
                title={messageConfig.title}
                message={messageConfig.message}
            />

            <ModalLoading isOpen={isTestLoading} message="Menguji koneksi router..." />

            {/* Isolation Profile Modal */}
            {isIsolationModalOpen && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] animate-in fade-in duration-300" onClick={() => setIsIsolationModalOpen(false)} />
                    <div className="relative w-full max-w-3xl bg-white rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 tracking-tight">
                                    Konfigurasi Isolir
                                </h3>
                                <p className="text-slate-500 text-xs mt-0.5">
                                    Atur metode isolir untuk router <strong>{editingRouter?.namaRouter}</strong>.
                                </p>
                            </div>
                            <CustomButton variant="ghost" size="icon" onClick={() => setIsIsolationModalOpen(false)} className="rounded-sm h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                                <X size={18} />
                            </CustomButton>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            {/* Scheme Selection */}
                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-slate-700">Pilih Skema Isolir</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div
                                        className={cn(
                                            "border rounded-lg p-4 cursor-pointer transition-all hover:bg-slate-50",
                                            selectedSchemeForIsolation === 'CHANGE_PROFILE' ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-slate-200"
                                        )}
                                        onClick={() => setSelectedSchemeForIsolation('CHANGE_PROFILE')}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn("w-4 h-4 rounded-full border flex items-center justify-center", selectedSchemeForIsolation === 'CHANGE_PROFILE' ? "border-primary" : "border-slate-300")}>
                                                {selectedSchemeForIsolation === 'CHANGE_PROFILE' && <div className="w-2 h-2 rounded-full bg-primary" />}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-800">Ganti Profile</div>
                                                <div className="text-xs text-slate-500">Ubah profil PPP secret pengguna (cth: ke profil isolir).</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div
                                        className={cn(
                                            "border rounded-lg p-4 cursor-pointer transition-all hover:bg-slate-50",
                                            selectedSchemeForIsolation === 'DISABLE' ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-slate-200"
                                        )}
                                        onClick={() => setSelectedSchemeForIsolation('DISABLE')}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn("w-4 h-4 rounded-full border flex items-center justify-center", selectedSchemeForIsolation === 'DISABLE' ? "border-primary" : "border-slate-300")}>
                                                {selectedSchemeForIsolation === 'DISABLE' && <div className="w-2 h-2 rounded-full bg-primary" />}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-800">Disable Secret</div>
                                                <div className="text-xs text-slate-500">Nonaktifkan secret pengguna sepenuhnya.</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Conditional Content */}
                            {selectedSchemeForIsolation === 'CHANGE_PROFILE' && (
                                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <label className="text-sm font-semibold text-slate-700">Pilih Profil Isolir</label>
                                    <div className="border border-slate-200 rounded-lg overflow-hidden h-64 flex flex-col">
                                        <CustomTable
                                            data={pppProfiles}
                                            loading={isolationLoading}
                                            emptyMessage="Tidak ada profil PPP ditemukan pada router ini."
                                            enableSelection={true}
                                            selectedId={selectedProfileForIsolation}
                                            onSelectionChange={(id) => setSelectedProfileForIsolation(id as string)}
                                            onRowClick={(row: any) => setSelectedProfileForIsolation(row.id)}
                                            columns={[
                                                { header: "NAMA PROFIL", render: (row) => <span className="font-bold text-slate-700">{row.name}</span> },
                                                { header: "LOCAL ADDRESS", render: (row) => row['local-address'] || "-" },
                                                { header: "REMOTE ADDRESS", render: (row) => row['remote-address'] || "-" },
                                                { header: "RATE LIMIT", render: (row) => row['rate-limit'] || "-" },
                                            ]}
                                        />
                                    </div>
                                </div>
                            )}

                            {selectedSchemeForIsolation === 'DISABLE' && (
                                <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg text-amber-800 text-sm animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="font-bold mb-1">Perhatian</div>
                                    <p>Dengan memilih opsi ini, pelanggan yang terisolir akan <strong>tidak bisa konek sama sekali</strong> (Secret Disabled) sampai tagihan dilunasi.</p>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50/50 gap-2">
                            <CustomButton variant="outline" className="h-8" onClick={() => setIsIsolationModalOpen(false)}>
                                Batal
                            </CustomButton>
                            <CustomButton
                                variant="primary"
                                className="h-8 shadow-sm"
                                onClick={handleSaveIsolationProfile}
                                disabled={(selectedSchemeForIsolation === 'CHANGE_PROFILE' && !selectedProfileForIsolation) || isolationLoading}
                            >
                                Simpan Konfigurasi
                            </CustomButton>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default RouterList;
