import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useAddonStore } from "@/store/addonStore";
import { X, Info } from "lucide-react";
import { ModalConfirm } from "@/components/ui/modal-confirm";
import { ModalMessage } from "@/components/ui/modal-message";
import { ModalDetail } from "@/components/ui/modal-detail";
import { CustomTable } from "@/components/ui/custom-table";
import { CustomButton } from "@/components/ui/custom-button";
import { CustomInput, CustomTextArea, CustomCurrencyInput } from "@/components/ui/custom-input";
import type { Addon } from "@/types/addon";

const AddonList: React.FC = () => {
    const {
        addons,
        loading,
        error: addonError,
        fetchAddons,
        addAddon,
        updateAddon,
        deleteAddon,
        sortConfig,
        setSortConfig,
    } = useAddonStore();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [messageConfig, setMessageConfig] = useState<{ type: "success" | "error", title: string, message: string }>({
        type: "success",
        title: "",
        message: ""
    });

    const [editingAddon, setEditingAddon] = useState<Addon | null>(null);
    const [addonToDelete, setAddonToDelete] = useState<Addon | null>(null);

    // Selection & Detail states
    const [selectedAddonId, setSelectedAddonId] = useState<number | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedAddonForDetail, setSelectedAddonForDetail] = useState<Addon | null>(null);

    const [formData, setFormData] = useState({
        name: "",
        price: "",
        description: ""
    });

    // Initial fetch
    useEffect(() => {
        fetchAddons();
    }, [fetchAddons]);

    const handleOpenModal = (addon: Addon) => {
        setEditingAddon(addon);
        setFormData({
            name: addon.name,
            price: addon.price.toString(),
            description: addon.description || ""
        });
        setIsModalOpen(true);
    };

    const handleOpenDeleteModal = (addon: Addon) => {
        setAddonToDelete(addon);
        setIsDeleteModalOpen(true);
    };

    const handleSelectionChange = (id: string | number | null) => {
        setSelectedAddonId(id ? Number(id) : null);
    };

    const handleRowClick = (addon: Addon) => {
        setSelectedAddonForDetail(addon);
        setIsDetailModalOpen(true);
    };

    const handleEditSelected = () => {
        const addon = addons.find(a => a.id === selectedAddonId);
        if (addon) handleOpenModal(addon);
    };

    const handleDeleteSelected = () => {
        const addon = addons.find(a => a.id === selectedAddonId);
        if (addon) handleOpenDeleteModal(addon);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const dataToSubmit = {
                name: formData.name,
                price: formData.price,
                description: formData.description
            };

            if (editingAddon) {
                await updateAddon(editingAddon.id, dataToSubmit);
                setMessageConfig({
                    type: "success",
                    title: "Berhasil!",
                    message: "Data addon berhasil diperbarui."
                });
            } else {
                await addAddon(dataToSubmit);
                setMessageConfig({
                    type: "success",
                    title: "Berhasil!",
                    message: "Addon baru berhasil ditambahkan."
                });
            }
            setIsModalOpen(false);
            setIsMessageModalOpen(true);
            setSelectedAddonId(null);
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
        if (addonToDelete) {
            try {
                await deleteAddon(addonToDelete.id);
                setIsDeleteModalOpen(false);
                setAddonToDelete(null);
                setSelectedAddonId(null);
                setMessageConfig({
                    type: "success",
                    title: "Dihapus!",
                    message: "Addon berhasil dihapus secara permanen."
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
            header: "Nama Layanan Tambahan",
            sortable: true,
            sortKey: "name",
            render: (addon: Addon) => (
                <div className="text-left font-bold text-slate-800">
                    {addon.name}
                </div>
            )
        },
        {
            header: "Harga",
            sortable: true,
            sortKey: "price",
            render: (addon: Addon) => (
                <div className="text-left font-medium text-slate-600">
                    Rp {Number(addon.price).toLocaleString('id-ID')}
                </div>
            )
        },
        {
            header: "Deskripsi",
            render: (addon: Addon) => (
                <div className="text-left text-slate-500 text-sm truncate max-w-xs">
                    {addon.description || "-"}
                </div>
            )
        }
    ];

    const [pagination, setPagination] = useState({
        currentPage: 1,
        pageSize: 10,
        totalItems: addons.length
    });

    useEffect(() => {
        setPagination(prev => ({ ...prev, totalItems: addons.length }));
    }, [addons]);

    const handlePageSizeChange = (size: number) => {
        setPagination(prev => ({ ...prev, pageSize: size, currentPage: 1 }));
    };

    const handlePageChange = (page: number) => {
        setPagination(prev => ({ ...prev, currentPage: page }));
    };

    const handleSort = (key: string) => {
        setSortConfig({
            key: key as keyof Addon,
            order: sortConfig.key === key && sortConfig.order === "asc" ? "desc" : "asc"
        });
    };

    // Filter and Sort
    // Filter logic removed from UI, just passing through data
    const filteredAddons = addons;

    const sortedAddons = [...filteredAddons].sort((a, b) => {
        const aValue = a[sortConfig.key] || "";
        const bValue = b[sortConfig.key] || "";

        if (typeof aValue === 'number' && typeof bValue === 'number') {
            return sortConfig.order === "asc" ? aValue - bValue : bValue - aValue;
        }

        const aString = aValue.toString().toLowerCase();
        const bString = bValue.toString().toLowerCase();

        return sortConfig.order === "asc"
            ? aString.localeCompare(bString)
            : bString.localeCompare(aString);
    });

    const paginatedAddons = sortedAddons.slice(
        (pagination.currentPage - 1) * pagination.pageSize,
        pagination.currentPage * pagination.pageSize
    );

    return (
        <div className="space-y-4 pb-10">
            {/* Filter removed as requested */}

            <CustomTable
                data={paginatedAddons}
                columns={columns}
                loading={loading}
                error={!!addonError}
                emptyMessage="Tidak ada data layanan tambahan."
                pagination={{
                    ...pagination,
                    totalItems: filteredAddons.length,
                    onPageChange: handlePageChange,
                    onPageSizeChange: handlePageSizeChange
                }}
                sorting={{
                    sortKey: sortConfig.key,
                    sortOrder: sortConfig.order,
                    onSort: handleSort
                }}
                enableSelection={true}
                selectedId={selectedAddonId}
                onSelectionChange={handleSelectionChange}
                onRowClick={handleRowClick}
                actionButtons={selectedAddonId ? (
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
                                {editingAddon ? "Edit Addon" : "Tambah Addon"}
                            </h3>
                            <CustomButton variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} className="rounded-sm h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                                <X size={18} />
                            </CustomButton>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="space-y-4">
                                <CustomInput
                                    label="Nama Layanan"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                                    placeholder="Contoh: IP STATIC"
                                />
                                <CustomCurrencyInput
                                    label="Harga (Rp)"
                                    required
                                    value={formData.price}
                                    onValueChange={(val) => setFormData({ ...formData, price: val })}
                                    placeholder="50000"
                                />
                                <CustomTextArea
                                    label="Deskripsi"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Keterangan tambahan..."
                                />
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
                                    {loading ? "Memproses..." : editingAddon ? "Simpan Perubahan" : "Tambah Addon"}
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
                title="Detail Layanan Tambahan"
                icon={Info}
                maxWidth="md"
                onConfirm={() => setIsDetailModalOpen(false)}
                confirmLabel="Tutup"
                cancelLabel=""
                items={[
                    { label: "Nama Layanan", value: selectedAddonForDetail?.name || "-" },
                    { label: "Harga", value: selectedAddonForDetail?.price ? `Rp ${Number(selectedAddonForDetail.price).toLocaleString('id-ID')}` : "-" },
                    { label: "Deskripsi", value: selectedAddonForDetail?.description || "-" },
                ]}
            />

            <ModalConfirm
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                variant="danger"
                title="Hapus Addon?"
                message={`Layanan tambahan "${addonToDelete?.name}" akan dihapus permanen.`}
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

export default AddonList;
