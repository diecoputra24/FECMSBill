import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRoleStore } from "@/store/roleStore";
import { usePermissionStore } from "@/store/permissionStore";
import { X, Info } from "lucide-react";
import { ModalConfirm } from "@/components/ui/modal-confirm";
import { ModalMessage } from "@/components/ui/modal-message";
import { ModalDetail } from "@/components/ui/modal-detail";
import { CustomTable } from "@/components/ui/custom-table";
import { CustomButton } from "@/components/ui/custom-button";
import { CustomInput, CustomTextArea } from "@/components/ui/custom-input";
import type { Role } from "@/types/role";

const RoleList: React.FC = () => {
    const {
        roles,
        loading,
        error: roleError,
        fetchRoles,
        addRole,
        updateRole,
        deleteRole,
    } = useRoleStore();

    const { permissions, fetchPermissions } = usePermissionStore();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [messageConfig, setMessageConfig] = useState<{ type: "success" | "error", title: string, message: string }>({
        type: "success",
        title: "",
        message: ""
    });

    // Selection & Detail states
    const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedRoleForDetail, setSelectedRoleForDetail] = useState<Role | null>(null);

    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

    // Form state
    const [formData, setFormData] = useState({ name: "", description: "" });
    const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([]);

    // Fetch roles and permissions on mount
    useEffect(() => {
        fetchRoles();
        fetchPermissions();
    }, [fetchRoles, fetchPermissions]);

    const handleOpenModal = (role?: Role) => {
        if (role) {
            setEditingRole(role);
            setFormData({ name: role.name, description: role.description || "" });
            // Extract existing permission IDs
            const currentIds = role.permissions ? role.permissions.map(p => p.permissionId) : [];
            setSelectedPermissionIds(currentIds);
        } else {
            setEditingRole(null);
            setFormData({ name: "", description: "" });
            setSelectedPermissionIds([]);
        }
        setIsModalOpen(true);
    };

    const handleOpenDeleteModal = (role: Role) => {
        setRoleToDelete(role);
        setIsDeleteModalOpen(true);
    };

    const handleSelectionChange = (id: string | number | null) => {
        setSelectedRoleId(id ? Number(id) : null);
    };

    const handleRowClick = (role: Role) => {
        setSelectedRoleForDetail(role);
        setIsDetailModalOpen(true);
    };

    const handleEditSelected = () => {
        const role = roles.find(r => r.id === selectedRoleId);
        if (role) handleOpenModal(role);
    };

    const handleDeleteSelected = () => {
        const role = roles.find(r => r.id === selectedRoleId);
        if (role) handleOpenDeleteModal(role);
    };

    const togglePermission = (id: number) => {
        setSelectedPermissionIds(prev =>
            prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            ...formData,
            permissionIds: selectedPermissionIds
        };

        try {
            if (editingRole) {
                await updateRole(editingRole.id, payload);
                setMessageConfig({
                    type: "success",
                    title: "Berhasil!",
                    message: "Data role berhasil diperbarui."
                });
            } else {
                await addRole(payload);
                setMessageConfig({
                    type: "success",
                    title: "Berhasil!",
                    message: "Data role berhasil ditambahkan."
                });
            }
            setIsModalOpen(false);
            setIsMessageModalOpen(true);
            setSelectedRoleId(null);
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
        if (roleToDelete) {
            try {
                await deleteRole(roleToDelete.id);
                setIsDeleteModalOpen(false);
                setRoleToDelete(null);
                setSelectedRoleId(null);
                setMessageConfig({
                    type: "success",
                    title: "Dihapus!",
                    message: "Role berhasil dihapus secara permanen."
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
            header: "Role Name",
            sortable: true,
            sortKey: "name",
            render: (role: Role) => (
                <div className="text-slate-900 font-bold">{role.name}</div>
            )
        },
        {
            header: "Description",
            sortable: true,
            sortKey: "description",
            render: (role: Role) => (
                <div className="text-slate-600">
                    <span className="truncate max-w-[200px] block">{role.description || "-"}</span>
                </div>
            )
        },
        {
            header: "Permissions Count",
            render: (role: Role) => (
                <div className="text-slate-600">
                    <span className="bg-slate-100 px-2 py-1 rounded text-xs font-semibold">
                        {role.permissions?.length || 0} permissions
                    </span>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-4 pb-10">
            <div className="flex justify-between items-center mb-4">
                <div />
            </div>

            <CustomTable
                data={roles}
                columns={columns}
                loading={loading}
                error={!!roleError}
                emptyMessage="Belum ada data role."
                enableSelection={true}
                selectedId={selectedRoleId}
                onSelectionChange={handleSelectionChange}
                onRowClick={handleRowClick}
                actionButtons={selectedRoleId ? (
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

            {/* Form Modal */}
            {isModalOpen && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] animate-in fade-in duration-300" onClick={() => setIsModalOpen(false)} />
                    <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/50 shrink-0">
                            <h3 className="text-lg font-bold text-slate-800 tracking-tight">
                                {editingRole ? "Edit Role" : "Tambah Role"}
                            </h3>
                            <CustomButton variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} className="rounded-sm h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                                <X size={18} />
                            </CustomButton>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto">
                            <div className="space-y-4">
                                <CustomInput
                                    label="Role Name"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. SUPERADMIN"
                                />
                                <CustomTextArea
                                    label="Description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Role description..."
                                />

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Permissions</label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto border rounded-md p-2 bg-slate-50">
                                        {permissions.map((perm) => (
                                            <div key={perm.id} className="flex items-start gap-2 p-1 hover:bg-white rounded">
                                                <input
                                                    type="checkbox"
                                                    id={`perm-${perm.id}`}
                                                    checked={selectedPermissionIds.includes(perm.id)}
                                                    onChange={() => togglePermission(perm.id)}
                                                    className="mt-1"
                                                />
                                                <label htmlFor={`perm-${perm.id}`} className="text-sm cursor-pointer select-none">
                                                    <span className="font-medium block">{perm.name}</span>
                                                    <span className="text-xs text-slate-500">{perm.description}</span>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="pt-6 flex justify-end gap-2">
                                <CustomButton
                                    type="button"
                                    variant="outline"
                                    className="h-8 px-4 font-semibold text-xs text-slate-600"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    Batal
                                </CustomButton>
                                <CustomButton
                                    type="submit"
                                    variant="primary"
                                    className="h-8 px-4 font-bold text-xs shadow-sm"
                                    disabled={loading}
                                >
                                    {loading ? "Menyimpan..." : "Simpan"}
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
                title="Detail Role"
                icon={Info}
                maxWidth="md"
                onConfirm={() => setIsDetailModalOpen(false)}
                confirmLabel="Tutup"
                cancelLabel=""
                items={[
                    { label: "Name", value: selectedRoleForDetail?.name || "-" },
                    { label: "Description", value: selectedRoleForDetail?.description || "-" },
                    {
                        label: "Permissions",
                        value: selectedRoleForDetail?.permissions?.map(p => p.permission.name).join(", ") || "-"
                    },
                    { label: "Created At", value: selectedRoleForDetail?.createdAt || "-" }
                ]}
            />

            <ModalConfirm
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                variant="danger"
                title="Hapus Role?"
                message={`Role "${roleToDelete?.name}" akan dihapus permanen.`}
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

export default RoleList;
