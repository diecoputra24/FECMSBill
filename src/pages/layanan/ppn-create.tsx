import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTaxStore } from "@/store/taxStore";
import { Percent, Save, X, CheckCircle2 } from "lucide-react";
import { CustomInput, CustomSwitch } from "@/components/ui/custom-input";
import { CustomButton } from "@/components/ui/custom-button";
import { Card, CardContent } from "@/components/ui/card";
import { ModalMessage } from "@/components/ui/modal-message";
import { ModalDetail } from "@/components/ui/modal-detail";

const PPNCreatePage: React.FC = () => {
    const navigate = useNavigate();
    const { addTax, loading } = useTaxStore();

    const [formData, setFormData] = useState({
        name: "",
        value: "",
        isActive: true
    });

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
            await addTax(formData);
            setMessageConfig({
                type: "success",
                title: "Berhasil!",
                message: "Aturan PPN baru berhasil ditambahkan."
            });
            setIsMessageModalOpen(true);
        } catch (error: any) {
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
            navigate("/layanan/ppn");
        }
    };

    return (
        <div className="w-full space-y-6 pb-10">
            <Card className="border border-slate-200 shadow-sm rounded-xl overflow-hidden mt-4">
                <CardContent className="p-6">
                    <form onSubmit={handleOpenPreview} className="space-y-8">
                        {/* Section 1: Data PPN */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-2">
                                Detail Aturan Pajak
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <CustomInput
                                    label="Nama Aturan PPN"
                                    placeholder="Contoh: PPN 11%"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                                />

                                <CustomInput
                                    label="Persentase (%)"
                                    type="number"
                                    placeholder="11"
                                    required
                                    value={formData.value}
                                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                />

                                <div className="md:col-span-2">
                                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200 shadow-sm max-w-md">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-700">Status Aktif</span>
                                            <span className="text-[10px] text-slate-500 tracking-tight uppercase font-semibold">Aktifkan aturan ini untuk digunakan</span>
                                        </div>
                                        <CustomSwitch
                                            checked={formData.isActive}
                                            onChange={(checked) => setFormData({ ...formData, isActive: checked })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 flex justify-end gap-3 border-t border-slate-100">
                            <CustomButton
                                type="submit"
                                variant="primary"
                                disabled={loading || !formData.name || !formData.value}
                                className="px-8"
                            >
                                <Save size={18} />
                                Simpan PPN
                            </CustomButton>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <ModalDetail
                isOpen={isPreviewModalOpen}
                onClose={() => setIsPreviewModalOpen(false)}
                title="Konfirmasi Aturan PPN"
                variant="primary"
                confirmLabel="Ya, Simpan Sekarang"
                cancelLabel="Cek Lagi"
                loading={loading}
                onConfirm={handleConfirmSave}
                maxWidth="md"
            >
                <div className="space-y-4">
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Nama Aturan</span>
                        <div className="text-sm font-bold text-slate-800 uppercase">{formData.name}</div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Persentase</span>
                        <div className="text-sm font-bold text-slate-800">{formData.value}%</div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Status Kontrol</span>
                        <div className="text-sm font-bold text-slate-800">{formData.isActive ? "AKTIF" : "NON-AKTIF"}</div>
                    </div>
                </div>
            </ModalDetail>

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

export default PPNCreatePage;
