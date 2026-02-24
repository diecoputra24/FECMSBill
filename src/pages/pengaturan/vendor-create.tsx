import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useVendorStore } from "@/store/vendorStore";
import {
    Building2,
    Save,
} from "lucide-react";
import { CustomButton } from "@/components/ui/custom-button";
import { CustomInput } from "@/components/ui/custom-input";
import { ModalMessage } from "@/components/ui/modal-message";

import { Card, CardContent } from "@/components/ui/card";

const VendorCreatePage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id;

    const {
        vendors,
        loading,
        fetchVendors,
        createVendor,
        updateVendor
    } = useVendorStore();

    const [formData, setFormData] = useState({
        name: "",
        address: ""
    });

    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [messageConfig, setMessageConfig] = useState<{ type: "success" | "error", title: string, message: string }>({
        type: "success",
        title: "",
        message: ""
    });

    useEffect(() => {
        if (isEdit) {
            if (vendors.length === 0) {
                fetchVendors();
            } else {
                const vendor = vendors.find(v => v.id === Number(id));
                if (vendor) {
                    setFormData({
                        name: vendor.name,
                        address: vendor.address || ""
                    });
                }
            }
        }
    }, [id, vendors, isEdit, fetchVendors]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEdit) {
                await updateVendor(Number(id), formData);
                setMessageConfig({
                    type: "success",
                    title: "Berhasil!",
                    message: "Data vendor berhasil diperbarui."
                });
            } else {
                await createVendor(formData);
                setMessageConfig({
                    type: "success",
                    title: "Berhasil!",
                    message: "Vendor baru berhasil ditambahkan."
                });
            }
            setIsMessageModalOpen(true);
        } catch (error: any) {
            setMessageConfig({
                type: "error",
                title: "Gagal!",
                message: error.response?.data?.message || "Terjadi kesalahan saat menyimpan data."
            });
            setIsMessageModalOpen(true);
        }
    };

    const handleMessageClose = () => {
        setIsMessageModalOpen(false);
        if (messageConfig.type === "success") {
            navigate("/pengaturan/vendor");
        }
    };

    return (
        <div className="w-full space-y-6 pb-10">
            <Card className="border border-slate-200 shadow-sm rounded-xl overflow-hidden mt-4">
                <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Section 1: Informasi Vendor */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-2">
                                <Building2 size={16} className="text-primary" />
                                {isEdit ? "Edit Informasi Vendor" : "Informasi Vendor Baru"}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <CustomInput
                                    label="Nama Perusahaan / Vendor"
                                    required
                                    placeholder="Contoh: PT MEGA MENTARI MANDIRI"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                                        Alamat Lengkap
                                    </label>
                                    <textarea
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        placeholder="Alamat kantor pusat atau operasional..."
                                        className="w-full min-h-[100px] px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 flex justify-end gap-3 border-t border-slate-100">
                            <CustomButton
                                type="button"
                                variant="ghost"
                                onClick={() => navigate("/pengaturan/vendor")}
                                className="px-6 font-bold text-slate-500 hover:text-slate-700"
                            >
                                Batal
                            </CustomButton>
                            <CustomButton
                                type="submit"
                                variant="primary"
                                disabled={loading}
                                className="px-8 font-bold gap-2"
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Menyimpan...</span>
                                    </div>
                                ) : (
                                    <>
                                        <Save size={18} />
                                        <span>{isEdit ? "Update Vendor" : "Simpan Vendor"}</span>
                                    </>
                                )}
                            </CustomButton>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <ModalMessage
                isOpen={isMessageModalOpen}
                onClose={handleMessageClose}
                type={messageConfig.type}
                title={messageConfig.title}
                message={messageConfig.message}
            />
        </div>
    );
};

export default VendorCreatePage;
