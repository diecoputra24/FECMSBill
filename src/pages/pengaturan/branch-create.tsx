import React, { useState } from "react";
import { useBranchStore } from "@/store/branchStore";
import { CustomButton } from "@/components/ui/custom-button";
import { CustomInput, CustomTextArea } from "@/components/ui/custom-input";
import { Card, CardContent } from "@/components/ui/card";
import { Save, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ModalMessage } from "@/components/ui/modal-message";
import { ModalDetail } from "@/components/ui/modal-detail";

const BranchCreatePage: React.FC = () => {
    const navigate = useNavigate();
    const { addBranch, loading, createFormData, setCreateFormData, resetCreateFormData } = useBranchStore();
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [messageConfig, setMessageConfig] = useState<{ type: "success" | "error", title: string, message: string }>({
        type: "success",
        title: "",
        message: ""
    });

    const handleOpenPreview = (e: React.FormEvent) => {
        e.preventDefault();
        setIsPreviewModalOpen(true);
    };

    const handleConfirmSave = async () => {
        setIsPreviewModalOpen(false);
        try {
            await addBranch(createFormData);
            setMessageConfig({
                type: "success",
                title: "Berhasil!",
                message: "Cabang baru berhasil ditambahkan."
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
            navigate("/pengaturan/branch");
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-10">
            <Card className="border border-slate-200 shadow-sm rounded-xl overflow-hidden mt-4">
                <CardContent className="p-8">
                    <form onSubmit={handleOpenPreview} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <CustomInput
                                label="Nama Cabang"
                                required
                                value={createFormData.namaBranch}
                                onChange={(e) => setCreateFormData({ namaBranch: e.target.value })}
                                placeholder="Contoh: Cabang Jakarta Barat"
                            />
                            <div className="md:col-span-2">
                                <CustomTextArea
                                    label="Alamat Lengkap"
                                    required
                                    value={createFormData.alamatBranch}
                                    onChange={(e) => setCreateFormData({ alamatBranch: e.target.value })}
                                    placeholder="Masukkan alamat lengkap cabang..."
                                />
                            </div>
                        </div>

                        <div className="pt-6 flex justify-end gap-3 border-t border-slate-100 mt-2">
                            <CustomButton
                                type="submit"
                                variant="primary"
                                disabled={loading}
                                className="px-8"
                            >
                                <Save size={18} />
                                Simpan Cabang
                            </CustomButton>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <ModalDetail
                isOpen={isPreviewModalOpen}
                onClose={() => setIsPreviewModalOpen(false)}
                title="Konfirmasi Data"
                icon={CheckCircle2}
                variant="warning"
                confirmLabel="Ya, Simpan Sekarang"
                cancelLabel="Cek Lagi"
                loading={loading}
                onConfirm={handleConfirmSave}
                items={[
                    { label: "Nama Cabang", value: createFormData.namaBranch },
                    { label: "Alamat Lengkap", value: createFormData.alamatBranch }
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

export default BranchCreatePage;
