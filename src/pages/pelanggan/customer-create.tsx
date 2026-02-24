import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useCustomerStore } from "@/store/customerStore";
import { useBranchStore } from "@/store/branchStore";
import { useAreaStore } from "@/store/areaStore";
import { useOdpStore } from "@/store/odpStore";
import { usePackageStore } from "@/store/packageStore";
import { useAddonStore } from "@/store/addonStore";
import { useTaxStore } from "@/store/taxStore";
import { CustomButton } from "@/components/ui/custom-button";
import { CustomInput, CustomCurrencyInput, CustomSwitch } from "@/components/ui/custom-input";
import { CustomSelect } from "@/components/ui/custom-select";
import { Card, CardContent } from "@/components/ui/card";
import { ModalMessage } from "@/components/ui/modal-message";
import { ModalDetail } from "@/components/ui/modal-detail";
import { Save, Trash2, Search, Loader2, X } from "lucide-react";
import api from "@/lib/api";
import { CustomDatePicker } from "@/components/ui/custom-datepicker";
import { cn } from "@/lib/utils";
import { MapPicker } from "@/components/ui/map-picker";

// Helper Components for Custom Modal Layout
const InfoCard = ({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) => (
    <div className={cn("rounded-md overflow-hidden flex flex-col h-full bg-slate-50", className)}>
        <div className="bg-slate-200 px-4 py-2">
            <h4 className="font-bold text-slate-700 text-sm tracking-tight">{title}</h4>
        </div>
        <div className="p-4 grid grid-cols-2 gap-y-4 gap-x-4 content-start bg-white">
            {children}
        </div>
    </div>
);

const InfoRow = ({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) => (
    <div className={cn("flex flex-col gap-1", className)}>
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
        <div className="text-sm font-medium text-slate-800 break-words leading-snug">
            {value || <span className="text-slate-300 italic font-normal text-xs">-</span>}
        </div>
    </div>
);

// Helper to generate Port options (1-16 usually for ODP)
const PORT_OPTIONS = Array.from({ length: 16 }, (_, i) => ({ label: `Port ${i + 1}`, value: (i + 1).toString() }));

const CustomerCreatePage: React.FC = () => {
    const navigate = useNavigate();
    const {
        createFormData,
        setCreateFormData,
        resetCreateFormData,
        addCustomer,
        loading
    } = useCustomerStore();

    // Load dependencies
    const { branches, fetchBranches } = useBranchStore();
    const { areas, fetchAreas } = useAreaStore();
    const { odps, fetchOdps } = useOdpStore();
    const { packages, fetchPackages } = usePackageStore();
    const { addons, fetchAddons } = useAddonStore();
    const { taxes, fetchTaxes } = useTaxStore();

    useEffect(() => {
        fetchBranches();
        fetchAreas();
        fetchOdps();
        fetchPackages();
        fetchAddons();
        fetchTaxes();
    }, []);

    const [selectedAddonId, setSelectedAddonId] = useState("");

    const handleAddAddon = () => {
        if (!selectedAddonId) return;
        setCreateFormData({
            addonIds: [...createFormData.addonIds, selectedAddonId]
        });
        setSelectedAddonId("");
    };

    const handleRemoveAddon = (index: number) => {
        const newAddons = [...createFormData.addonIds];
        newAddons.splice(index, 1);
        setCreateFormData({ addonIds: newAddons });
    };

    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [messageConfig, setMessageConfig] = useState<{ type: "success" | "error", title: string, message: string }>({
        type: "success",
        title: "",
        message: ""
    });

    // Secrets Search Modal State
    const [isSecretsModalOpen, setIsSecretsModalOpen] = useState(false);
    const [availableSecrets, setAvailableSecrets] = useState<any[]>([]);
    const [isAddressSyncing, setIsAddressSyncing] = useState(false);
    const [secretsLoading, setSecretsLoading] = useState(false);
    const [secretsError, setSecretsError] = useState<string | null>(null);

    // Fetch Available Secrets
    const fetchAvailableSecrets = async () => {
        if (!createFormData.paketId) {
            setSecretsError("Pilih paket terlebih dahulu");
            setIsSecretsModalOpen(true);
            return;
        }

        const selectedPackage = packages.find(p => p.id.toString() === createFormData.paketId);
        if (!selectedPackage) {
            setSecretsError("Paket tidak ditemukan. Silakan pilih paket kembali.");
            setIsSecretsModalOpen(true);
            return;
        }

        if (!selectedPackage.routerId) {
            setSecretsError("Paket tidak memiliki konfigurasi router. Silakan pilih paket lain atau hubungi administrator.");
            setIsSecretsModalOpen(true);
            return;
        }

        setSecretsLoading(true);
        setSecretsError(null);
        setIsSecretsModalOpen(true);

        try {
            const response = await api.get(`/connection/available-secrets/${selectedPackage.routerId}`, {
                params: { profile: selectedPackage.mikrotikProfile }
            });
            setAvailableSecrets(Array.isArray(response.data) ? response.data : []);
        } catch (err: any) {
            setSecretsError(err.response?.data?.message || err.message || "Gagal mengambil data secrets");
            setAvailableSecrets([]);
        } finally {
            setSecretsLoading(false);
        }
    };

    // Secret search filter
    const [secretsSearch, setSecretsSearch] = useState("");

    // Handle Secret Selection
    const handleSelectSecret = (secret: any) => {
        if (!secret) return;
        setCreateFormData({
            pppUsername: secret.name,
            pppPassword: secret.password || '', // Password dari MikroTik
            pppService: secret.service || 'pppoe'
        });
        setIsSecretsModalOpen(false);
        setSecretsSearch("");
    };

    // Filtered secrets based on search
    // Filtered secrets based on search - with extra safety
    const filteredSecrets = (availableSecrets || []).filter(s => {
        if (!s) return false;
        const name = String(s.name || "").toLowerCase();
        const profile = String(s.profile || "").toLowerCase();
        const search = String(secretsSearch || "").toLowerCase();
        return name.includes(search) || profile.includes(search);
    });

    // Filtering logic
    const filteredAreas = areas.filter(a => a.branchId.toString() === createFormData.branchId);
    const filteredOdps = odps.filter(o => o.areaId.toString() === createFormData.areaId);

    const handleOpenPreview = (e: React.FormEvent) => {
        e.preventDefault();
        setIsPreviewModalOpen(true);
    };

    const handleConfirmSave = async () => {
        setIsPreviewModalOpen(false);
        try {
            await addCustomer(createFormData);
            setMessageConfig({
                type: "success",
                title: "Berhasil!",
                message: "Pelanggan baru berhasil ditambahkan."
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
            navigate("/pelanggan");
        }
    };

    // Derived values for preview
    const selectedBranch = branches.find(b => b.id.toString() === createFormData.branchId);
    const selectedArea = areas.find(a => a.id.toString() === createFormData.areaId);
    const selectedOdp = odps.find(o => o.id.toString() === createFormData.odpId);
    const selectedPacket = packages.find(p => p.id.toString() === createFormData.paketId);

    // Calculate total price (Frontend only)
    const hargaPaket = Number(selectedPacket?.hargaPaket || 0);
    const totalAddonPrice = createFormData.addonIds.reduce((sum, id) => {
        const addon = addons.find(a => a.id.toString() === id);
        return sum + (addon ? Number(addon.price) : 0);
    }, 0);

    const diskonValue = Number(createFormData.diskon) || 0;
    const totalHarga = Math.max(0, hargaPaket + totalAddonPrice - diskonValue);

    // TAX Calculation
    const selectedTaxRate = taxes.find(t => t.id.toString() === createFormData.taxId);
    const taxAmount = (createFormData.useTax && selectedTaxRate)
        ? Math.round(totalHarga * (Number(selectedTaxRate.value) / 100))
        : 0;
    const totalBayarWithTax = totalHarga + taxAmount;

    return (
        <div className="w-full space-y-6 pb-10">
            <Card className="border border-slate-200 shadow-sm rounded-xl overflow-hidden mt-4">
                <CardContent className="p-6">
                    <form onSubmit={handleOpenPreview} className="space-y-8">

                        {/* Section 1: Data Pribadi */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-2">
                                Data Pribadi Pelanggan
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <CustomInput
                                    label="ID Pelanggan"
                                    value={createFormData.idPelanggan}
                                    onChange={(e) => setCreateFormData({ idPelanggan: e.target.value.toUpperCase() })}
                                    placeholder="Otomatis dibuat sistem (YYMMDDxxxx)"
                                    disabled
                                    className="bg-slate-100 text-slate-500"
                                />
                                <CustomInput
                                    label="Nama Lengkap"
                                    required
                                    value={createFormData.namaPelanggan}
                                    onChange={(e) => setCreateFormData({ namaPelanggan: e.target.value.toUpperCase() })}
                                    placeholder="Nama Sesuai KTP"
                                />
                                <CustomInput
                                    label="Nomor KTP / Identitas"
                                    required
                                    value={createFormData.identitasPelanggan}
                                    onChange={(e) => setCreateFormData({ identitasPelanggan: e.target.value })}
                                    placeholder="320xxxxxxxxxxxxx"
                                />
                                <CustomInput
                                    label="Nomor Telepon / WA"
                                    required
                                    value={createFormData.teleponPelanggan}
                                    onChange={(e) => setCreateFormData({ teleponPelanggan: e.target.value })}
                                    placeholder="08xxxxxxxxxx"
                                />

                                {/* Lokasi & Alamat - 2 Column Layout */}
                                <div className="md:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Kolom Kiri: Koordinat + Peta */}
                                    <div className="space-y-3">
                                        {/* <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                                            Lokasi Pemasangan
                                        </label> */}

                                        {/* Lat/Lng Inputs */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Latitude</label>
                                                <input
                                                    type="text"
                                                    value={createFormData.latitude}
                                                    onChange={(e) => setCreateFormData({ latitude: e.target.value })}
                                                    placeholder="-6.123456"
                                                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Longitude</label>
                                                <input
                                                    type="text"
                                                    value={createFormData.longitude}
                                                    onChange={(e) => setCreateFormData({ longitude: e.target.value })}
                                                    placeholder="106.123456"
                                                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                                                />
                                            </div>
                                        </div>

                                        {/* Map Picker - One Frame Interactive */}
                                        <div className="h-[240px] rounded-xl overflow-hidden border border-slate-200">
                                            <MapPicker
                                                lat={createFormData.latitude}
                                                lng={createFormData.longitude}
                                                autoAddress={createFormData.autoAddress}
                                                onSyncChange={setIsAddressSyncing}
                                                onLocationSelect={(lat, lng, address) => {
                                                    const updates: any = { latitude: lat, longitude: lng };
                                                    if (createFormData.autoAddress && address) {
                                                        updates.alamatPelanggan = address;
                                                    }
                                                    setCreateFormData(updates);
                                                }}
                                            />
                                        </div>

                                        {/* Google Maps Link */}
                                        {createFormData.latitude && createFormData.longitude && (
                                            <a
                                                href={`https://www.google.com/maps?q=${createFormData.latitude},${createFormData.longitude}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 text-[11px] font-semibold text-primary hover:underline"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                                                Buka di Google Maps
                                            </a>
                                        )}
                                    </div>

                                    {/* Kolom Kanan: Alamat */}
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                                                Alamat Pemasangan <span className="text-red-500">*</span>
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-slate-400">Auto dari Peta</span>
                                                <CustomSwitch
                                                    checked={createFormData.autoAddress}
                                                    onChange={(checked) => setCreateFormData({ autoAddress: checked })}
                                                />
                                            </div>
                                        </div>
                                        <textarea
                                            value={isAddressSyncing ? "Syncing address..." : createFormData.alamatPelanggan}
                                            onChange={(e) => setCreateFormData({ alamatPelanggan: e.target.value })}
                                            placeholder={createFormData.autoAddress ? "Alamat akan terisi otomatis dari peta..." : "Alamat lengkap pemasangan..."}
                                            disabled={createFormData.autoAddress || isAddressSyncing}
                                            className={`w-full min-h-[200px] px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all resize-none ${createFormData.autoAddress || isAddressSyncing ? "bg-slate-50 text-slate-500 italic" : ""}`}
                                        />

                                        {createFormData.autoAddress && (
                                            <p className="text-[10px] text-amber-600 italic">
                                                ✓ Alamat akan diisi otomatis saat Anda memilih lokasi di peta.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Data Teknis & Lokasi */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-2">
                                Data Teknis & Lokasi
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <CustomSelect
                                    label="Cabang"
                                    required
                                    value={createFormData.branchId}
                                    onChange={(val) => setCreateFormData({ branchId: val, areaId: "", odpId: "", odpPortId: "" })}
                                    options={branches.map(b => ({ label: b.namaBranch, value: b.id.toString() }))}
                                    placeholder="Pilih Cabang"
                                />
                                <CustomSelect
                                    label="Area"
                                    required
                                    value={createFormData.areaId}
                                    onChange={(val) => setCreateFormData({ areaId: val, odpId: "", odpPortId: "" })}
                                    options={filteredAreas.map(a => ({ label: a.namaArea, value: a.id.toString() }))}
                                    placeholder={createFormData.branchId ? "Pilih Area" : "Pilih Cabang Dahulu"}
                                    disabled={!createFormData.branchId}
                                />
                                <CustomSelect
                                    label="ODP"
                                    value={createFormData.odpId}
                                    onChange={(val) => setCreateFormData({ odpId: val, odpPortId: "" })}
                                    options={filteredOdps.map(o => ({ label: o.namaOdp, value: o.id.toString() }))}
                                    placeholder={createFormData.areaId ? "Pilih ODP (Opsional)" : "Pilih Area Dahulu"}
                                    disabled={!createFormData.areaId}
                                />
                                <CustomSelect
                                    label="Port ODP"
                                    value={createFormData.odpPortId}
                                    onChange={(val) => setCreateFormData({ odpPortId: val })}
                                    options={PORT_OPTIONS}
                                    placeholder="Pilih Port (Opsional)"
                                />
                            </div>
                        </div>

                        {/* Section 3: Layanan & Akun PPPoE */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-2">
                                Layanan & Akun PPPoE
                            </h3>

                            {/* Paket & Secret Mode Selection */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <CustomSelect
                                    label="Paket Layanan"
                                    required
                                    value={createFormData.paketId}
                                    onChange={(val) => setCreateFormData({ paketId: val, pppUsername: '', pppPassword: '', pppService: 'pppoe' })}
                                    options={packages.map(p => ({ label: `${p.router?.namaRouter || '-'} - ${p.namaPaket}`, value: p.id.toString() }))}
                                    placeholder="Pilih Paket Internet"
                                />

                                {/* Secret Mode Selection */}
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-tighter ml-1 block">
                                        Mode Secret PPPoE
                                    </label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            className={`flex-1 px-3 py-2 text-xs font-semibold rounded-lg border transition-all ${createFormData.secretMode === 'NEW'
                                                ? 'bg-primary text-white border-primary shadow-sm'
                                                : 'bg-white text-slate-600 border-slate-200 hover:border-primary/50'
                                                }`}
                                            onClick={() => setCreateFormData({ secretMode: 'NEW', pppUsername: '', pppPassword: '' })}
                                        >
                                            Buat Baru
                                        </button>
                                        <button
                                            type="button"
                                            className={`flex-1 px-3 py-2 text-xs font-semibold rounded-lg border transition-all ${createFormData.secretMode === 'EXISTING'
                                                ? 'bg-primary text-white border-primary shadow-sm'
                                                : 'bg-white text-slate-600 border-slate-200 hover:border-primary/50'
                                                }`}
                                            onClick={() => setCreateFormData({ secretMode: 'EXISTING', pppUsername: '', pppPassword: '' })}
                                        >
                                            Pakai Existing
                                        </button>
                                        <button
                                            type="button"
                                            className={`flex-1 px-3 py-2 text-xs font-semibold rounded-lg border transition-all ${createFormData.secretMode === 'NONE'
                                                ? 'bg-slate-500 text-white border-slate-500 shadow-sm'
                                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                                                }`}
                                            onClick={() => setCreateFormData({ secretMode: 'NONE', pppUsername: '', pppPassword: '', pppService: '' })}
                                        >
                                            Tanpa Secret
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* PPP Fields - Only show if not NONE */}
                            {createFormData.secretMode !== 'NONE' && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
                                    {createFormData.secretMode === 'EXISTING' ? (
                                        <>
                                            <div className="space-y-1">
                                                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-tighter ml-1 block">
                                                    Username PPPoE <span className="text-red-500">*</span>
                                                </label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        className="flex-1 h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm font-medium text-slate-500 outline-none cursor-not-allowed"
                                                        value={createFormData.pppUsername}
                                                        onChange={(e) => setCreateFormData({ pppUsername: e.target.value })}
                                                        placeholder="Pilih username via search..."
                                                        required
                                                        readOnly
                                                    />
                                                    <button
                                                        type="button"
                                                        className="h-10 px-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-1"
                                                        title="Cari secret yang tersedia di MikroTik"
                                                        onClick={fetchAvailableSecrets}
                                                    >
                                                        <Search size={16} />
                                                    </button>
                                                </div>
                                                <p className="text-[10px] text-slate-400 ml-1">Klik tombol search untuk memilih dari daftar secret yang tersedia</p>
                                            </div>
                                            <CustomInput
                                                label="Password PPPoE"
                                                required
                                                value={createFormData.pppPassword}
                                                onChange={(e) => setCreateFormData({ pppPassword: e.target.value })}
                                                placeholder="Password akan terisi otomatis"
                                                disabled
                                            />
                                            <CustomSelect
                                                label="Service"
                                                value={createFormData.pppService}
                                                onChange={(val) => setCreateFormData({ pppService: val })}
                                                disabled
                                                options={[
                                                    { label: 'PPPoE', value: 'pppoe' },
                                                    { label: 'Any', value: 'any' },
                                                    { label: 'L2TP', value: 'l2tp' },
                                                    { label: 'PPTP', value: 'pptp' },
                                                    { label: 'OVPN', value: 'ovpn' },
                                                ]}
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <CustomInput
                                                label="Username PPPoE"
                                                required
                                                value={createFormData.pppUsername}
                                                onChange={(e) => setCreateFormData({ pppUsername: e.target.value })}
                                                placeholder="user_pppoe"
                                            />
                                            <CustomInput
                                                label="Password PPPoE"
                                                required
                                                value={createFormData.pppPassword}
                                                onChange={(e) => setCreateFormData({ pppPassword: e.target.value })}
                                                placeholder="password123"
                                            />
                                            <CustomSelect
                                                label="Service"
                                                value={createFormData.pppService}
                                                onChange={(val) => setCreateFormData({ pppService: val })}
                                                options={[
                                                    { label: 'PPPoE', value: 'pppoe' },
                                                    { label: 'Any', value: 'any' },
                                                    { label: 'L2TP', value: 'l2tp' },
                                                    { label: 'PPTP', value: 'pptp' },
                                                    { label: 'OVPN', value: 'ovpn' },
                                                ]}
                                            />
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Info for NONE mode */}
                            {createFormData.secretMode === 'NONE' && (
                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                    <p className="text-sm text-amber-700 font-medium">
                                        ⚠️ Mode Tanpa Secret: Pelanggan ini tidak akan memiliki akun PPPoE di MikroTik.
                                        Cocok untuk pelanggan yang menggunakan koneksi lain (static IP, DHCP, dll).
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Section 4: Layanan Tambahan (Add-on) */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-2">
                                Layanan Tambahan (Add-on)
                            </h3>
                            <div className="grid grid-cols-1 gap-6">
                                <div className="flex gap-4 items-end">
                                    <div className="flex-1">
                                        <CustomSelect
                                            label="Pilih Add-on"
                                            value={selectedAddonId}
                                            onChange={(val) => setSelectedAddonId(val)}
                                            options={addons.map(a => ({ label: `${a.name} - Rp ${Number(a.price).toLocaleString('id-ID')}`, value: a.id.toString() }))}
                                            placeholder="Pilih layanan tambahan..."
                                        />
                                    </div>
                                    <CustomButton
                                        type="button"
                                        variant="primary"
                                        onClick={handleAddAddon}
                                        disabled={!selectedAddonId}
                                        className="mb-[2px]"
                                    >
                                        Tambah
                                    </CustomButton>
                                </div>

                                {/* List Selected Addons */}
                                {createFormData.addonIds.length > 0 && (
                                    <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-slate-100 text-slate-700 font-bold">
                                                <tr>
                                                    <th className="px-4 py-2">Nama Layanan</th>
                                                    <th className="px-4 py-2 text-right">Harga</th>
                                                    <th className="px-4 py-2 text-center w-[50px]">Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200">
                                                {createFormData.addonIds.map((id, index) => {
                                                    const addon = addons.find(a => a.id.toString() === id);
                                                    if (!addon) return null;
                                                    return (
                                                        <tr key={`${id}-${index}`}>
                                                            <td className="px-4 py-2">{addon.name}</td>
                                                            <td className="px-4 py-2 text-right">Rp {Number(addon.price).toLocaleString('id-ID')}</td>
                                                            <td className="px-4 py-2 text-center">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveAddon(index)}
                                                                    className="text-red-500 hover:text-red-700"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Section 5: PPN & Pajak */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-2">
                                PPN & Pajak
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-6 rounded-xl border border-slate-100">
                                <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-700">Gunakan PPN</span>
                                        <span className="text-[10px] text-slate-500 tracking-tight uppercase font-semibold">Aktifkan pajak untuk pelanggan ini</span>
                                    </div>
                                    <CustomSwitch
                                        checked={createFormData.useTax}
                                        onChange={(checked) => setCreateFormData({ useTax: checked, taxId: checked ? createFormData.taxId : "" })}
                                    />
                                </div>
                                {createFormData.useTax && (
                                    <CustomSelect
                                        label="Pilih Aturan PPN"
                                        required={createFormData.useTax}
                                        value={createFormData.taxId}
                                        onChange={(val) => setCreateFormData({ taxId: val })}
                                        options={taxes.filter(t => t.isActive).map(t => ({ label: `${t.name} (${t.value}%)`, value: t.id.toString() }))}
                                        placeholder="Pilih Aturan Pajak"
                                    />
                                )}
                            </div>
                        </div>

                        {/* Section 6: Diskon & Total */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-2">
                                Ringkasan Biaya
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <CustomInput
                                    label="Subtotal Paket & Addon"
                                    value={`Rp ${(hargaPaket + totalAddonPrice).toLocaleString('id-ID')}`}
                                    disabled
                                    className="bg-slate-100 text-slate-600 font-bold"
                                />
                                <CustomCurrencyInput
                                    label="Potongan Diskon (Rp)"
                                    value={createFormData.diskon}
                                    onValueChange={(val) => setCreateFormData({ diskon: val })}
                                    placeholder="0"
                                />
                                <CustomInput
                                    label="Nilai PPN"
                                    value={createFormData.useTax && selectedTaxRate ? `Rp ${taxAmount.toLocaleString('id-ID')} (${selectedTaxRate.value}%)` : "Rp 0"}
                                    disabled
                                    className="bg-slate-100 text-slate-600 font-bold"
                                />
                                <CustomInput
                                    label="Total Per Bulan"
                                    value={`Rp ${totalBayarWithTax.toLocaleString('id-ID')}`}
                                    disabled
                                    className="bg-primary/5 text-primary font-black border-primary/20"
                                />
                            </div>
                        </div>

                        {/* Section 5: Informasi Penagihan & Tanggal */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-2">
                                Informasi Penagihan & Tanggal
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <CustomDatePicker
                                    label="Tanggal Aktif"
                                    value={createFormData.tanggalAktif}
                                    onChange={(val) => setCreateFormData({ tanggalAktif: val })}
                                />
                                <CustomDatePicker
                                    label="Tanggal Akhir / Jatuh Tempo"
                                    value={createFormData.tanggalAkhir}
                                    onChange={(val) => setCreateFormData({
                                        tanggalAkhir: val,
                                        tanggalToleransi: val
                                    })}
                                />
                            </div>
                        </div>

                        <div className="pt-6 flex justify-end gap-3 border-t border-slate-100">
                            <CustomButton
                                type="submit"
                                variant="primary"
                                disabled={loading || !createFormData.branchId || !createFormData.areaId || !createFormData.paketId || (createFormData.secretMode !== 'NONE' && !createFormData.pppUsername)}
                                className="px-8"
                            >
                                <Save size={18} />
                                Simpan Pelanggan
                            </CustomButton>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <ModalDetail
                isOpen={isPreviewModalOpen}
                onClose={() => setIsPreviewModalOpen(false)}
                title="Konfirmasi Data Pelanggan"
                variant="primary"
                confirmLabel="Ya, Simpan Sekarang"
                cancelLabel="Cek Lagi"
                loading={loading}
                onConfirm={handleConfirmSave}
                maxWidth="full"
            >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Kolom 1: Data Pribadi */}
                    <div className="space-y-6">
                        <InfoCard title="Data Pribadi Pelanggan">
                            <InfoRow label="ID Pelanggan" value={<span className="font-mono font-bold text-slate-700">{createFormData.idPelanggan || "(Auto)"}</span>} />
                            <InfoRow label="Nama Lengkap" value={createFormData.namaPelanggan} />
                            <InfoRow label="Identitas (KTP)" value={createFormData.identitasPelanggan} />
                            <InfoRow label="No. Telepon" value={createFormData.teleponPelanggan} />
                            <InfoRow label="Status" value="BARU" />
                            <InfoRow label="Alamat" value={createFormData.alamatPelanggan} className="col-span-2" />
                            <div className="col-span-2 grid grid-cols-2 gap-4 mt-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <InfoRow label="Latitude" value={createFormData.latitude || "-"} />
                                <InfoRow label="Longitude" value={createFormData.longitude || "-"} />
                            </div>
                        </InfoCard>
                    </div>

                    {/* Kolom 2: Data Teknis & Lokasi */}
                    <div className="space-y-6">
                        <InfoCard title="Data Teknis & Lokasi">
                            <InfoRow label="Cabang" value={selectedBranch?.namaBranch || "-"} />
                            <InfoRow label="Area / Wilayah" value={selectedArea?.namaArea || "-"} />
                            <InfoRow label="ODP" value={selectedOdp?.namaOdp || "-"} />
                            <InfoRow label="Port" value={createFormData.odpPortId ? `Port ${createFormData.odpPortId}` : "-"} />

                            <div className="col-span-2 my-1 border-t border-dashed border-slate-200" />

                            <InfoRow label="Username PPPoE" value={<span className="font-mono text-primary font-medium">{createFormData.pppUsername}</span>} />
                            <InfoRow label="Password PPPoE" value={<span className="font-mono text-slate-500">{createFormData.pppPassword}</span>} />
                        </InfoCard>
                    </div>

                    {/* Kolom 3: Layanan, Tagihan & Informasi */}
                    <div className="space-y-6">
                        <InfoCard title="Layanan, Tagihan & Informasi">
                            <InfoRow label="Paket Utama" value={selectedPacket?.namaPaket || "-"} />
                            <InfoRow label="Harga Paket" value={`Rp ${hargaPaket.toLocaleString('id-ID')}`} />

                            {createFormData.addonIds.length > 0 && (
                                <div className="col-span-2 space-y-2">
                                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Add-ons ({createFormData.addonIds.length})</span>
                                    <ul className="text-sm text-slate-600 space-y-1">
                                        {createFormData.addonIds.map(id => {
                                            const addon = addons.find(a => a.id.toString() === id);
                                            return addon ? <li key={id} className="flex justify-between"><span>{addon.name}</span> <span>+Rp {Number(addon.price).toLocaleString('id-ID')}</span></li> : null;
                                        })}
                                    </ul>
                                </div>
                            )}

                            <div className="col-span-2 my-1 border-t border-dashed border-slate-200" />

                            <InfoRow
                                label="Diskon & Promo"
                                value={diskonValue > 0 ? <span className="text-green-600 font-bold">- Rp {diskonValue.toLocaleString('id-ID')}</span> : "-"}
                            />

                            {createFormData.useTax && selectedTaxRate && (
                                <InfoRow
                                    label={`PPN (${selectedTaxRate.value}%)`}
                                    value={<span className="text-slate-700 font-bold">+ Rp {taxAmount.toLocaleString('id-ID')}</span>}
                                />
                            )}

                            <InfoRow
                                label="Total Bayar"
                                value={<span className="text-lg font-bold text-primary">Rp {totalBayarWithTax.toLocaleString('id-ID')}/bln</span>}
                                className="col-span-2"
                            />

                            <div className="col-span-2 my-1 border-t border-dashed border-slate-200" />

                            <InfoRow label="Tanggal Aktif" value={createFormData.tanggalAktif ? new Date(createFormData.tanggalAktif).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : "-"} />
                            <InfoRow label="Jatuh Tempo" value={createFormData.tanggalAkhir ? new Date(createFormData.tanggalAkhir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : "-"} />
                        </InfoCard>
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

            {/* Secrets Search Modal */}
            {isSecretsModalOpen && createPortal(
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => { setIsSecretsModalOpen(false); setSecretsSearch(""); }} />
                    <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-200">
                        {/* Header with Search */}
                        <div className="px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between shrink-0">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Pilih Secret PPPoE</h3>
                                <p className="text-xs text-slate-500">Daftar secret yang tersedia di MikroTik dan belum digunakan</p>
                            </div>
                            <div className="flex items-center gap-3">
                                {/* Search Input */}
                                <div className="relative">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Cari username/profile..."
                                        className="h-9 pl-9 pr-4 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 w-[200px]"
                                        value={secretsSearch}
                                        onChange={(e) => setSecretsSearch(e.target.value)}
                                    />
                                </div>
                                <button
                                    className="h-8 w-8 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                                    onClick={() => { setIsSecretsModalOpen(false); setSecretsSearch(""); }}
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto">
                            {secretsLoading ? (
                                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                    <Loader2 size={32} className="animate-spin mb-3" />
                                    <p className="text-sm">Mengambil data dari MikroTik...</p>
                                </div>
                            ) : secretsError ? (
                                <div className="p-6">
                                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                                        <p className="text-sm text-red-600 font-medium">{secretsError}</p>
                                    </div>
                                </div>
                            ) : (availableSecrets?.length || 0) === 0 ? (
                                <div className="text-center py-12 text-slate-400">
                                    <Search size={48} className="mx-auto mb-3 opacity-50" />
                                    <p className="text-sm font-medium">Tidak ada secret yang tersedia</p>
                                    <p className="text-xs">Semua secret dengan profile ini sudah digunakan</p>
                                </div>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 sticky top-0">
                                        <tr className="border-b border-slate-200">
                                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Username</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Password</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Profile</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Service</th>
                                            <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wider w-[100px]">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredSecrets.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                                                    <p className="text-sm">Tidak ada hasil untuk "{secretsSearch}"</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredSecrets.map((secret) => (
                                                <tr key={secret.id || secret.name} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <span className="font-mono font-semibold text-slate-700">{secret.name}</span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="font-mono text-slate-500">
                                                            {secret.password || <span className="text-slate-300 italic">-</span>}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-50 text-blue-600">{secret.profile}</span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-slate-600">{secret.service}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <button
                                                            type="button"
                                                            className="px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                                                            onClick={() => handleSelectSecret(secret)}
                                                        >
                                                            Pilih
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 shrink-0 flex items-center justify-between">
                            <p className="text-xs text-slate-500">
                                Menampilkan <strong>{filteredSecrets?.length || 0}</strong> dari <strong>{availableSecrets?.length || 0}</strong> secret
                            </p>
                            <button
                                type="button"
                                className="px-4 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                                onClick={() => { setIsSecretsModalOpen(false); setSecretsSearch(""); }}
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default CustomerCreatePage;
