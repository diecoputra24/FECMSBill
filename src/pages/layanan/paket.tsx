import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePackageStore } from "@/store/packageStore";
import { X, Info } from "lucide-react";
import { ModalConfirm } from "@/components/ui/modal-confirm";
import { ModalMessage } from "@/components/ui/modal-message";
import { ModalDetail } from "@/components/ui/modal-detail";
import { CustomTable } from "@/components/ui/custom-table";
import { CustomButton } from "@/components/ui/custom-button";
import { CustomInput, CustomTextArea } from "@/components/ui/custom-input";
import { CustomFilter } from "@/components/ui/custom-filter";
import { CustomSelect } from "@/components/ui/custom-select";
import type { Package } from "@/store/packageStore";
import api from "@/lib/api";

const PackageList: React.FC = () => {
    const {
        packages,
        loading,
        error: packageError,
        fetchPackages,
        updatePackage,
        deletePackage,
        filterValues,
        appliedFilters,
        sortConfig,
        setFilterValues,
        setAppliedFilters,
        setSortConfig,
        resetFilters
    } = usePackageStore();

    const [profiles, setProfiles] = useState<any[]>([]);
    const [routers, setRouters] = useState<any[]>([]);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [messageConfig, setMessageConfig] = useState<{ type: "success" | "error", title: string, message: string }>({
        type: "success",
        title: "",
        message: ""
    });

    const [editingPackage, setEditingPackage] = useState<Package | null>(null);
    const [packageToDelete, setPackageToDelete] = useState<Package | null>(null);

    // Selection & Detail states
    const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedPackageForDetail, setSelectedPackageForDetail] = useState<Package | null>(null);

    // Form Data
    const [formData, setFormData] = useState({
        namaPaket: "",
        hargaPaket: "",
        mikrotikProfile: "",
        deskripsi: "",
        displayPaket: true,
        routerId: ""
    });

    // Pagination State
    const [pagination, setPagination] = useState({
        currentPage: 1,
        pageSize: 10,
        totalItems: 0
    });

    useEffect(() => {
        fetchRouters();
        // Only fetch packages if a router is already selected (e.g. from persisting state)
        if (appliedFilters.routerId !== "") {
            fetchPackages();
        }
    }, [fetchPackages, appliedFilters.routerId]);

    // Update pagination total items when packages change
    useEffect(() => {
        setPagination(prev => ({ ...prev, totalItems: packages.length }));
    }, [packages]);

    const fetchRouters = async () => {
        try {
            const res = await api.get('/router');
            setRouters(res.data);
        } catch (err) {
            console.error("Fetch routers failed", err);
        }
    };

    const fetchProfiles = async (routerId: number) => {
        try {
            const res = await api.get(`/router/${routerId}/profiles`);
            setProfiles(res.data);
        } catch (err) {
            console.error("Fetch profiles failed", err);
            setProfiles([]);
        }
    };

    // Filter Logic
    const handleSearch = () => {
        setAppliedFilters({ ...filterValues });
        setSelectedPackageId(null);
    };

    const handleReset = () => {
        resetFilters();
        setSelectedPackageId(null);
    };

    const filteredPackages = packages.filter(pkg => {
        // Only show data if a router search has been applied
        if (appliedFilters.routerId === "") return false;

        const searchLower = appliedFilters.search.toLowerCase();
        const matchesSearch =
            pkg.namaPaket.toLowerCase().includes(searchLower) ||
            pkg.mikrotikProfile.toLowerCase().includes(searchLower);

        const matchesRouter = appliedFilters.routerId === "all" || pkg.routerId.toString() === appliedFilters.routerId;

        const matchesStatus = appliedFilters.status === "all" ||
            (appliedFilters.status === "active" && pkg.displayPaket) ||
            (appliedFilters.status === "inactive" && !pkg.displayPaket);

        return matchesSearch && matchesRouter && matchesStatus;
    });

    // Sorting Logic
    const sortedPackages = [...filteredPackages].sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === undefined || bValue === undefined) return 0;

        if (typeof aValue === 'string' && typeof bValue === 'string') {
            return sortConfig.order === "asc"
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue);
        }

        if (sortConfig.order === "asc") {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });

    // Pagination Logic
    const handlePageChange = (page: number) => {
        setPagination(prev => ({ ...prev, currentPage: page }));
    };

    const handlePageSizeChange = (size: number) => {
        setPagination(prev => ({ ...prev, pageSize: size, currentPage: 1 }));
    };

    const paginatedPackages = sortedPackages.slice(
        (pagination.currentPage - 1) * pagination.pageSize,
        pagination.currentPage * pagination.pageSize
    );

    const handleSort = (key: string) => {
        setSortConfig({
            key: key as keyof Package,
            order: sortConfig.key === key && sortConfig.order === "asc" ? "desc" : "asc"
        });
    };

    const handleOpenEditModal = (pkg: Package) => {
        setEditingPackage(pkg);
        setFormData({
            namaPaket: pkg.namaPaket,
            hargaPaket: pkg.hargaPaket.toString(),
            mikrotikProfile: pkg.mikrotikProfile,
            deskripsi: pkg.deskripsi || "",
            displayPaket: pkg.displayPaket,
            routerId: pkg.routerId.toString()
        });
        fetchProfiles(pkg.routerId);
        setIsEditModalOpen(true);
    };

    const handleRouterChange = (routerId: string) => {
        setFormData({ ...formData, routerId, mikrotikProfile: "" });
        if (routerId) {
            fetchProfiles(parseInt(routerId));
        } else {
            setProfiles([]);
        }
    }

    const handleSelectionChange = (id: string | number | null) => {
        setSelectedPackageId(id ? Number(id) : null);
    };

    const handleRowClick = (pkg: Package) => {
        setSelectedPackageForDetail(pkg);
        setIsDetailModalOpen(true);
    };

    const handleEditSelected = () => {
        const pkg = packages.find(p => p.id === selectedPackageId);
        if (pkg) handleOpenEditModal(pkg);
    };

    const handleDeleteSelected = () => {
        const pkg = packages.find(p => p.id === selectedPackageId);
        if (pkg) {
            setPackageToDelete(pkg);
            setIsDeleteModalOpen(true);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                namaPaket: formData.namaPaket,
                hargaPaket: parseFloat(formData.hargaPaket),
                mikrotikProfile: formData.mikrotikProfile,
                deskripsi: formData.deskripsi,
                displayPaket: formData.displayPaket,
                routerId: parseInt(formData.routerId)
            };

            if (editingPackage) {
                await updatePackage(editingPackage.id, payload);
                setMessageConfig({
                    type: "success",
                    title: "Berhasil!",
                    message: "Data layanan berhasil diperbarui."
                });
                setIsEditModalOpen(false);
                setIsMessageModalOpen(true);
                setSelectedPackageId(null);
            }
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
        if (packageToDelete) {
            try {
                await deletePackage(packageToDelete.id);
                setIsDeleteModalOpen(false);
                setPackageToDelete(null);
                setMessageConfig({
                    type: "success",
                    title: "Dihapus!",
                    message: "Layanan berhasil dihapus secara permanen."
                });
                setIsMessageModalOpen(true);
                setSelectedPackageId(null);
            } catch (error) {
                setMessageConfig({
                    type: "error",
                    title: "Gagal!",
                    message: "Terjadi kesalahan saat menghapus data."
                });
                setIsMessageModalOpen(true);
            }
        }
    };

    const columns = [
        {
            header: "NAMA PAKET",
            sortKey: "namaPaket",
            sortable: true,
            render: (pkg: Package) => (
                <div className="text-slate-900 font-bold">
                    {pkg.namaPaket}
                </div>
            )
        },
        {
            header: "PROFILE",
            sortKey: "mikrotikProfile",
            sortable: true,
            render: (pkg: Package) => (
                <div className="text-slate-600">
                    {pkg.mikrotikProfile}
                </div>
            )
        },
        {
            header: "HARGA BULANAN",
            sortKey: "hargaPaket",
            sortable: true,
            className: "text-right",
            render: (pkg: Package) => (
                <div className="text-right text-slate-800 font-bold">
                    Rp {pkg.hargaPaket.toLocaleString('id-ID')}
                </div>
            )
        },
        {
            header: "ROUTER",
            render: (pkg: Package) => (
                <div className="text-slate-600 uppercase tracking-tighter">
                    {pkg.router?.namaRouter || "Core Router"}
                </div>
            )
        },
        {
            header: "STATUS",
            sortable: true,
            sortKey: "displayPaket",
            render: (pkg: Package) => (
                <div className="text-left">
                    {pkg.displayPaket ? (
                        <span className="text-emerald-600 font-bold text-[12px]">
                            DI TAMPILKAN
                        </span>
                    ) : (
                        <span className="text-slate-400 font-bold text-[12px]">
                            DI SEMBUNYIKAN
                        </span>
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
                        label: "Filter Router",
                        placeholder: "Pilih Router Terlebih Dahulu",
                        value: filterValues.routerId,
                        type: "select",
                        options: [
                            { label: "Semua Router", value: "all" },
                            ...routers.map(r => ({ label: r.namaRouter, value: r.id.toString() }))
                        ],
                        onChange: (val) => setFilterValues({ routerId: val })
                    },
                    {
                        label: "Status",
                        placeholder: filterValues.routerId ? "Semua Status" : "Pilih Router dulu",
                        value: filterValues.status,
                        type: "select",
                        disabled: !filterValues.routerId,
                        options: [
                            { label: "Semua Status", value: "all" },
                            { label: "Ditampilkan", value: "active" },
                            { label: "Disembunyikan", value: "inactive" }
                        ],
                        onChange: (val) => setFilterValues({ status: val })
                    },
                    {
                        label: "Cari Paket",
                        placeholder: filterValues.routerId ? "Nama paket atau profil..." : "Pilih Router dulu",
                        value: filterValues.search,
                        type: "text",
                        disabled: !filterValues.routerId,
                        onChange: (val) => setFilterValues({ search: val })
                    }
                ]}
            />

            <CustomTable
                data={paginatedPackages}
                columns={columns}
                loading={loading}
                error={!!packageError}
                emptyMessage={appliedFilters.routerId === "" ? "Silakan pilih Router dan klik Cari untuk memuat data paket." : "Tidak ada data paket ditemukan."}
                sorting={{
                    sortKey: sortConfig.key,
                    sortOrder: sortConfig.order,
                    onSort: handleSort
                }}
                pagination={{
                    ...pagination,
                    totalItems: filteredPackages.length,
                    onPageChange: handlePageChange,
                    onPageSizeChange: handlePageSizeChange
                }}
                enableSelection={true}
                selectedId={selectedPackageId}
                onSelectionChange={handleSelectionChange}
                onRowClick={handleRowClick}
                actionButtons={selectedPackageId ? (
                    <>
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

            {/* Edit Modal */}
            {isEditModalOpen && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] animate-in fade-in duration-300" onClick={() => setIsEditModalOpen(false)} />
                    <div className="relative w-full max-w-lg bg-white rounded-lg shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300">
                        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-800 tracking-tight">
                                Edit Paket
                            </h3>
                            <CustomButton variant="ghost" size="icon" onClick={() => setIsEditModalOpen(false)} className="rounded-sm h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                                <X size={18} />
                            </CustomButton>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto max-h-[85vh]">
                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-1">
                                    <CustomSelect
                                        label="Router"
                                        required
                                        value={formData.routerId}
                                        onChange={(val) => handleRouterChange(val)}
                                        options={routers.map(r => ({ label: r.namaRouter, value: r.id.toString() }))}
                                        placeholder="Pilih Router..."
                                        disabled={!!editingPackage}
                                    />
                                    <p className="text-[10px] text-slate-400 ml-1">Pilih router untuk memuat profil MikroTik yang tersedia.</p>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <CustomInput
                                        label="Nama Layanan"
                                        required
                                        value={formData.namaPaket}
                                        onChange={(e) => setFormData({ ...formData, namaPaket: e.target.value.toUpperCase() })}
                                        placeholder="CONTOH: PAKET 10 MBPS"
                                    />
                                    <CustomInput
                                        label="Harga (Rp)"
                                        required
                                        type="number"
                                        value={formData.hargaPaket}
                                        onChange={(e) => setFormData({ ...formData, hargaPaket: e.target.value })}
                                        placeholder="0"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <CustomSelect
                                        label="Profil MikroTik"
                                        required
                                        value={formData.mikrotikProfile}
                                        onChange={(val) => setFormData({ ...formData, mikrotikProfile: val })}
                                        options={profiles.map(p => ({ label: p.name + (p.rateLimit ? ` (${p.rateLimit})` : ''), value: p.name }))}
                                        placeholder={formData.routerId ? "Pilih Profil..." : "Pilih Router Terlebih Dahulu"}
                                        disabled={!formData.routerId}
                                    />
                                </div>

                                <CustomTextArea
                                    label="Deskripsi Layanan"
                                    value={formData.deskripsi}
                                    onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                                    placeholder="Masukkan keterangan layanan, kecepatan, FUP, dll..."
                                />

                                <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-100 transition-all group">
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                                        checked={formData.displayPaket}
                                        onChange={(e) => setFormData({ ...formData, displayPaket: e.target.checked })}
                                    />
                                    <div className="flex-1">
                                        <div className="text-sm font-bold text-slate-700">Tampilkan di Menu</div>
                                        <div className="text-[11px] text-slate-500 font-medium">Jika aktif, layanan ini akan muncul di daftar pilihan paket pelanggan.</div>
                                    </div>
                                </label>
                            </div>

                            <div className="pt-6 flex justify-end gap-2 border-t border-slate-100">
                                <CustomButton type="button" variant="outline" className="h-8 px-4 font-semibold text-xs text-slate-600" onClick={() => setIsEditModalOpen(false)}>Batal</CustomButton>
                                <CustomButton type="submit" variant="primary" className="h-8 px-4 font-bold text-xs shadow-sm" disabled={loading}>{loading ? "Memproses..." : "Simpan"}</CustomButton>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            <ModalDetail
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                title="Detail Paket"
                icon={Info}
                maxWidth="md"
                onConfirm={() => setIsDetailModalOpen(false)}
                confirmLabel="Tutup"
                cancelLabel=""
                items={[
                    { label: "Nama Paket", value: selectedPackageForDetail?.namaPaket || "-" },
                    { label: "Harga", value: selectedPackageForDetail?.hargaPaket ? `Rp ${selectedPackageForDetail.hargaPaket.toLocaleString('id-ID')}` : "-" },
                    { label: "Profile MikroTik", value: selectedPackageForDetail?.mikrotikProfile || "-" },
                    { label: "Router", value: selectedPackageForDetail?.router?.namaRouter || "-" },
                    { label: "Status", value: selectedPackageForDetail?.displayPaket ? "DITAMPILKAN" : "DISEMBUNYIKAN" },
                    { label: "Deskripsi", value: selectedPackageForDetail?.deskripsi || "-" },
                ]}
            />

            <ModalConfirm
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                variant="danger"
                title="Hapus Layanan?"
                message={`Layanan "${packageToDelete?.namaPaket}" akan dihapus. Pelanggan yang menggunakan paket ini mungkin akan terpengaruh.`}
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
        </div>
    );
};

export default PackageList;
