import React, { useState } from 'react';
import {
    Shield,
    Save,
    X,
    UserPlus,
} from "lucide-react";
import { CustomInput } from "@/components/ui/custom-input";
import { CustomSelect } from "@/components/ui/custom-select";
import { CustomButton } from "@/components/ui/custom-button";
import { Card, CardContent } from "@/components/ui/card";

const VPNCreatePage: React.FC = () => {
    const [formData, setFormData] = useState({
        username: "",
        password: "",
        profile: "default",
        location: "Singapore",
    });

    const profiles = [
        { label: "Default (1 Mbps)", value: "default" },
        { label: "Premium (10 Mbps)", value: "premium" },
        { label: "High Speed (50 Mbps)", value: "high-speed" },
    ];

    const locations = [
        { label: "Singapore", value: "Singapore" },
        { label: "Indonesia", value: "Indonesia" },
        { label: "USA", value: "USA" },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Submitting VPN Registration:", formData);
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/10 flex items-center justify-center text-indigo-600">
                        <UserPlus size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Pendaftaran Member VPN</h2>
                        <p className="text-xs text-slate-500">Buat akun VPN baru untuk member premium.</p>
                    </div>
                </div>
            </div>

            <Card className="border-slate-100 shadow-xl overflow-hidden">
                <div className="bg-indigo-600 px-6 py-4 flex items-center gap-3">
                    <Shield className="text-white/80" size={20} />
                    <h3 className="text-white font-bold tracking-wide">Informasi Akses VPN</h3>
                </div>
                <CardContent className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <CustomInput
                                label="Username VPN"
                                placeholder="vpn-user-01"
                                required
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            />
                            <CustomInput
                                label="Password VPN"
                                type="password"
                                placeholder="••••••••"
                                required
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <CustomSelect
                                label="Pilih Paket Profile"
                                options={profiles}
                                value={formData.profile}
                                onChange={(val: string) => setFormData({ ...formData, profile: val })}
                            />
                            <CustomSelect
                                label="Lokasi Server"
                                options={locations}
                                value={formData.location}
                                onChange={(val: string) => setFormData({ ...formData, location: val })}
                            />
                        </div>

                        <div className="pt-6 flex justify-end gap-3 border-t border-slate-50">
                            <CustomButton
                                variant="ghost"
                                type="button"
                                className="px-6 font-semibold text-slate-500"
                            >
                                <X size={18} className="mr-2" /> Batal
                            </CustomButton>
                            <CustomButton
                                variant="primary"
                                type="submit"
                                className="px-8 font-bold shadow-lg shadow-primary/20"
                            >
                                <Save size={18} className="mr-2" /> Daftar Sekarang
                            </CustomButton>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 flex items-start gap-4">
                <div className="bg-white p-2 rounded-lg text-blue-600 shadow-sm">
                    <Shield size={20} />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-blue-900">Catatan Keamanan</h4>
                    <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                        Akun VPN akan langsung aktif setelah disimpan. Member dapat menggunakan kredensial ini
                        untuk terhubung ke router yang telah dikonfigurasi.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default VPNCreatePage;
