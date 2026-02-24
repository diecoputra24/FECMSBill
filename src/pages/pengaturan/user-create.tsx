import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "@/store/userStore";
import { useRoleStore } from "@/store/roleStore";
import { useBranchStore } from "@/store/branchStore";
import { useAreaStore } from "@/store/areaStore";
import { useVendorStore } from "@/store/vendorStore";
import { Save, MapPin } from "lucide-react";
import { CustomInput } from "@/components/ui/custom-input";
import { CustomButton } from "@/components/ui/custom-button";
import { Card, CardContent } from "@/components/ui/card";
import { ModalMessage } from "@/components/ui/modal-message";
import { ModalDetail } from "@/components/ui/modal-detail";

const UserCreatePage: React.FC = () => {
    const navigate = useNavigate();
    const { addUser, loading } = useUserStore();
    const { roles, fetchRoles } = useRoleStore();
    const { branches, fetchBranches } = useBranchStore();
    const { areas, fetchAreas } = useAreaStore();
    const { vendors, fetchVendors } = useVendorStore();

    const [formData, setFormData] = useState({
        name: "",
        username: "",
        email: "",
        password: "",
        roleId: "",
        branchId: "",
        areaIds: [] as number[],
        position: "",
        vendorId: "",
    });

    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [messageConfig, setMessageConfig] = useState<{ type: "success" | "error", title: string, message: string }>({
        type: "success",
        title: "",
        message: ""
    });

    useEffect(() => {
        fetchRoles();
        fetchBranches();
        fetchAreas();
        fetchVendors();
    }, [fetchRoles, fetchBranches, fetchAreas, fetchVendors]);

    const handleBranchChange = (branchIdStr: string) => {
        const branchId = Number(branchIdStr);
        setFormData(prev => ({
            ...prev,
            branchId: branchIdStr,
            areaIds: branchIdStr
                ? areas.filter(a => a.branchId === branchId).map(a => a.id)
                : areas.map(a => a.id)
        }));
    };

    const handleAreaToggle = (areaId: number) => {
        setFormData(prev => {
            const current = prev.areaIds;
            const isSelected = current.includes(areaId);
            return {
                ...prev,
                areaIds: isSelected ? current.filter(id => id !== areaId) : [...current, areaId]
            };
        });
    };

    const filteredAreas = useMemo(() => {
        if (!formData.branchId) return areas;
        return areas.filter(a => a.branchId === Number(formData.branchId));
    }, [areas, formData.branchId]);

    const groupedAreas = useMemo(() => {
        const groups: Record<number, { branchId: number, branchName: string, areas: any[] }> = {};

        filteredAreas.forEach(area => {
            const branchId = area.branchId;
            if (!groups[branchId]) {
                const branch = branches.find(b => b.id === branchId);
                groups[branchId] = {
                    branchId,
                    branchName: branch ? branch.namaBranch : "Unknown Branch",
                    areas: []
                };
            }
            groups[branchId].areas.push(area);
        });

        return Object.values(groups);
    }, [filteredAreas, branches]);

    const handleOpenPreview = (e: React.FormEvent) => {
        e.preventDefault();
        setIsPreviewModalOpen(true);
    };

    const handleConfirmSave = async () => {
        setIsPreviewModalOpen(false);
        const payload: any = {
            name: formData.name,
            username: formData.username,
            email: formData.email,
            password: formData.password,
            roleId: formData.roleId ? Number(formData.roleId) : null,
            branchId: formData.branchId ? Number(formData.branchId) : null,
            areaIds: formData.areaIds,
            position: formData.position || null,
            vendorId: formData.vendorId ? Number(formData.vendorId) : null,
        };

        try {
            await addUser(payload);
            setMessageConfig({ type: "success", title: "Berhasil!", message: "User baru berhasil ditambahkan." });
            setIsMessageModalOpen(true);
        } catch (error: any) {
            setMessageConfig({ type: "error", title: "Gagal!", message: error.message || "Terjadi kesalahan." });
            setIsMessageModalOpen(true);
        }
    };

    const selectedRole = roles.find(r => r.id.toString() === formData.roleId);
    const selectedBranch = branches.find(b => b.id.toString() === formData.branchId);
    const selectedVendor = vendors.find(v => v.id.toString() === formData.vendorId);

    return (
        <div className="w-full space-y-6 pb-10">
            <Card className="border border-slate-200 shadow-sm rounded-xl overflow-hidden mt-4">
                <CardContent className="p-6">
                    <form onSubmit={handleOpenPreview} className="space-y-8">
                        {/* Section 1: Profil Akun */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-2">
                                Profil Akun & Informasi Personal
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <CustomInput
                                    label="Nama Lengkap"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Nama Sesuai KTP / Identitas"
                                />
                                <CustomInput
                                    label="Username"
                                    required
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    placeholder="username_akses"
                                />
                                <CustomInput
                                    label="Email Address"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="email@example.com"
                                />
                                <CustomInput
                                    label="Password Akses"
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="******"
                                />
                            </div>
                        </div>

                        {/* Section 2: Penempatan & Peran */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-2">
                                Penempatan & Peran Sistem
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block ml-1">Role Sistem *</label>
                                    <select
                                        className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary bg-white shadow-sm transition-all"
                                        value={formData.roleId}
                                        onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                                        required
                                    >
                                        <option value="">Pilih Tingkat Akses</option>
                                        {roles.map(role => (
                                            <option key={role.id} value={role.id}>{role.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block ml-1">Unit Cabang (Branch)</label>
                                    <select
                                        className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary bg-white shadow-sm transition-all"
                                        value={formData.branchId}
                                        onChange={(e) => handleBranchChange(e.target.value)}
                                    >
                                        <option value="">Seluruh Cabang (All Branch)</option>
                                        {branches.map(branch => (
                                            <option key={branch.id} value={branch.id}>{branch.namaBranch}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block ml-1">Vendor Utama</label>
                                    <select
                                        className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary bg-white shadow-sm transition-all"
                                        value={formData.vendorId}
                                        onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
                                    >
                                        <option value="">Pilih Vendor</option>
                                        {vendors.map(vendor => (
                                            <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <CustomInput
                                    label="Jabatan / Posisi"
                                    placeholder="Contoh: Admin Pusat"
                                    value={formData.position}
                                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Section 3: Hak Akses Area */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b pb-2">
                                <h3 className="text-sm font-bold text-slate-900">Hak Akses Area</h3>
                                <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded">
                                    {formData.areaIds.length} Area dipilih
                                </span>
                            </div>

                            <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                {groupedAreas.length > 0 ? (
                                    groupedAreas.map(group => (
                                        <div key={group.branchId} className="space-y-3">
                                            <div className="flex items-center justify-between px-1">
                                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                    <MapPin size={12} className="text-primary/60" />
                                                    {group.branchName}
                                                </h4>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const groupIds = group.areas.map(a => a.id);
                                                        const allSelected = groupIds.every(id => formData.areaIds.includes(id));
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            areaIds: allSelected
                                                                ? prev.areaIds.filter(id => !groupIds.includes(id))
                                                                : Array.from(new Set([...prev.areaIds, ...groupIds]))
                                                        }));
                                                    }}
                                                    className="text-[10px] font-bold text-primary hover:underline uppercase"
                                                >
                                                    {group.areas.every(a => formData.areaIds.includes(a.id)) ? "Deselect All" : "Select All Branch"}
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                                                {group.areas.map(area => (
                                                    <label key={area.id} className="flex items-center gap-3 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all group shadow-sm">
                                                        <input
                                                            type="checkbox"
                                                            checked={formData.areaIds.includes(area.id)}
                                                            onChange={() => handleAreaToggle(area.id)}
                                                            className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
                                                        />
                                                        <span className="text-xs font-bold text-slate-600 group-hover:text-primary truncate uppercase">{area.namaArea}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-10 text-center text-slate-400 italic text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                        Data area tidak tersedia untuk branch yang dipilih.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="pt-6 flex justify-end gap-3 border-t border-slate-100">
                            <CustomButton
                                type="submit"
                                variant="primary"
                                disabled={loading || !formData.roleId || !formData.name}
                                className="px-10 font-bold"
                            >
                                <Save size={18} />
                                Simpan User
                            </CustomButton>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <ModalDetail
                isOpen={isPreviewModalOpen}
                onClose={() => setIsPreviewModalOpen(false)}
                title="Konfirmasi Pendaftaran User"
                variant="primary"
                confirmLabel="Ya, Buat Akun"
                cancelLabel="Cek Lagi"
                loading={loading}
                onConfirm={handleConfirmSave}
                maxWidth="lg"
            >
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight">Nama Lengkap</span>
                            <div className="text-sm font-bold text-slate-800">{formData.name}</div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight">Username</span>
                            <div className="text-sm font-bold text-primary">{formData.username}</div>
                        </div>
                        <div className="flex flex-col gap-1 col-span-2">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight">Email Akun</span>
                            <div className="text-sm font-bold text-slate-600 lowercase">{formData.email}</div>
                        </div>
                    </div>

                    <div className="h-px bg-slate-100" />

                    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight">Role Sistem</span>
                            <div className="text-sm font-bold text-slate-800 uppercase">{selectedRole?.name || "-"}</div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight">Branch</span>
                            <div className="text-sm font-bold text-slate-600 uppercase">{selectedBranch?.namaBranch || "ALL BRANCH"}</div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight">Jabatan</span>
                            <div className="text-sm font-bold text-slate-800 uppercase">{formData.position || "-"}</div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight">Vendor</span>
                            <div className="text-sm font-bold text-slate-600 uppercase">{selectedVendor?.name || "-"}</div>
                        </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight block mb-1">Akses Area ({formData.areaIds.length})</span>
                        <div className="text-xs font-bold text-slate-600 line-clamp-2 uppercase">
                            {formData.areaIds.length > 0
                                ? areas.filter(a => formData.areaIds.includes(a.id)).map(a => a.namaArea).join(", ")
                                : "TIDAK ADA AREA SPESIFIK"}
                        </div>
                    </div>
                </div>
            </ModalDetail>

            <ModalMessage
                isOpen={isMessageModalOpen}
                onClose={() => {
                    setIsMessageModalOpen(false);
                    if (messageConfig.type === "success") navigate("/pengaturan/user");
                }}
                type={messageConfig.type}
                title={messageConfig.title}
                message={messageConfig.message}
            />
        </div>
    );
};

export default UserCreatePage;
