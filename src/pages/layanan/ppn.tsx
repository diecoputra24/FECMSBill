import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTaxStore } from "@/store/taxStore";
import { X, Info, Percent, CheckCircle2, AlertCircle } from "lucide-react";
import { ModalConfirm } from "@/components/ui/modal-confirm";
import { ModalMessage } from "@/components/ui/modal-message";
import { ModalDetail } from "@/components/ui/modal-detail";
import { CustomTable } from "@/components/ui/custom-table";
import { CustomButton } from "@/components/ui/custom-button";
import { CustomInput, CustomSwitch } from "@/components/ui/custom-input";
import type { Tax } from "@/types/tax";
import { Badge } from "@/components/ui/badge";

const TaxPage: React.FC = () => {
    const {
        taxes,
        loading,
        error: taxError,
        fetchTaxes,
        addTax,
        updateTax,
        deleteTax,
    } = useTaxStore();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [messageConfig, setMessageConfig] = useState<{ type: "success" | "error", title: string, message: string }>({
        type: "success",
        title: "",
        message: ""
    });

    const [editingTax, setEditingTax] = useState<Tax | null>(null);
    const [taxToDelete, setTaxToDelete] = useState<Tax | null>(null);

    // Selection & Detail states
    const [selectedTaxId, setSelectedTaxId] = useState<number | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedTaxForDetail, setSelectedTaxForDetail] = useState<Tax | null>(null);

    const [formData, setFormData] = useState({
        name: "",
        value: "",
        isActive: true
    });

    // Initial fetch
    useEffect(() => {
        fetchTaxes();
    }, [fetchTaxes]);

    const handleOpenModal = (tax?: Tax) => {
        if (tax) {
            setEditingTax(tax);
            setFormData({
                name: tax.name,
                value: tax.value.toString(),
                isActive: tax.isActive
            });
        } else {
            setEditingTax(null);
            setFormData({
                name: "",
                value: "",
                isActive: true
            });
        }
        setIsModalOpen(true);
    };

    const handleOpenDeleteModal = (tax: Tax) => {
        setTaxToDelete(tax);
        setIsDeleteModalOpen(true);
    };

    const handleSelectionChange = (id: string | number | null) => {
        setSelectedTaxId(id ? Number(id) : null);
    };

    const handleRowClick = (tax: Tax) => {
        setSelectedTaxForDetail(tax);
        setIsDetailModalOpen(true);
    };

    const handleEditSelected = () => {
        const tax = taxes.find(t => t.id === selectedTaxId);
        if (tax) handleOpenModal(tax);
    };

    const handleDeleteSelected = () => {
        const tax = taxes.find(t => t.id === selectedTaxId);
        if (tax) handleOpenDeleteModal(tax);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingTax) {
                await updateTax(editingTax.id, formData);
                setMessageConfig({
                    type: "success",
                    title: "Berhasil!",
                    message: "Data PPN berhasil diperbarui."
                });
            } else {
                await addTax(formData);
                setMessageConfig({
                    type: "success",
                    title: "Berhasil!",
                    message: "Aturan PPN baru berhasil ditambahkan."
                });
            }
            setIsModalOpen(false);
            setIsMessageModalOpen(true);
            setSelectedTaxId(null);
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
        if (taxToDelete) {
            try {
                await deleteTax(taxToDelete.id);
                setIsDeleteModalOpen(false);
                setTaxToDelete(null);
                setSelectedTaxId(null);
                setMessageConfig({
                    type: "success",
                    title: "Dihapus!",
                    message: "Aturan PPN berhasil dihapus."
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
            header: "Nama Pajak",
            render: (tax: Tax) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                        <Percent size={16} />
                    </div>
                    <div className="font-bold text-slate-800 uppercase tracking-tight">
                        {tax.name}
                    </div>
                </div>
            )
        },
        {
            header: "Nilai Persentase",
            render: (tax: Tax) => (
                <div className="font-mono font-bold text-slate-600 text-[14px]">
                    {tax.value}%
                </div>
            )
        },
        {
            header: "Status",
            render: (tax: Tax) => (
                tax.isActive ? (
                    <Badge variant="success" className="px-2 py-0.5 rounded text-[10px] font-bold border border-green-100 flex items-center gap-1 w-fit">
                        <CheckCircle2 size={12} /> AKTIF
                    </Badge>
                ) : (
                    <Badge variant="secondary" className="px-2 py-0.5 rounded text-[10px] font-bold border border-slate-200 flex items-center gap-1 w-fit">
                        <AlertCircle size={12} /> NON-AKTIF
                    </Badge>
                )
            )
        }
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <div />
            </div>

            <CustomTable
                data={taxes}
                columns={columns}
                loading={loading}
                error={!!taxError}
                emptyMessage="Tidak ada data aturan PPN."
                enableSelection={true}
                selectedId={selectedTaxId}
                onSelectionChange={handleSelectionChange}
                onRowClick={handleRowClick}
                actionButtons={selectedTaxId ? (
                    <div className="flex items-center gap-2">
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
                    </div>
                ) : null}
            />

            {/* Form Modal */}
            {isModalOpen && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] animate-in fade-in duration-300" onClick={() => setIsModalOpen(false)} />
                    <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200">
                        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-800 tracking-tight">
                                {editingTax ? "Edit Aturan PPN" : "Buat Aturan PPN"}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="rounded-full h-8 w-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <CustomInput
                                label="Nama Aturan"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                                placeholder="Contoh: PPN 11%"
                            />

                            <CustomInput
                                label="Persentase (%)"
                                type="number"
                                required
                                value={formData.value}
                                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                placeholder="11"
                            />

                            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-slate-700">Status Aktif</span>
                                    <span className="text-xs text-slate-500 tracking-tight">Aturan ini dapat dipilih oleh pelanggan</span>
                                </div>
                                <CustomSwitch
                                    checked={formData.isActive}
                                    onChange={(checked) => setFormData({ ...formData, isActive: checked })}
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-2">
                                <CustomButton
                                    type="button"
                                    variant="ghost"
                                    className="h-9 px-4 font-semibold text-xs text-slate-500"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    Batal
                                </CustomButton>
                                <CustomButton
                                    type="submit"
                                    variant="primary"
                                    className="h-9 px-6 font-bold text-xs shadow-md"
                                    disabled={loading}
                                >
                                    {loading ? "Memproses..." : editingTax ? "Simpan" : "Simpan"}
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
                title="Detail Aturan PPN"
                icon={Info}
                maxWidth="sm"
                onConfirm={() => setIsDetailModalOpen(false)}
                confirmLabel="Tutup"
                cancelLabel=""
                items={[
                    { label: "Nama Aturan", value: selectedTaxForDetail?.name || "-" },
                    { label: "Persentase", value: selectedTaxForDetail?.value ? `${selectedTaxForDetail.value}%` : "-" },
                    { label: "Status", value: selectedTaxForDetail?.isActive ? "AKTIF" : "NON-AKTIF" },
                    { label: "Dibuat Pada", value: selectedTaxForDetail?.createdAt ? new Date(selectedTaxForDetail.createdAt).toLocaleString('id-ID') : "-" },
                ]}
            />

            <ModalConfirm
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                variant="danger"
                title="Hapus Aturan PPN?"
                message={`Aturan "${taxToDelete?.name}" akan dihapus. Perubahan ini mungkin berdampak pada pelanggan yang menggunakan aturan ini.`}
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

export default TaxPage;
