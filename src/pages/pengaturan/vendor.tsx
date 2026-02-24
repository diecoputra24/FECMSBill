import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useVendorStore } from "@/store/vendorStore";
import { X, Info } from "lucide-react";
import { ModalConfirm } from "@/components/ui/modal-confirm";
import { ModalMessage } from "@/components/ui/modal-message";
import { ModalDetail } from "@/components/ui/modal-detail";
import { CustomTable } from "@/components/ui/custom-table";
import { CustomButton } from "@/components/ui/custom-button";
import { CustomInput, CustomTextArea } from "@/components/ui/custom-input";
import type { Vendor } from "@/types/vendor";

const VendorList: React.FC = () => {
    const {
        vendors,
        loading,
        error,
        fetchVendors,
        updateVendor,
        deleteVendor,
    } = useVendorStore();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [messageConfig, setMessageConfig] = useState<{ type: "success" | "error", title: string, message: string }>({
        type: "success",
        title: "",
        message: ""
    });

    const [selectedVendorId, setSelectedVendorId] = useState<number | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedVendorForDetail, setSelectedVendorForDetail] = useState<Vendor | null>(null);

    const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
    const [vendorToDelete, setVendorToDelete] = useState<Vendor | null>(null);
    const [formData, setFormData] = useState({ name: "", address: "" });

    useEffect(() => {
        fetchVendors();
    }, [fetchVendors]);

    const handleOpenModal = (vendor: Vendor) => {
        setEditingVendor(vendor);
        setFormData({ name: vendor.name, address: vendor.address || "" });
        setIsModalOpen(true);
    };

    const handleOpenDeleteModal = (vendor: Vendor) => {
        setVendorToDelete(vendor);
        setIsDeleteModalOpen(true);
    };

    const handleSelectionChange = (id: string | number | null) => {
        setSelectedVendorId(id ? Number(id) : null);
    };

    const handleRowClick = (vendor: Vendor) => {
        setSelectedVendorForDetail(vendor);
        setIsDetailModalOpen(true);
    };

    const handleEditSelected = () => {
        const vendor = vendors.find(v => v.id === selectedVendorId);
        if (vendor) handleOpenModal(vendor);
    };

    const handleDeleteSelected = () => {
        const vendor = vendors.find(v => v.id === selectedVendorId);
        if (vendor) handleOpenDeleteModal(vendor);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingVendor) {
                await updateVendor(editingVendor.id, formData);
                setMessageConfig({
                    type: "success",
                    title: "Berhasil!",
                    message: "Data vendor berhasil diperbarui."
                });
            }
            setIsModalOpen(false);
            setIsMessageModalOpen(true);
            setSelectedVendorId(null);
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
        if (vendorToDelete) {
            try {
                await deleteVendor(vendorToDelete.id);
                setIsDeleteModalOpen(false);
                setVendorToDelete(null);
                setSelectedVendorId(null);
                setMessageConfig({
                    type: "success",
                    title: "Dihapus!",
                    message: "Vendor berhasil dihapus secara permanen."
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
            header: "Nama Perusahaan / Vendor",
            sortable: true,
            sortKey: "name",
            render: (vendor: Vendor) => (
                <div className="text-slate-900 font-bold uppercase">{vendor.name}</div>
            )
        },
        {
            header: "Alamat",
            sortable: true,
            sortKey: "address",
            render: (vendor: Vendor) => (
                <div className="text-slate-600">
                    <span className="truncate max-w-[200px] block">{vendor.address || "-"}</span>
                </div>
            )
        }
    ];

    const [pagination, setPagination] = useState({
        currentPage: 1,
        pageSize: 10,
        totalItems: vendors.length
    });

    useEffect(() => {
        setPagination(prev => ({ ...prev, totalItems: vendors.length }));
    }, [vendors]);

    const handlePageSizeChange = (size: number) => {
        setPagination(prev => ({ ...prev, pageSize: size, currentPage: 1 }));
    };

    const handlePageChange = (page: number) => {
        setPagination(prev => ({ ...prev, currentPage: page }));
    };

    const [sortConfig, setSortConfig] = useState<{ key: keyof Vendor, order: "asc" | "desc" }>({
        key: "name",
        order: "asc"
    });

    const handleSort = (key: string) => {
        setSortConfig({
            key: key as keyof Vendor,
            order: sortConfig.key === key && sortConfig.order === "asc" ? "desc" : "asc"
        });
    };

    const sortedVendors = [...vendors].sort((a, b) => {
        const aValue = a[sortConfig.key] || "";
        const bValue = b[sortConfig.key] || "";
        const aString = aValue.toString().toLowerCase();
        const bString = bValue.toString().toLowerCase();
        if (sortConfig.order === "asc") return aString.localeCompare(bString);
        return bString.localeCompare(aString);
    });

    const paginatedVendors = sortedVendors.slice(
        (pagination.currentPage - 1) * pagination.pageSize,
        pagination.currentPage * pagination.pageSize
    );

    return (
        <div className="space-y-4 pb-10 mt-4">
            <CustomTable
                data={paginatedVendors}
                columns={columns}
                loading={loading}
                error={!!error}
                emptyMessage="Belum ada data vendor."
                pagination={{
                    ...pagination,
                    onPageChange: handlePageChange,
                    onPageSizeChange: handlePageSizeChange
                }}
                sorting={{
                    sortKey: sortConfig.key,
                    sortOrder: sortConfig.order,
                    onSort: handleSort
                }}
                enableSelection={true}
                selectedId={selectedVendorId}
                onSelectionChange={handleSelectionChange}
                onRowClick={handleRowClick}
                actionButtons={selectedVendorId ? (
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

            {isModalOpen && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] animate-in fade-in duration-300" onClick={() => setIsModalOpen(false)} />
                    <div className="relative w-full max-w-lg bg-white rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200">
                        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-800 tracking-tight">
                                {editingVendor ? "Edit Vendor" : "Tambah Vendor"}
                            </h3>
                            <CustomButton variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} className="rounded-sm h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                                <X size={18} />
                            </CustomButton>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="space-y-4">
                                <CustomInput
                                    label="Nama Vendor / Perusahaan"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Masukkan nama vendor..."
                                />
                                <CustomTextArea
                                    label="Alamat Lengkap"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    placeholder="Masukkan alamat vendor..."
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
                                    {loading ? "Menyimpan..." : "Simpan Perubahan"}
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
                title="Detail Vendor"
                icon={Info}
                maxWidth="md"
                onConfirm={() => setIsDetailModalOpen(false)}
                confirmLabel="Tutup"
                cancelLabel=""
                items={[
                    { label: "Nama Vendor", value: selectedVendorForDetail?.name || "-" },
                    { label: "Alamat", value: selectedVendorForDetail?.address || "-" },
                    { label: "Dibuat Pada", value: selectedVendorForDetail?.createdAt ? new Date(selectedVendorForDetail.createdAt).toLocaleString('id-ID') : "-" }
                ]}
            />

            <ModalConfirm
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                variant="danger"
                title="Hapus Vendor?"
                message={`Vendor "${vendorToDelete?.name}" akan dihapus permanen.`}
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

export default VendorList;
