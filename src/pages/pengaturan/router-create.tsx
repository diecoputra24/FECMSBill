import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useRouterStore } from "@/store/routerStore";
import { CustomButton } from "@/components/ui/custom-button";
import { CustomInput } from "@/components/ui/custom-input";
import { CustomSelect } from "@/components/ui/custom-select";
import { ModalMessage } from "@/components/ui/modal-message";
import { ModalDetail } from "@/components/ui/modal-detail";
import { Card, CardContent } from "@/components/ui/card";
import { Save, CheckCircle2 } from "lucide-react";

const RouterCreatePage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;

    const {
        addRouter,
        updateRouter,
        routers,
        fetchRouters,
        loading,
        createFormData,
        setCreateFormData,
        resetCreateFormData
    } = useRouterStore();

    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [messageConfig, setMessageConfig] = useState<{ type: "success" | "error", title: string, message: string }>({
        type: "success",
        title: "",
        message: ""
    });

    // Local state for Edit Mode
    const [editFormData, setEditFormData] = useState({
        namaRouter: "",
        hostAddress: "",
        apiPort: "8728",
        username: "",
        password: "",
        isActive: true,
        isolir: false
    });

    // Unified Accessor
    const formData = isEditMode ? editFormData : createFormData;

    // Unified Setter
    const setFormData = (data: Partial<typeof editFormData>) => {
        if (isEditMode) {
            setEditFormData(prev => ({ ...prev, ...data }));
        } else {
            setCreateFormData(data);
        }
    };

    // Load data if edit mode
    useEffect(() => {
        if (isEditMode) {
            // Ensure routers are loaded
            if (routers.length === 0) {
                fetchRouters();
            } else {
                const routerToEdit = routers.find(r => r.id === parseInt(id));
                if (routerToEdit) {
                    setEditFormData({
                        namaRouter: routerToEdit.namaRouter,
                        hostAddress: routerToEdit.hostAddress,
                        apiPort: routerToEdit.apiPort.toString(),
                        username: routerToEdit.username,
                        password: "", // Don't pre-fill password for security
                        isActive: routerToEdit.isActive,
                        isolir: routerToEdit.isolir
                    });
                }
            }
        }
    }, [id, isEditMode, routers, fetchRouters]);

    // Handle initial load if direct link to edit (redundant but safe)
    useEffect(() => {
        if (isEditMode && routers.length > 0) {
            const routerToEdit = routers.find(r => r.id === parseInt(id));
            if (routerToEdit) {
                setEditFormData({
                    namaRouter: routerToEdit.namaRouter,
                    hostAddress: routerToEdit.hostAddress,
                    apiPort: routerToEdit.apiPort.toString(),
                    username: routerToEdit.username,
                    password: "", // Don't pre-fill password
                    isActive: routerToEdit.isActive,
                    isolir: routerToEdit.isolir
                });
            }
        }
    }, [routers, id, isEditMode]);


    const handleOpenPreview = (e: React.FormEvent) => {
        e.preventDefault();
        setIsPreviewModalOpen(true);
    };

    const handleConfirmSave = async () => {
        setIsPreviewModalOpen(false);
        try {
            const payload = {
                namaRouter: formData.namaRouter,
                hostAddress: formData.hostAddress,
                apiPort: parseInt(formData.apiPort),
                username: formData.username,
                isActive: formData.isActive,
                isolir: formData.isolir,
                // Only include password if it's provided (for edit) or if it's create
                ...(formData.password ? { password: formData.password } : {})
            };

            if (isEditMode) {
                // ... (Update Logic remains same)
                const routerToEdit = routers.find(r => r.id === parseInt(id));
                if (routerToEdit) {
                    await updateRouter(routerToEdit.uuid, payload);
                } else {
                    const targetRouter = routers.find(r => r.id === parseInt(id));
                    if (targetRouter) {
                        await updateRouter(targetRouter.uuid, payload);
                    }
                }

                setMessageConfig({
                    type: "success",
                    title: "Berhasil!",
                    message: "Data router berhasil diperbarui."
                });
            } else {
                if (!formData.password) {
                    setMessageConfig({
                        type: "error",
                        title: "Validasi Gagal",
                        message: "Password wajib diisi untuk router baru."
                    });
                    setIsMessageModalOpen(true);
                    return;
                }
                await addRouter(payload as any);
                setMessageConfig({
                    type: "success",
                    title: "Berhasil!",
                    message: "Router baru berhasil ditambahkan."
                });
            }

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

    const handleModalClose = () => {
        setIsMessageModalOpen(false);
        if (messageConfig.type === "success") {
            if (!isEditMode) {
                resetCreateFormData(); // Clear persistence only on success
            }
            navigate("/pengaturan/router");
        }
    };

    const StatusOptions = [
        { label: "Active", value: "true" },
        { label: "Inactive", value: "false" }
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-10">
            <Card className="border border-slate-200 shadow-sm rounded-xl overflow-hidden mt-4">
                <CardContent className="p-8">
                    <form onSubmit={handleOpenPreview} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* General Info */}
                            <div className="space-y-6">
                                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-2">
                                    Informasi Umum
                                </h3>

                                <CustomInput
                                    label="Nama Router"
                                    required
                                    value={formData.namaRouter}
                                    onChange={(e) => setFormData({ namaRouter: e.target.value })}
                                    placeholder="Contoh: Router Utama"
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <CustomSelect
                                        label="Status"
                                        required
                                        value={formData.isActive.toString()}
                                        onChange={(val) => setFormData({ isActive: val === "true" })}
                                        options={StatusOptions}
                                        placeholder="Pilih Status"
                                    />
                                    <CustomSelect
                                        label="Isolir"
                                        required
                                        value={formData.isolir.toString()}
                                        onChange={(val) => setFormData({ isolir: val === "true" })}
                                        options={[
                                            { label: "Ya", value: "true" },
                                            { label: "Tidak", value: "false" }
                                        ]}
                                        placeholder="Pilih Isolir"
                                    />
                                </div>
                            </div>

                            {/* Connection Info */}
                            <div className="space-y-6">
                                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-2">
                                    Koneksi & Autentikasi
                                </h3>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="col-span-2">
                                        <CustomInput
                                            label="IP Address / Host"
                                            required
                                            value={formData.hostAddress}
                                            onChange={(e) => setFormData({ hostAddress: e.target.value })}
                                            placeholder="192.168.88.1"
                                        />
                                    </div>
                                    <CustomInput
                                        label="API Port"
                                        type="number"
                                        required
                                        value={formData.apiPort}
                                        onChange={(e) => setFormData({ apiPort: e.target.value })}
                                        placeholder="8728"
                                    />
                                </div>

                                <div className="space-y-4 pt-1">
                                    <CustomInput
                                        label="Username"
                                        required
                                        value={formData.username}
                                        onChange={(e) => setFormData({ username: e.target.value })}
                                        placeholder="admin"
                                    />
                                    <CustomInput
                                        label={isEditMode ? "Password (Biarkan kosong jika tidak diubah)" : "Password"}
                                        type="password"
                                        required={!isEditMode}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ password: e.target.value })}
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 flex justify-end gap-3 border-t border-slate-100">
                            <CustomButton
                                type="submit"
                                variant="primary"
                                disabled={loading}
                                className="px-8"
                            >
                                <Save size={18} className="mr-2" />
                                {isEditMode ? "Simpan Perubahan" : "Simpan Router"}
                            </CustomButton>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <ModalDetail
                isOpen={isPreviewModalOpen}
                onClose={() => setIsPreviewModalOpen(false)}
                title={isEditMode ? "Konfirmasi Update Router" : "Konfirmasi Data Router"}
                icon={CheckCircle2}
                variant="warning"
                confirmLabel="Ya, Simpan Sekarang"
                cancelLabel="Cek Lagi"
                loading={loading}
                onConfirm={handleConfirmSave}
                items={[
                    { label: "Nama Router", value: formData.namaRouter },
                    { label: "Host Address", value: `${formData.hostAddress}:${formData.apiPort}` },
                    { label: "Username", value: formData.username },
                    { label: "Status", value: formData.isActive ? "Active" : "Inactive" },
                    { label: "Isolir", value: formData.isolir ? "Ya" : "Tidak" }
                ]}
            />

            <ModalMessage
                isOpen={isMessageModalOpen}
                onClose={handleModalClose}
                type={messageConfig.type}
                title={messageConfig.title}
                message={messageConfig.message}
            />
        </div>
    );
};

export default RouterCreatePage;
