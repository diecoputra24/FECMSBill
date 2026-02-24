import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useAreaStore } from "@/store/areaStore";
import { useBranchStore } from "@/store/branchStore";
import { useAuthStore } from "@/store/authStore";
import { X, Info } from "lucide-react";
import { ModalConfirm } from "@/components/ui/modal-confirm";
import { ModalMessage } from "@/components/ui/modal-message";
import { ModalDetail } from "@/components/ui/modal-detail";
import { CustomTable } from "@/components/ui/custom-table";
import { CustomFilter } from "@/components/ui/custom-filter";
import { CustomButton } from "@/components/ui/custom-button";
import { CustomInput } from "@/components/ui/custom-input";
import { CustomSelect } from "@/components/ui/custom-select";
import type { Area } from "@/types/area";

const AreaList: React.FC = () => {
    const {
        areas,
        loading,
        error: areaError,
        fetchAreas,
        addArea,
        updateArea,
        deleteArea,
        filterValues,
        appliedFilters,
        sortConfig,
        setFilterValues,
        setAppliedFilters,
        setSortConfig,
        resetFilters
    } = useAreaStore();
    const { branches, fetchBranches, loading: branchLoading, error: branchError } = useBranchStore();
    const { user } = useAuthStore();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [messageConfig, setMessageConfig] = useState<{ type: "success" | "error", title: string, message: string }>({
        type: "success",
        title: "",
        message: ""
    });

    const [editingArea, setEditingArea] = useState<Area | null>(null);
    const [areaToDelete, setAreaToDelete] = useState<Area | null>(null);

    // Selection & Detail states
    const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedAreaForDetail, setSelectedAreaForDetail] = useState<Area | null>(null);

    const [formData, setFormData] = useState({
        namaArea: "",
        kodeArea: "",
        branchId: ""
    });

    useEffect(() => {
        fetchBranches();
    }, [fetchBranches]);

    // Only fetch areas when branch is applied via search button
    // Only fetch areas when branch is applied via search button or if SUPERADMIN
    useEffect(() => {
        if (appliedFilters.branchId !== "" || user?.role === 'SUPERADMIN') {
            fetchAreas();
        }
    }, [appliedFilters.branchId, fetchAreas, user?.role]);

    const handleSearch = () => {
        setAppliedFilters({ ...filterValues });
        setSelectedAreaId(null);
    };

    const handleReset = () => {
        resetFilters();
        setSelectedAreaId(null);
    };

    const handleOpenModal = (area: Area) => {
        setEditingArea(area);
        setFormData({
            namaArea: area.namaArea,
            kodeArea: area.kodeArea || "",
            branchId: area.branchId.toString()
        });
        setIsModalOpen(true);
    };

    const handleOpenDeleteModal = (area: Area) => {
        setAreaToDelete(area);
        setIsDeleteModalOpen(true);
    };

    const handleSelectionChange = (id: string | number | null) => {
        setSelectedAreaId(id ? Number(id) : null);
    };

    const handleRowClick = (area: Area) => {
        setSelectedAreaForDetail(area);
        setIsDetailModalOpen(true);
    };

    const handleEditSelected = () => {
        const area = areas.find(a => a.id === selectedAreaId);
        if (area) handleOpenModal(area);
    };

    const handleDeleteSelected = () => {
        const area = areas.find(a => a.id === selectedAreaId);
        if (area) handleOpenDeleteModal(area);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const dataToSubmit = {
                namaArea: formData.namaArea,
                kodeArea: formData.kodeArea,
                branchId: parseInt(formData.branchId)
            };

            if (editingArea) {
                await updateArea(editingArea.id, dataToSubmit);
                setMessageConfig({
                    type: "success",
                    title: "Berhasil!",
                    message: "Data area berhasil diperbarui."
                });
            } else {
                await addArea(dataToSubmit);
                setMessageConfig({
                    type: "success",
                    title: "Berhasil!",
                    message: "Area baru berhasil ditambahkan."
                });
            }
            setIsModalOpen(false);
            setIsMessageModalOpen(true);
            setSelectedAreaId(null);
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
        if (areaToDelete) {
            try {
                await deleteArea(areaToDelete.id);
                setIsDeleteModalOpen(false);
                setAreaToDelete(null);
                setSelectedAreaId(null);
                setMessageConfig({
                    type: "success",
                    title: "Dihapus!",
                    message: "Area berhasil dihapus secara permanen."
                });
                setIsMessageModalOpen(true);
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
            header: "Informasi Area",
            sortable: true,
            sortKey: "namaArea",
            render: (area: Area) => (
                <div className="text-slate-900">
                    {area.namaArea} {area.kodeArea && <span className="text-slate-500 ml-1">({area.kodeArea})</span>}
                </div>
            )
        },
        {
            header: "Cabang",
            render: (area: Area) => (
                <div className="text-slate-600">
                    {area.branch?.namaBranch || "Tidak Terikat"}
                </div>
            )
        },
        {
            header: "Total ODP",
            render: (area: Area) => (
                <div className="text-slate-600">
                    {area.odps?.length || 0} ODP
                </div>
            )
        }
    ];

    const [pagination, setPagination] = useState({
        currentPage: 1,
        pageSize: 10,
        totalItems: areas.length
    });

    useEffect(() => {
        setPagination(prev => ({ ...prev, totalItems: areas.length }));
    }, [areas]);

    const handlePageSizeChange = (size: number) => {
        setPagination(prev => ({ ...prev, pageSize: size, currentPage: 1 }));
    };

    const handlePageChange = (page: number) => {
        setPagination(prev => ({ ...prev, currentPage: page }));
    };

    const handleSort = (key: string) => {
        setSortConfig({
            key: key as keyof Area,
            order: sortConfig.key === key && sortConfig.order === "asc" ? "desc" : "asc"
        });
    };

    // Filter and Sort
    const filteredAreas = areas.filter(area => {
        // Only show nothing if not SUPERADMIN and no branch selected
        if (appliedFilters.branchId === "" && user?.role !== 'SUPERADMIN') return false;

        const matchesSearch = area.namaArea.toLowerCase().includes(appliedFilters.search.toLowerCase()) ||
            (area.kodeArea && area.kodeArea.toLowerCase().includes(appliedFilters.search.toLowerCase()));

        const matchesBranch = appliedFilters.branchId === "all" || area.branchId.toString() === appliedFilters.branchId;

        return matchesSearch && matchesBranch;
    });

    const sortedAreas = [...filteredAreas].sort((a, b) => {
        const aValue = a[sortConfig.key] || "";
        const bValue = b[sortConfig.key] || "";

        const aString = aValue.toString().toLowerCase();
        const bString = bValue.toString().toLowerCase();

        if (sortConfig.order === "asc") {
            return aString.localeCompare(bString);
        } else {
            return bString.localeCompare(aString);
        }
    });

    const paginatedAreas = sortedAreas.slice(
        (pagination.currentPage - 1) * pagination.pageSize,
        pagination.currentPage * pagination.pageSize
    );

    return (
        <div className="space-y-4 pb-10">
            <CustomFilter
                onSearch={handleSearch}
                onReset={handleReset}
                onPrint={() => console.log("Printing...")}
                loading={loading}
                filters={[
                    {
                        label: "Filter Cabang",
                        placeholder: "Pilih Cabang Terlebih Dahulu",
                        value: filterValues.branchId,
                        type: "select",
                        options: [
                            { label: "Semua Cabang", value: "all" },
                            ...branches.map(b => ({ label: b.namaBranch, value: b.id.toString() }))
                        ],
                        loading: branchLoading,
                        error: !!branchError,
                        onChange: (val: string) => setFilterValues({ branchId: val })
                    },
                    {
                        label: "Cari Area",
                        placeholder: filterValues.branchId ? "Nama atau kode area..." : "Pilih Cabang dulu",
                        value: filterValues.search,
                        type: "text",
                        disabled: !filterValues.branchId,
                        onChange: (val: string) => setFilterValues({ search: val })
                    }
                ]}
            />

            <CustomTable
                data={paginatedAreas}
                columns={columns}
                loading={loading}
                error={!!areaError}
                emptyMessage={appliedFilters.branchId === "" ? "Silakan pilih Cabang dan klik Cari untuk memuat data area." : "Tidak ada data area ditemukan untuk cabang ini."}
                pagination={{
                    ...pagination,
                    totalItems: filteredAreas.length,
                    onPageChange: handlePageChange,
                    onPageSizeChange: handlePageSizeChange
                }}
                sorting={{
                    sortKey: sortConfig.key,
                    sortOrder: sortConfig.order,
                    onSort: handleSort
                }}
                enableSelection={true}
                selectedId={selectedAreaId}
                onSelectionChange={handleSelectionChange}
                onRowClick={handleRowClick}
                actionButtons={selectedAreaId ? (
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
            {isModalOpen && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] animate-in fade-in duration-300" onClick={() => setIsModalOpen(false)} />
                    <div className="relative w-full max-w-lg bg-white rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200">
                        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-800 tracking-tight">
                                {editingArea ? "Edit Area" : "Tambah Area"}
                            </h3>
                            <CustomButton variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} className="rounded-sm h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                                <X size={18} />
                            </CustomButton>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="space-y-4">
                                <CustomSelect
                                    label="Cabang"
                                    required
                                    value={formData.branchId}
                                    onChange={(val) => setFormData({ ...formData, branchId: val })}
                                    options={branches.map(b => ({ label: b.namaBranch, value: b.id.toString() }))}
                                    placeholder="Pilih Cabang"
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <CustomInput
                                        label="Nama Area"
                                        required
                                        value={formData.namaArea}
                                        onChange={(e) => setFormData({ ...formData, namaArea: e.target.value.toUpperCase() })}
                                        placeholder="Contoh: BAYUNING"
                                    />
                                    <CustomInput
                                        label="Kode Area"
                                        required
                                        value={formData.kodeArea}
                                        onChange={(e) => setFormData({ ...formData, kodeArea: e.target.value.toUpperCase() })}
                                        placeholder="Contoh: BYG"
                                    />
                                </div>
                            </div>
                            <div className="pt-6 flex justify-end gap-2">
                                <CustomButton
                                    type="button"
                                    variant="outline"
                                    className="h-8 px-4 font-semibold text-xs text-slate-600"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    Batal
                                </CustomButton>
                                <CustomButton
                                    type="submit"
                                    variant="primary"
                                    className="h-8 px-4 font-bold text-xs shadow-sm"
                                    disabled={loading}
                                >
                                    {loading ? "Memproses..." : editingArea ? "Simpan Perubahan" : "Tambah Area"}
                                </CustomButton>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            <ModalDetail
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                title="Detail Area"
                icon={Info}
                maxWidth="md"
                onConfirm={() => setIsDetailModalOpen(false)}
                confirmLabel="Tutup"
                cancelLabel=""
                items={[
                    { label: "Nama Area", value: selectedAreaForDetail?.namaArea || "-" },
                    { label: "Kode Area", value: selectedAreaForDetail?.kodeArea || "-" },
                    { label: "Cabang", value: selectedAreaForDetail?.branch?.namaBranch || "-" },
                    { label: "Total ODP", value: `${selectedAreaForDetail?.odps?.length || 0} ODP` }
                ]}
            />

            <ModalConfirm
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                variant="danger"
                title="Hapus Area?"
                message={`Area "${areaToDelete?.namaArea}" akan dihapus permanen. Data ODP di dalam area ini mungkin akan terpengaruh.`}
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

export default AreaList;
