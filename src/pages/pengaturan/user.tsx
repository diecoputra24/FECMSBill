import React, { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useUserStore } from "@/store/userStore";
import { useRoleStore } from "@/store/roleStore";
import { useBranchStore } from "@/store/branchStore";
import { useAreaStore } from "@/store/areaStore";
import { useVendorStore } from "@/store/vendorStore";
import { X, Users, Shield, MapPin, Building2, Briefcase, Store } from "lucide-react";
import { ModalConfirm } from "@/components/ui/modal-confirm";
import { ModalMessage } from "@/components/ui/modal-message";
import { ModalDetail } from "@/components/ui/modal-detail";
import { CustomTable } from "@/components/ui/custom-table";
import { CustomButton } from "@/components/ui/custom-button";
import { CustomInput } from "@/components/ui/custom-input";
import type { User } from "@/types/user";

const UserList: React.FC = () => {
    const {
        users,
        loading,
        error: userError,
        fetchUsers,
        addUser,
        updateUser,
        deleteUser,
    } = useUserStore();

    const { roles, fetchRoles } = useRoleStore();
    const { branches, fetchBranches } = useBranchStore();
    const { areas, fetchAreas } = useAreaStore();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [messageConfig, setMessageConfig] = useState<{ type: "success" | "error", title: string, message: string }>({
        type: "success",
        title: "",
        message: ""
    });

    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedUserForDetail, setSelectedUserForDetail] = useState<User | null>(null);

    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);

    // Form state
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

    const { vendors, fetchVendors } = useVendorStore();

    useEffect(() => {
        fetchUsers();
        fetchRoles();
        fetchBranches();
        fetchAreas();
        fetchVendors();
    }, [fetchUsers, fetchRoles, fetchBranches, fetchAreas, fetchVendors]);

    // Handle Branch Change and Auto-Fill Areas
    const handleBranchChange = (branchIdStr: string) => {
        const branchId = Number(branchIdStr);
        setFormData(prev => ({
            ...prev,
            branchId: branchIdStr,
            // Auto-select ALL areas for this branch when branch is selected (optional: could be append)
            // Requirement: "otomatis dikasih semua area yang ada didalam branch A"
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
        // Filter areas displayed in checkbox list based on selected branch
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

    const handleOpenModal = (user?: User) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                name: user.name,
                username: user.username,
                email: user.email,
                password: "", // Don't fill password on edit
                roleId: user.roleId?.toString() || "",
                branchId: user.branchId?.toString() || "",
                areaIds: user.areas ? user.areas.map(a => a.id) : [],
                position: user.position || "",
                vendorId: user.vendorId?.toString() || "",
            });
        } else {
            setEditingUser(null);
            setFormData({
                name: "",
                username: "",
                email: "",
                password: "",
                roleId: "",
                branchId: "",
                areaIds: [],
                position: "",
                vendorId: "",
            });
        }
        setIsModalOpen(true);
    };

    const handleOpenDeleteModal = (user: User) => {
        setUserToDelete(user);
        setIsDeleteModalOpen(true);
    };

    const handleSelectionChange = (id: string | number | null) => {
        setSelectedUserId(id ? String(id) : null);
    };

    const handleRowClick = (user: User) => {
        setSelectedUserForDetail(user);
        setIsDetailModalOpen(true);
    };

    const handleEditSelected = () => {
        const user = users.find(u => u.id === selectedUserId);
        if (user) handleOpenModal(user);
    };

    const handleDeleteSelected = () => {
        const user = users.find(u => u.id === selectedUserId);
        if (user) handleOpenDeleteModal(user);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload: any = {
            name: formData.name,
            username: formData.username,
            email: formData.email,
            roleId: formData.roleId ? Number(formData.roleId) : null,
            branchId: formData.branchId ? Number(formData.branchId) : null,
            areaIds: formData.areaIds,
            position: formData.position || null,
            vendorId: formData.vendorId ? Number(formData.vendorId) : null,
        };

        if (formData.password) {
            payload.password = formData.password;
        }

        try {
            if (editingUser) {
                await updateUser(editingUser.id, payload);
                setMessageConfig({ type: "success", title: "Berhasil!", message: "User berhasil diperbarui." });
            } else {
                if (!formData.password) {
                    setMessageConfig({ type: "error", title: "Error", message: "Password wajib diisi untuk user baru." });
                    setIsMessageModalOpen(true);
                    return;
                }
                await addUser(payload);
                setMessageConfig({ type: "success", title: "Berhasil!", message: "User berhasil ditambahkan." });
            }
            setIsModalOpen(false);
            setIsMessageModalOpen(true);
            setSelectedUserId(null);
        } catch (error: any) {
            setMessageConfig({ type: "error", title: "Gagal!", message: error.message || "Terjadi kesalahan." });
            setIsMessageModalOpen(true);
        }
    };

    const handleDelete = async () => {
        if (userToDelete) {
            try {
                await deleteUser(userToDelete.id);
                setIsDeleteModalOpen(false);
                setUserToDelete(null);
                setSelectedUserId(null);
                setMessageConfig({ type: "success", title: "Dihapus!", message: "User berhasil dihapus." });
                setIsMessageModalOpen(true);
            } catch (error: any) {
                setMessageConfig({ type: "error", title: "Gagal!", message: "Gagal menghapus user." });
                setIsMessageModalOpen(true);
            }
        }
    };

    const columns = [
        {
            header: "User Details",
            sortable: true,
            sortKey: "name",
            render: (user: User) => (
                <div className="flex flex-col">
                    <span className="font-bold text-slate-900">{user.name}</span>
                    <span className="text-xs text-slate-500">{user.email}</span>
                </div>
            )
        },
        {
            header: "Role",
            render: (user: User) => (
                <div className="flex items-center gap-1.5 text-slate-700">
                    <Shield size={14} className="text-blue-500" />
                    <span>{user.userRole?.name || user.role}</span>
                </div>
            )
        },
        {
            header: "Branch",
            render: (user: User) => (
                <div className="flex items-center gap-1.5 text-slate-600">
                    <Building2 size={14} className="text-emerald-500" />
                    <span>{user.branch?.namaBranch || "-"}</span>
                </div>
            )
        },
        {
            header: "Access Areas",
            render: (user: User) => (
                <div className="flex items-center gap-1.5 text-slate-600">
                    <MapPin size={14} className="text-orange-500" />
                    <span className="text-xs">{user.areas?.length ? `${user.areas.length} Areas` : "-"}</span>
                </div>
            )
        },
        {
            header: "Company & Position",
            render: (user: User) => (
                <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <Store size={13} className="text-purple-500" />
                        <span className="text-xs uppercase truncate max-w-[120px]">{user.vendor?.name || "-"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500 italic">
                        <Briefcase size={12} className="text-slate-400" />
                        <span className="text-[10px] truncate max-w-[120px]">{user.position || "-"}</span>
                    </div>
                </div>
            )
        },
    ];

    return (
        <div className="space-y-4 pb-10">
            <div className="flex justify-between items-center mb-4">
                <div />
            </div>

            <CustomTable
                data={users}
                columns={columns}
                loading={loading}
                error={!!userError}
                emptyMessage="Belum ada data user."
                enableSelection={true}
                selectedId={selectedUserId ? String(selectedUserId) : null} // CustomTable might expect number or string depending on props
                onSelectionChange={handleSelectionChange}
                onRowClick={handleRowClick}
                actionButtons={selectedUserId ? (
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

            {/* User Form Modal */}
            {isModalOpen && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] animate-in fade-in duration-300" onClick={() => setIsModalOpen(false)} />
                    <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/50 shrink-0">
                            <h3 className="text-lg font-bold text-slate-800 tracking-tight">
                                {editingUser ? "Edit User" : "Tambah User"}
                            </h3>
                            <CustomButton variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} className="rounded-sm h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                                <X size={18} />
                            </CustomButton>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto">
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <CustomInput
                                        label="Nama Lengkap"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Nama User"
                                    />
                                    <CustomInput
                                        label="Username"
                                        required
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        placeholder="username"
                                        disabled={!!editingUser} // Prevent username change usually
                                    />
                                    <CustomInput
                                        label="Email"
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="email@example.com"
                                        disabled={!!editingUser} // Prevent email change usually
                                    />
                                    <CustomInput
                                        label={editingUser ? "Password Baru (Opsional)" : "Password"}
                                        type="password"
                                        required={!editingUser}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder={editingUser ? "Biarkan kosong jika tidak ubah" : "******"}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Role</label>
                                        <select
                                            className="w-full h-10 px-3 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                            value={formData.roleId}
                                            onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                                            required
                                        >
                                            <option value="">Pilih Role</option>
                                            {roles.map(role => (
                                                <option key={role.id} value={role.id}>{role.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Branch</label>
                                        <select
                                            className="w-full h-10 px-3 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                            value={formData.branchId}
                                            onChange={(e) => handleBranchChange(e.target.value)}
                                        >
                                            <option value="">All Branch</option>
                                            {branches.map(branch => (
                                                <option key={branch.id} value={branch.id}>{branch.namaBranch}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Vendor / Perusahaan</label>
                                        <select
                                            className="w-full h-10 px-3 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
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
                                        placeholder="Contoh: Supervisor Area"
                                        value={formData.position}
                                        onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                    />
                                </div>

                                {/* Area Selection Grouped by Branch */}
                                <div className="space-y-4 border-t pt-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-semibold text-slate-700 underline decoration-primary/20 underline-offset-4">Hak Akses Area</label>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-100 px-2 py-0.5 rounded">
                                            {formData.areaIds.length} Area dipilih
                                        </span>
                                    </div>

                                    <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                        {groupedAreas.length > 0 ? (
                                            groupedAreas.map(group => (
                                                <div key={group.branchId} className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">{group.branchName}</span>
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
                                                            className="text-[9px] font-bold text-primary hover:underline uppercase"
                                                        >
                                                            {group.areas.every(a => formData.areaIds.includes(a.id)) ? "Deselect All" : "Select All"}
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100 shadow-inner">
                                                        {group.areas.map(area => (
                                                            <div key={area.id} className="flex items-center gap-2 p-1.5 bg-white hover:bg-white rounded border border-slate-200 hover:border-primary/40 transition-all group-item">
                                                                <input
                                                                    type="checkbox"
                                                                    id={`area-${area.id}`}
                                                                    checked={formData.areaIds.includes(area.id)}
                                                                    onChange={() => handleAreaToggle(area.id)}
                                                                    className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
                                                                />
                                                                <label htmlFor={`area-${area.id}`} className="text-xs font-bold text-slate-600 cursor-pointer select-none flex-1 truncate uppercase">
                                                                    {area.namaArea}
                                                                </label>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-xs text-slate-400 italic p-6 border border-dashed rounded-xl text-center bg-slate-50">
                                                {formData.branchId ? "Branch ini belum memiliki area." : "Belum ada area tersedia."}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="pt-6 flex justify-end gap-2">
                                <CustomButton
                                    type="button"
                                    variant="outline"
                                    className="h-9 px-4 font-medium text-slate-600"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    Batal
                                </CustomButton>
                                <CustomButton
                                    type="submit"
                                    variant="primary"
                                    className="h-9 px-6 font-bold shadow-sm"
                                    disabled={loading}
                                >
                                    {loading ? "Menyimpan..." : "Simpan User"}
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
                title="Detail User"
                icon={Users}
                maxWidth="md"
                onConfirm={() => setIsDetailModalOpen(false)}
                confirmLabel="Tutup"
                cancelLabel=""
                items={[
                    { label: "Nama", value: selectedUserForDetail?.name || "-" },
                    { label: "Username", value: selectedUserForDetail?.username || "-" },
                    { label: "Email", value: selectedUserForDetail?.email || "-" },
                    { label: "Role", value: selectedUserForDetail?.userRole?.name || selectedUserForDetail?.role || "-" },
                    { label: "Branch", value: selectedUserForDetail?.branch?.namaBranch || "-" },
                    { label: "Perusahaan", value: selectedUserForDetail?.vendor?.name || "-" },
                    { label: "Jabatan", value: selectedUserForDetail?.position || "-" },
                    {
                        label: "Areas",
                        value: selectedUserForDetail?.areas?.length
                            ? selectedUserForDetail.areas.map(a => a.namaArea).join(", ")
                            : "No specific areas"
                    },
                    { label: "Created At", value: selectedUserForDetail?.createdAt ? new Date(selectedUserForDetail.createdAt).toLocaleString() : "-" }
                ]}
            />

            <ModalConfirm
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                variant="danger"
                title="Hapus User?"
                message={`User "${userToDelete?.name}" akan dihapus permanen.`}
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

export default UserList;
