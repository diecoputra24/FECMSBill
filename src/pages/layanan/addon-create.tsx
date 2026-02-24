import React, { useState } from "react";
import { useAddonStore } from "@/store/addonStore";
import { CustomButton } from "@/components/ui/custom-button";
import { CustomInput, CustomTextArea, CustomCurrencyInput } from "@/components/ui/custom-input";
import { Card, CardContent } from "@/components/ui/card";
import { Save, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ModalMessage } from "@/components/ui/modal-message";
import { ModalDetail } from "@/components/ui/modal-detail";

const AddonCreatePage: React.FC = () => {
    const navigate = useNavigate();
    const { addAddon, loading, createFormData, setCreateFormData, resetCreateFormData } = useAddonStore();

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
            await addAddon({
                name: createFormData.name,
                price: createFormData.price,
                description: createFormData.description
            });
            setMessageConfig({
                type: "success",
                title: "Berhasil!",
                message: "Addon baru berhasil ditambahkan."
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
            navigate("/layanan/addon");
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-10">
            <Card className="border border-slate-200 shadow-sm rounded-xl overflow-hidden mt-4">
                <CardContent className="p-8">
                    <form onSubmit={handleOpenPreview} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <CustomInput
                                label="Nama Layanan Tambahan"
                                required
                                value={createFormData.name}
                                onChange={(e) => setCreateFormData({ name: e.target.value.toUpperCase() })}
                                placeholder="Contoh: IP STATIC PUBLIC"
                            />
                            <CustomCurrencyInput
                                label="Harga Bulanan (Rp)"
                                required
                                value={createFormData.price}
                                onValueChange={(val) => setCreateFormData({ price: val })}
                                placeholder="50000"
                            />
                            <div className="md:col-span-2">
                                <CustomTextArea
                                    label="Deskripsi"
                                    value={createFormData.description}
                                    onChange={(e) => setCreateFormData({ description: e.target.value })}
                                    placeholder="Keterangan detail layanan..."
                                />
                            </div>
                        </div>

                        <div className="pt-6 flex justify-end gap-3 border-t border-slate-100 mt-2">
                            <CustomButton
                                type="submit"
                                variant="primary"
                                disabled={loading || !createFormData.name || !createFormData.price}
                                className="px-8"
                            >
                                <Save size={18} />
                                Simpan Addon
                            </CustomButton>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <ModalDetail
                isOpen={isPreviewModalOpen}
                onClose={() => setIsPreviewModalOpen(false)}
                title="Konfirmasi Data Addon"
                icon={CheckCircle2}
                variant="warning"
                confirmLabel="Ya, Simpan Sekarang"
                cancelLabel="Cek Lagi"
                loading={loading}
                onConfirm={handleConfirmSave}
                items={[
                    { label: "Nama Layanan", value: createFormData.name },
                    { label: "Harga", value: `Rp ${Number(createFormData.price).toLocaleString('id-ID')}` },
                    { label: "Deskripsi", value: createFormData.description || "-" }
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

export default AddonCreatePage;
