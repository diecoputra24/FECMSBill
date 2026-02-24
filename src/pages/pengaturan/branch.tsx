import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useBranchStore } from "@/store/branchStore";
import { X, Info } from "lucide-react";
import { ModalConfirm } from "@/components/ui/modal-confirm";
import { ModalMessage } from "@/components/ui/modal-message";
import { ModalDetail } from "@/components/ui/modal-detail";
import { CustomTable } from "@/components/ui/custom-table";
import { CustomButton } from "@/components/ui/custom-button";
import { CustomInput, CustomTextArea } from "@/components/ui/custom-input";
import type { Branch } from "@/types/branch";

const BranchList: React.FC = () => {
    const {
        branches,
        loading,
        error: branchError,
        fetchBranches,
        updateBranch,
        deleteBranch,
        sortConfig,
        setSortConfig
    } = useBranchStore();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [messageConfig, setMessageConfig] = useState<{ type: "success" | "error", title: string, message: string }>({
        type: "success",
        title: "",
        message: ""
    });

    // Selection & Detail states
    const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedBranchForDetail, setSelectedBranchForDetail] = useState<Branch | null>(null);

    const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
    const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null);
    const [formData, setFormData] = useState({ namaBranch: "", alamatBranch: "" });

    // Fetch branches automatically on mount
    useEffect(() => {
        fetchBranches();
    }, [fetchBranches]);

    const handleOpenModal = (branch: Branch) => {
        setEditingBranch(branch);
        setFormData({ namaBranch: branch.namaBranch, alamatBranch: branch.alamatBranch });
        setIsModalOpen(true);
    };

    const handleOpenDeleteModal = (branch: Branch) => {
        setBranchToDelete(branch);
        setIsDeleteModalOpen(true);
    };

    const handleSelectionChange = (id: string | number | null) => {
        setSelectedBranchId(id ? Number(id) : null);
    };

    const handleRowClick = (branch: Branch) => {
        setSelectedBranchForDetail(branch);
        setIsDetailModalOpen(true);
    };

    const handleEditSelected = () => {
        const branch = branches.find(b => b.id === selectedBranchId);
        if (branch) handleOpenModal(branch);
    };

    const handleDeleteSelected = () => {
        const branch = branches.find(b => b.id === selectedBranchId);
        if (branch) handleOpenDeleteModal(branch);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingBranch) {
                await updateBranch(editingBranch.id, formData);
                setMessageConfig({
                    type: "success",
                    title: "Berhasil!",
                    message: "Data cabang berhasil diperbarui."
                });
            }
            setIsModalOpen(false);
            setIsMessageModalOpen(true);
            setSelectedBranchId(null);
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
        if (branchToDelete) {
            try {
                await deleteBranch(branchToDelete.id);
                setIsDeleteModalOpen(false);
                setBranchToDelete(null);
                setSelectedBranchId(null);
                setMessageConfig({
                    type: "success",
                    title: "Dihapus!",
                    message: "Cabang berhasil dihapus secara permanen."
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
            header: "Informasi Cabang",
            sortable: true,
            sortKey: "namaBranch",
            render: (branch: Branch) => (
                <div className="text-slate-900">{branch.namaBranch}</div>
            )
        },
        {
            header: "Alamat",
            sortable: true,
            sortKey: "alamatBranch",
            render: (branch: Branch) => (
                <div className="text-slate-600">
                    <span className="truncate max-w-[200px] block">{branch.alamatBranch}</span>
                </div>
            )
        }
    ];

    const [pagination, setPagination] = useState({
        currentPage: 1,
        pageSize: 10,
        totalItems: branches.length
    });

    // Update total items when branches change
    useEffect(() => {
        setPagination(prev => ({ ...prev, totalItems: branches.length }));
    }, [branches]);

    const handlePageSizeChange = (size: number) => {
        setPagination(prev => ({ ...prev, pageSize: size, currentPage: 1 }));
    };

    const handlePageChange = (page: number) => {
        setPagination(prev => ({ ...prev, currentPage: page }));
    };

    const handleSort = (key: string) => {
        setSortConfig({
            key: key as keyof Branch,
            order: sortConfig.key === key && sortConfig.order === "asc" ? "desc" : "asc"
        });
    };

    // Calculate sorted and paginated data
    const sortedBranches = [...branches].sort((a, b) => {
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

    const paginatedBranches = sortedBranches.slice(
        (pagination.currentPage - 1) * pagination.pageSize,
        pagination.currentPage * pagination.pageSize
    );

    return (
        <div className="space-y-4 pb-10">
            <CustomTable
                data={paginatedBranches}
                columns={columns}
                loading={loading}
                error={!!branchError}
                emptyMessage="Belum ada data cabang."
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
                selectedId={selectedBranchId}
                onSelectionChange={handleSelectionChange}
                onRowClick={handleRowClick}
                actionButtons={selectedBranchId ? (
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

            {/* Form Modal */}
            {isModalOpen && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] animate-in fade-in duration-300" onClick={() => setIsModalOpen(false)} />
                    <div className="relative w-full max-w-lg bg-white rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200">
                        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-800 tracking-tight">
                                {editingBranch ? "Edit Cabang" : "Tambah Cabang"}
                            </h3>
                            <CustomButton variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} className="rounded-sm h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                                <X size={18} />
                            </CustomButton>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="space-y-4">
                                <CustomInput
                                    label="Nama Cabang"
                                    required
                                    value={formData.namaBranch}
                                    onChange={(e) => setFormData({ ...formData, namaBranch: e.target.value })}
                                    placeholder="Masukkan nama cabang..."
                                />
                                <CustomTextArea
                                    label="Alamat Lengkap"
                                    required
                                    value={formData.alamatBranch}
                                    onChange={(e) => setFormData({ ...formData, alamatBranch: e.target.value })}
                                    placeholder="Masukkan alamat cabang..."
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
                title="Detail Cabang"
                icon={Info}
                maxWidth="md"
                onConfirm={() => setIsDetailModalOpen(false)}
                confirmLabel="Tutup"
                cancelLabel=""
                items={[
                    { label: "Nama Cabang", value: selectedBranchForDetail?.namaBranch || "-" },
                    { label: "Alamat Cabang", value: selectedBranchForDetail?.alamatBranch || "-" }
                ]}
            />

            <ModalConfirm
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                variant="danger"
                title="Hapus Cabang?"
                message={`Cabang "${branchToDelete?.namaBranch}" akan dihapus permanen.`}
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

export default BranchList;
