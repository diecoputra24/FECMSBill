import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePackageStore } from "@/store/packageStore";
import { CustomButton } from "@/components/ui/custom-button";
import { CustomInput, CustomTextArea, CustomCurrencyInput } from "@/components/ui/custom-input";
import { CustomSelect } from "@/components/ui/custom-select";
import { Card, CardContent } from "@/components/ui/card";
import { ModalMessage } from "@/components/ui/modal-message";
import { ModalDetail } from "@/components/ui/modal-detail";
import { Save, CheckCircle2 } from "lucide-react";
import api from "@/lib/api";

const PackageCreatePage: React.FC = () => {
    const navigate = useNavigate();
    const { addPackage, loading, createFormData, setCreateFormData, resetCreateFormData } = usePackageStore();
    const [routers, setRouters] = useState<any[]>([]);
    const [profiles, setProfiles] = useState<any[]>([]);

    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [messageConfig, setMessageConfig] = useState<{ type: "success" | "error", title: string, message: string }>({
        type: "success",
        title: "",
        message: ""
    });

    useEffect(() => {
        fetchRouters();
        // Restore profiles if router already selected
        if (createFormData.routerId) {
            fetchProfiles(parseInt(createFormData.routerId));
        }
    }, [createFormData.routerId]);

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

    const handleRouterChange = (routerId: string) => {
        setCreateFormData({ routerId, mikrotikProfile: "" });
        if (routerId) {
            fetchProfiles(parseInt(routerId));
        } else {
            setProfiles([]);
        }
    };

    const handleOpenPreview = (e: React.FormEvent) => {
        e.preventDefault();
        setIsPreviewModalOpen(true);
    };

    const handleConfirmSave = async () => {
        setIsPreviewModalOpen(false);
        try {
            await addPackage({
                routerId: parseInt(createFormData.routerId),
                namaPaket: createFormData.namaPaket,
                hargaPaket: parseFloat(createFormData.hargaPaket),
                mikrotikProfile: createFormData.mikrotikProfile,
                deskripsi: createFormData.deskripsi,
                displayPaket: createFormData.displayPaket
            });
            setMessageConfig({
                type: "success",
                title: "Berhasil!",
                message: "Layanan internet baru berhasil dibuat."
            });
            setIsMessageModalOpen(true);
        } catch (error) {
            setMessageConfig({
                type: "error",
                title: "Gagal!",
                message: "Terjadi kesalahan saat membuat layanan."
            });
            setIsMessageModalOpen(true);
        }
    };

    const handleCloseMessage = () => {
        setIsMessageModalOpen(false);
        if (messageConfig.type === "success") {
            resetCreateFormData(); // Clear form only on success
            navigate("/layanan");
        }
    };

    const selectedRouter = routers.find(r => r.id.toString() === createFormData.routerId);

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-10">
            <Card className="border border-slate-200 shadow-sm rounded-xl overflow-hidden mt-4">
                <CardContent className="p-8">
                    <form onSubmit={handleOpenPreview} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <CustomSelect
                                    label="Pilih Router"
                                    required
                                    value={createFormData.routerId}
                                    onChange={handleRouterChange}
                                    options={routers.map(r => ({ label: `${r.namaRouter} (${r.hostAddress})`, value: r.id.toString() }))}
                                    placeholder="Pilih router..."
                                />
                            </div>

                            <div className="md:col-span-2">
                                <CustomSelect
                                    label="Profil MikroTik"
                                    required
                                    value={createFormData.mikrotikProfile}
                                    onChange={(val) => setCreateFormData({ mikrotikProfile: val })}
                                    options={profiles.map(p => ({ label: `${p.name} ${p.rateLimit ? `(${p.rateLimit})` : ''}`, value: p.name }))}
                                    placeholder={createFormData.routerId ? "Pilih profil..." : "Pilih router terlebih dahulu"}
                                    disabled={!createFormData.routerId}
                                />
                            </div>

                            <CustomInput
                                label="Nama Layanan"
                                required
                                value={createFormData.namaPaket}
                                onChange={(e) => setCreateFormData({ namaPaket: e.target.value.toUpperCase() })}
                                placeholder="Contoh: PAKET HOME 10MB"
                            />
                            <CustomCurrencyInput
                                label="Harga Bulanan (Rp)"
                                required
                                value={createFormData.hargaPaket}
                                onValueChange={(val) => setCreateFormData({ hargaPaket: val })}
                                placeholder="150000"
                            />

                            <div className="md:col-span-2">
                                <CustomTextArea
                                    label="Keterangan"
                                    value={createFormData.deskripsi}
                                    onChange={(e) => setCreateFormData({ deskripsi: e.target.value })}
                                    placeholder="Deskripsi singkat layanan ini..."
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-100 transition-all group">
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 rounded border-slate-300 text-primary accent-primary focus:ring-primary"
                                        checked={createFormData.displayPaket}
                                        onChange={(e) => setCreateFormData({ displayPaket: e.target.checked })}
                                    />
                                    <div className="flex-1">
                                        <div className="text-sm font-bold text-slate-700">Tampilkan ke Publik</div>
                                        <div className="text-[11px] text-slate-500 font-medium">Layanan ini akan langsung muncul di dashboard registrasi jika aktif.</div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div className="pt-6 flex justify-end gap-3 border-t border-slate-100 mt-2">
                            <CustomButton
                                type="submit"
                                variant="primary"
                                disabled={loading || !createFormData.routerId || !createFormData.mikrotikProfile}
                                className="px-8"
                            >
                                <Save size={18} />
                                Simpan Paket
                            </CustomButton>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <ModalDetail
                isOpen={isPreviewModalOpen}
                onClose={() => setIsPreviewModalOpen(false)}
                title="Konfirmasi Data Paket"
                icon={CheckCircle2}
                variant="warning"
                confirmLabel="Ya, Simpan Sekarang"
                cancelLabel="Cek Lagi"
                loading={loading}
                onConfirm={handleConfirmSave}
                items={[
                    { label: "Router", value: selectedRouter?.namaRouter || "-" },
                    { label: "Profil MikroTik", value: createFormData.mikrotikProfile },
                    { label: "Nama Layanan", value: createFormData.namaPaket },
                    { label: "Harga", value: `Rp ${Number(createFormData.hargaPaket).toLocaleString('id-ID')}` },
                    { label: "Status", value: createFormData.displayPaket ? "Ditampilkan" : "Disembunyikan" }
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

export default PackageCreatePage;
