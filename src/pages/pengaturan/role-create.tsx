import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRoleStore } from "@/store/roleStore";
import { usePermissionStore } from "@/store/permissionStore";
import { Save } from "lucide-react";
import { CustomInput, CustomTextArea } from "@/components/ui/custom-input";
import { CustomButton } from "@/components/ui/custom-button";
import { Card, CardContent } from "@/components/ui/card";
import { ModalMessage } from "@/components/ui/modal-message";
import { ModalDetail } from "@/components/ui/modal-detail";

const RoleCreatePage: React.FC = () => {
    const navigate = useNavigate();
    const { addRole, loading } = useRoleStore();
    const { permissions, fetchPermissions } = usePermissionStore();

    const [formData, setFormData] = useState({ name: "", description: "" });
    const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([]);

    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [messageConfig, setMessageConfig] = useState<{ type: "success" | "error", title: string, message: string }>({
        type: "success",
        title: "",
        message: ""
    });

    useEffect(() => {
        fetchPermissions();
    }, [fetchPermissions]);

    const togglePermission = (id: number) => {
        setSelectedPermissionIds(prev =>
            prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
        );
    };

    const handleOpenPreview = (e: React.FormEvent) => {
        e.preventDefault();
        setIsPreviewModalOpen(true);
    };

    const handleConfirmSave = async () => {
        setIsPreviewModalOpen(false);
        const payload = {
            ...formData,
            permissionIds: selectedPermissionIds
        };

        try {
            await addRole(payload);
            setMessageConfig({ type: "success", title: "Berhasil!", message: "Role baru berhasil ditambahkan." });
            setIsMessageModalOpen(true);
        } catch (error: any) {
            setMessageConfig({ type: "error", title: "Gagal!", message: error.message || "Terjadi kesalahan." });
            setIsMessageModalOpen(true);
        }
    };

    return (
        <div className="w-full space-y-6 pb-10">
            <Card className="border border-slate-200 shadow-sm rounded-xl overflow-hidden mt-4">
                <CardContent className="p-6">
                    <form onSubmit={handleOpenPreview} className="space-y-8">
                        {/* Section 1: Atribut Role */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-2">
                                Identitas & Keterangan Role
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                <CustomInput
                                    label="Nama Identitas Role"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                                    placeholder="Contoh: SUPER_ADMIN"
                                />
                                <CustomTextArea
                                    label="Deskripsi / Tugas"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Jelaskan cakupan akses role ini..."
                                    className="min-h-[100px]"
                                />
                            </div>
                        </div>

                        {/* Section 2: Permission Grid */}
                        <div className="space-y-4 pt-4 border-t border-slate-50">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                    Daftar Izin Akses (Permissions)
                                </h3>
                                <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded">
                                    {selectedPermissionIds.length} Izin dipilih
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100 max-h-[500px] overflow-y-auto">
                                {permissions.map((perm) => (
                                    <label key={perm.id} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all group shadow-sm">
                                        <input
                                            type="checkbox"
                                            checked={selectedPermissionIds.includes(perm.id)}
                                            onChange={() => togglePermission(perm.id)}
                                            className="mt-0.5 w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
                                        />
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-xs font-black text-slate-700 group-hover:text-primary uppercase tracking-tight">{perm.name}</span>
                                            <span className="text-[10px] font-semibold text-slate-400 leading-tight uppercase line-clamp-2">{perm.description}</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="pt-6 flex justify-end gap-3 border-t border-slate-100">
                            <CustomButton
                                type="submit"
                                variant="primary"
                                disabled={loading || !formData.name}
                                className="px-10 font-bold"
                            >
                                <Save size={18} />
                                Simpan Role
                            </CustomButton>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <ModalDetail
                isOpen={isPreviewModalOpen}
                onClose={() => setIsPreviewModalOpen(false)}
                title="Konfirmasi Pembuatan Role"
                variant="primary"
                confirmLabel="Ya, Buat Role"
                cancelLabel="Cek Lagi"
                loading={loading}
                onConfirm={handleConfirmSave}
                maxWidth="lg"
            >
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight">Nama Identitas</span>
                            <div className="text-sm font-black text-primary uppercase">{formData.name}</div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight">Total Permissions</span>
                            <div className="text-sm font-bold text-slate-800">{selectedPermissionIds.length} Izin Akses Terpilih</div>
                        </div>
                        <div className="flex flex-col gap-1 md:col-span-2">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight">Keterangan / Deskripsi</span>
                            <div className="text-sm font-medium text-slate-700 italic border-l-2 border-primary/20 pl-3">
                                {formData.description || "Tidak ada deskripsi ditambahkan."}
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight block mb-2">Ringkasan Hak Akses</span>
                        <div className="flex flex-wrap gap-2">
                            {selectedPermissionIds.length > 0 ? (
                                permissions
                                    .filter(p => selectedPermissionIds.includes(p.id))
                                    .slice(0, 10)
                                    .map(p => (
                                        <span key={p.id} className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded uppercase">
                                            {p.name}
                                        </span>
                                    ))
                            ) : (
                                <span className="text-xs text-slate-400 italic">Belum ada izin yang dipilih.</span>
                            )}
                            {selectedPermissionIds.length > 10 && (
                                <span className="text-[10px] font-bold text-primary px-2 py-0.5 rounded bg-primary/5 uppercase">
                                    + {selectedPermissionIds.length - 10} Lainnya
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </ModalDetail>

            <ModalMessage
                isOpen={isMessageModalOpen}
                onClose={() => {
                    setIsMessageModalOpen(false);
                    if (messageConfig.type === "success") navigate("/pengaturan/role");
                }}
                type={messageConfig.type}
                title={messageConfig.title}
                message={messageConfig.message}
            />
        </div>
    );
};

export default RoleCreatePage;
