import React, { useEffect, useState } from "react";
import { useAreaStore } from "@/store/areaStore";
import { useBranchStore } from "@/store/branchStore";
import { CustomButton } from "@/components/ui/custom-button";
import { CustomInput } from "@/components/ui/custom-input";
import { CustomSelect } from "@/components/ui/custom-select";
import { Card, CardContent } from "@/components/ui/card";
import { Save, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ModalMessage } from "@/components/ui/modal-message";
import { ModalDetail } from "@/components/ui/modal-detail";

const AreaCreatePage: React.FC = () => {
    const navigate = useNavigate();
    const { addArea, loading, createFormData, setCreateFormData, resetCreateFormData } = useAreaStore();
    const { branches, fetchBranches } = useBranchStore();

    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [messageConfig, setMessageConfig] = useState<{ type: "success" | "error", title: string, message: string }>({
        type: "success",
        title: "",
        message: ""
    });

    useEffect(() => {
        fetchBranches();
    }, [fetchBranches]);

    const handleOpenPreview = (e: React.FormEvent) => {
        e.preventDefault();
        setIsPreviewModalOpen(true);
    };

    const handleConfirmSave = async () => {
        setIsPreviewModalOpen(false);
        try {
            await addArea({
                namaArea: createFormData.namaArea,
                kodeArea: createFormData.kodeArea,
                branchId: parseInt(createFormData.branchId)
            });
            setMessageConfig({
                type: "success",
                title: "Berhasil!",
                message: "Area baru berhasil ditambahkan."
            });
            setIsMessageModalOpen(true);
        } catch (error) {
            setMessageConfig({
                type: "error",
                title: "Gagal!",
                message: "Terjadi kesalahan saat menyimpan data."
            });
            setIsMessageModalOpen(true);
        }
    };

    const handleCloseMessage = () => {
        setIsMessageModalOpen(false);
        if (messageConfig.type === "success") {
            resetCreateFormData();
            navigate("/pengaturan/area");
        }
    };

    const selectedBranch = branches.find(b => b.id.toString() === createFormData.branchId);

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-10">
            <Card className="border border-slate-200 shadow-sm rounded-xl overflow-hidden mt-4">
                <CardContent className="p-8">
                    <form onSubmit={handleOpenPreview} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <CustomSelect
                                    label="Pilih Cabang"
                                    required
                                    value={createFormData.branchId}
                                    onChange={(val) => setCreateFormData({ branchId: val })}
                                    options={branches.map(b => ({ label: b.namaBranch, value: b.id.toString() }))}
                                    placeholder="Pilih cabang untuk area ini..."
                                />
                            </div>
                            <CustomInput
                                label="Nama Area"
                                required
                                value={createFormData.namaArea}
                                onChange={(e) => setCreateFormData({ namaArea: e.target.value.toUpperCase() })}
                                placeholder="Contoh: BAYUNING"
                            />
                            <CustomInput
                                label="Kode Area"
                                required
                                value={createFormData.kodeArea}
                                onChange={(e) => setCreateFormData({ kodeArea: e.target.value.toUpperCase() })}
                                placeholder="Contoh: BYG"
                            />
                        </div>

                        <div className="pt-6 flex justify-end gap-3 border-t border-slate-100 mt-2">
                            <CustomButton
                                type="submit"
                                variant="primary"
                                disabled={loading || !createFormData.branchId}
                                className="px-8"
                            >
                                <Save size={18} />
                                Simpan Area
                            </CustomButton>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <ModalDetail
                isOpen={isPreviewModalOpen}
                onClose={() => setIsPreviewModalOpen(false)}
                title="Konfirmasi Data Area"
                icon={CheckCircle2}
                variant="warning"
                confirmLabel="Ya, Simpan Sekarang"
                cancelLabel="Cek Lagi"
                loading={loading}
                onConfirm={handleConfirmSave}
                items={[
                    { label: "Cabang", value: selectedBranch?.namaBranch || "-" },
                    { label: "Nama Area", value: createFormData.namaArea },
                    { label: "Kode Area", value: createFormData.kodeArea }
                ]}
            />

            <ModalMessage
                isOpen={isMessageModalOpen}
                onClose={handleCloseMessage}
                type={messageConfig.type}
                title={messageConfig.title}
                message={messageConfig.message}
            />
        </div>
    );
};

export default AreaCreatePage;
