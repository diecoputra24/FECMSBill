import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useCustomerStore } from "@/store/customerStore";
import { usePackageStore } from "@/store/packageStore";
import { useBranchStore } from "@/store/branchStore";
import { useConnectionChangeStore } from "@/store/connectionChangeStore";
import { useConnectionChangeRequestStore } from "@/store/connectionChangeRequestStore";
import { CustomSelect } from "@/components/ui/custom-select";
import { CustomButton } from "@/components/ui/custom-button";
import { CustomTable } from "@/components/ui/custom-table";
import { CustomInput } from "@/components/ui/custom-input";
import { Badge } from "@/components/ui/badge";
import {
    Search,
    ChevronDown,
    ChevronUp,
    RefreshCw,
    Loader2,
    Save,
    Activity,
    Lock,
    User as UserIcon,
    Globe,
    X,
    UserCircle,
    Server,
    Layout
} from "lucide-react";
import { ModalMessage } from "@/components/ui/modal-message";
import { ModalLoading } from "@/components/ui/modal-loading";
import { ModalConfirm } from "@/components/ui/modal-confirm";
import { useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

// Helper Components
const InfoCard = ({ title, children, className, icon: Icon, status, collapsible, isCollapsed, onToggle }: { title: string; children: React.ReactNode; className?: string; icon?: any; status?: React.ReactNode; collapsible?: boolean; isCollapsed?: boolean; onToggle?: () => void }) => (
    <div className={cn("rounded-xl flex flex-col bg-white border border-slate-200/60 transition-all duration-300 shadow-sm", !isCollapsed && "overflow-visible", isCollapsed && "overflow-hidden", className)}>
        <div className="bg-slate-50/50 px-5 py-2.5 border-b border-slate-200/60 flex justify-between items-center">
            <div className="flex items-center gap-2.5">
                {Icon && <Icon size={16} className="text-primary/70" />}
                <h4 className="font-bold text-slate-700 text-[12px] uppercase tracking-wider">
                    {title}
                </h4>
            </div>
            <div className="flex items-center gap-2">
                {status}
                {collapsible && (
                    <button
                        onClick={onToggle}
                        className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-white rounded-md transition-all border border-transparent hover:border-slate-200"
                    >
                        {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                    </button>
                )}
            </div>
        </div>
        <div className={cn(
            "p-5 bg-white transition-all duration-300 origin-top",
            isCollapsed ? "h-0 p-0 opacity-0 overflow-hidden" : "h-auto opacity-100 overflow-visible"
        )}>
            {children}
        </div>
    </div>
);

const InfoRow = ({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) => (
    <div className={cn("flex flex-col gap-1", className)}>
        <span className="text-[10px] text-slate-500 uppercase tracking-widest">{label}</span>
        <div className="text-[13px] text-slate-700 leading-relaxed font-normal">
            {value || "-"}
        </div>
    </div>
);

const ConnectionChangePage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const customerIdFromQuery = searchParams.get("id");

    const { customers, connections, fetchCustomers, fetchConnections } = useCustomerStore();
    const { fetchPackages } = usePackageStore();
    const { branches, fetchBranches } = useBranchStore();

    const {
        filterValues,
        selectedCustomer,
        formData,
        isInfoCollapsed,
        setFilterValues,
        setSelectedCustomer,
        setFormData,
        setIsInfoCollapsed,
        resetFormData
    } = useConnectionChangeStore();

    const [loading, setLoading] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchResults, setSearchResults] = useState<typeof customers>([]);

    // Modal states
    const [showMessage, setShowMessage] = useState({ show: false, title: "", message: "", type: "success" as any });
    const [showLoading, setShowLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // Secrets Search Modal State
    const [isSecretsModalOpen, setIsSecretsModalOpen] = useState(false);
    const [availableSecrets, setAvailableSecrets] = useState<any[]>([]);
    const [secretsLoading, setSecretsLoading] = useState(false);
    const [secretsError, setSecretsError] = useState<string | null>(null);
    const [secretsSearch, setSecretsSearch] = useState("");

    const searchOptions = [
        { value: "idPelanggan", label: "IdPel" },
        { value: "pppUsername", label: "PPPUser" },
        { value: "namaPelanggan", label: "NamaPel" },
    ];

    useEffect(() => {
        fetchCustomers();
        fetchConnections();
        fetchPackages();
        fetchBranches();
    }, []);

    useEffect(() => {
        if (customerIdFromQuery && customers.length > 0) {
            const customer = customers.find(c => c.id.toString() === customerIdFromQuery);
            if (customer) {
                setSelectedCustomer(customer);
            }
        }
    }, [customerIdFromQuery, customers, setSelectedCustomer]);

    const currentConnection = useMemo(() => {
        if (!selectedCustomer) return null;
        return connections.find(conn => conn.pelangganId === selectedCustomer.id);
    }, [selectedCustomer, connections]);

    useEffect(() => {
        if (currentConnection && !formData) {
            setFormData({
                pppUsername: currentConnection.pppUsername || "",
                pppPassword: currentConnection.pppPassword || "",
                pppService: currentConnection.pppService || "pppoe",
                secretMode: currentConnection.secretMode || "EXISTING"
            });
        }
    }, [currentConnection, formData, setFormData]);

    const handleSearch = () => {
        if (!filterValues.branchId && filterValues.branchId !== "all") return;

        const results = customers.filter(c => {
            if (filterValues.branchId && filterValues.branchId !== "all") {
                if (c.area?.branchId.toString() !== filterValues.branchId) return false;
            }

            const searchValue = filterValues.searchValue.toLowerCase();
            if (filterValues.searchType === "idPelanggan") return c.idPelanggan.toLowerCase() === searchValue;
            if (filterValues.searchType === "pppUsername") {
                const conn = connections.find(cn => cn.pelangganId === c.id);
                return conn?.pppUsername?.toLowerCase() === searchValue;
            }
            if (filterValues.searchType === "namaPelanggan") return c.namaPelanggan.toLowerCase().includes(searchValue);
            return false;
        });

        if (results.length === 1) {
            setSelectedCustomer(results[0]);
            setSearchResults([]);
        } else if (results.length > 1) {
            setSearchResults(results);
            setSelectedCustomer(null);
        } else {
            setSearchResults([]);
            setSelectedCustomer(null);
        }
    };

    const handleSelectFromResults = (customer: typeof customers[0]) => {
        setSelectedCustomer(customer);
        setSearchResults([]);
    };

    const fetchAvailableSecrets = async () => {
        if (!currentConnection?.paket) {
            setSecretsError("Data paket pelanggan tidak ditemukan.");
            setIsSecretsModalOpen(true);
            return;
        }

        const selectedPackage = currentConnection.paket;

        if (!selectedPackage.routerId) {
            setSecretsError("Paket tidak memiliki konfigurasi router. Salakan hubungi administrator.");
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

    const handleSelectSecret = (secret: any) => {
        if (!secret || !formData) return;
        setFormData({
            ...formData,
            pppUsername: secret.name,
            pppPassword: secret.password || "",
            pppService: secret.service || "pppoe"
        });
        setIsSecretsModalOpen(false);
        setSecretsSearch("");
    };

    const filteredSecrets = useMemo(() => {
        if (!availableSecrets) return [];
        return availableSecrets.filter(s =>
            s.name.toLowerCase().includes(secretsSearch.toLowerCase()) ||
            (s.comment && s.comment.toLowerCase().includes(secretsSearch.toLowerCase()))
        );
    }, [availableSecrets, secretsSearch]);

    const handleSubmitRequest = async () => {
        if (!selectedCustomer || !currentConnection || !formData) return;

        setLoading(true);
        setShowLoading(true);
        try {
            await useConnectionChangeRequestStore.getState().createRequest({
                connectionId: currentConnection.id,
                customerId: selectedCustomer.id,
                currentPppUsername: currentConnection.pppUsername || undefined,
                currentPppPassword: currentConnection.pppPassword || undefined,
                currentPppService: currentConnection.pppService || undefined,
                currentSecretMode: currentConnection.secretMode || undefined,
                currentPaketId: currentConnection.paketId || undefined,
                newPppUsername: formData.pppUsername,
                newPppPassword: formData.pppPassword,
                newPppService: formData.pppService,
                newSecretMode: formData.secretMode,
                newPaketId: currentConnection.paketId,
                requestNote: "Perubahan konfigurasi koneksi PPPoE",
            });

            resetFormData();
            setShowMessage({
                show: true,
                title: "Request Terkirim!",
                message: `Request perubahan koneksi untuk pelanggan ${selectedCustomer.namaPelanggan} berhasil dikirim dan menunggu persetujuan.`,
                type: "success"
            });
        } catch (error: any) {
            setShowMessage({
                show: true,
                title: "Gagal",
                message: error.response?.data?.message || error.message,
                type: "error"
            });
        } finally {
            setLoading(false);
            setShowLoading(false);
        }
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Search Section */}
            <div className="max-w-4xl">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="w-full md:w-64 space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter ml-1">Cabang</label>
                        <CustomSelect
                            placeholder="Pilih Regional"
                            value={filterValues.branchId}
                            options={[
                                { label: "Semua Cabang", value: "all" },
                                ...branches.map(b => ({ label: b.namaBranch, value: b.id.toString() }))
                            ]}
                            onChange={(val) => setFilterValues({ ...filterValues, branchId: val })}
                        />
                    </div>

                    <div className="flex-1 w-full space-y-1.5 relative z-20">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter ml-1">Cari Pelanggan</label>
                        <div className="flex gap-0 group relative">
                            <div className="w-[95px] flex-none relative">
                                <button
                                    type="button"
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="w-full h-10 bg-white border border-slate-200 border-r-0 rounded-l-lg px-2 text-[10px] font-black text-slate-600 outline-none hover:bg-slate-50 transition-all flex items-center justify-between"
                                >
                                    {searchOptions.find(o => o.value === filterValues.searchType)?.label}
                                    <ChevronDown size={14} className={cn("transition-transform duration-200", isDropdownOpen ? "rotate-180" : "")} />
                                </button>
                                {isDropdownOpen && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                                        <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 overflow-hidden py-0 flex flex-col">
                                            {searchOptions.map((option) => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => {
                                                        setFilterValues({ ...filterValues, searchType: option.value });
                                                        setIsDropdownOpen(false);
                                                    }}
                                                    className={cn(
                                                        "w-full text-left px-3 py-2 text-[11px] font-bold transition-colors",
                                                        filterValues.searchType === option.value ? "bg-primary text-white" : "text-slate-700 hover:bg-slate-50"
                                                    )}
                                                >
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    className="w-full h-10 bg-white border border-slate-200 border-r-0 px-4 text-sm text-slate-700 outline-none focus:ring-1 focus:ring-slate-300 transition-all placeholder:text-slate-300"
                                    placeholder="Kata Kunci..."
                                    value={filterValues.searchValue}
                                    onChange={(e) => setFilterValues({ ...filterValues, searchValue: e.target.value })}
                                />
                            </div>
                            <button
                                onClick={handleSearch}
                                className="w-12 h-10 bg-primary text-white rounded-r-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
                            >
                                <Search size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {searchResults.length > 1 && !selectedCustomer && (
                <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden shadow-sm">
                    <div className="bg-amber-50/50 px-5 py-2.5 border-b border-amber-100 flex items-center justify-between">
                        <h4 className="font-bold text-amber-700 text-[12px] uppercase tracking-wider flex items-center gap-2">
                            <Layout size={16} />
                            Ditemukan {searchResults.length} Pelanggan
                        </h4>
                    </div>
                    <CustomTable
                        data={searchResults}
                        onRowClick={handleSelectFromResults}
                        columns={[
                            { header: "ID PELANGGAN", render: (row) => <span className="font-mono font-bold text-primary">{row.idPelanggan}</span> },
                            { header: "NAMA PELANGGAN", render: (row) => <span className="font-bold">{row.namaPelanggan}</span> },
                            { header: "TELEPON", render: (row) => row.teleponPelanggan || "-" },
                            { header: "AREA", render: (row) => row.area?.namaArea || "-" },
                        ]}
                    />
                </div>
            )}

            {selectedCustomer && currentConnection && formData && (
                <div className="space-y-6">
                    {/* Profil Pelanggan Card */}
                    <InfoCard
                        title="Profil Pelanggan"
                        icon={UserCircle}
                        collapsible
                        isCollapsed={isInfoCollapsed}
                        onToggle={() => setIsInfoCollapsed(!isInfoCollapsed)}
                        status={
                            <Badge variant={selectedCustomer.statusPelanggan === 'AKTIF' ? 'success' : 'destructive'} className="font-bold text-[10px] uppercase px-3 h-6 rounded-full">
                                {selectedCustomer.statusPelanggan}
                            </Badge>
                        }
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-12">
                            <InfoRow label="ID Pelanggan" value={selectedCustomer.idPelanggan} />
                            <InfoRow label="Nama Lengkap" value={selectedCustomer.namaPelanggan} />
                            <InfoRow label="Regional / Cabang" value={branches.find(b => b.id === selectedCustomer.area?.branchId)?.namaBranch} />
                            <InfoRow label="Nomor Telepon" value={selectedCustomer.teleponPelanggan} />
                            <InfoRow label="Alamat Pemasangan" value={selectedCustomer.alamatPelanggan} />
                            <InfoRow label="NIK / Identitas" value={selectedCustomer.identitasPelanggan} />
                        </div>
                    </InfoCard>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Current Configuration Card */}
                        <InfoCard title="Konfigurasi Saat Ini" icon={Server}>
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <InfoRow label="PPP Username" value={<span className="font-mono break-all">{currentConnection.pppUsername || "-"}</span>} />
                                    <InfoRow label="PPP Password" value={<span className="font-mono break-all">{currentConnection.pppPassword || "-"}</span>} />
                                    <InfoRow label="PPP Service" value={<span className="text-primary font-black uppercase text-xs">{currentConnection.pppService || "pppoe"}</span>} />
                                    <InfoRow label="Secret Mode" value={<Badge variant="outline" className="text-[10px] font-black">{currentConnection.secretMode || "EXISTING"}</Badge>} />
                                </div>
                                <div className="pt-4 border-t border-slate-100">
                                    <InfoRow label="Paket Layanan" value={currentConnection.paket?.namaPaket || "-"} />
                                    <div className="text-[10px] text-slate-400 font-mono mt-1 uppercase tracking-tighter">{currentConnection.paket?.mikrotikProfile || "-"}</div>
                                </div>
                            </div>
                        </InfoCard>

                        {/* Input Change Card */}
                        <InfoCard title="Perubahan Koneksi Baru" icon={Activity} className="border-primary/20 shadow-primary/5">
                            <div className="space-y-6">
                                {/* Secret Mode Group */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Secret Mode</label>
                                    <div className="grid grid-cols-3 gap-1">
                                        {['NEW', 'EXISTING', 'NONE'].map((mode) => (
                                            <button
                                                key={mode}
                                                type="button"
                                                className={`h-9 text-[10px] font-bold rounded-lg border transition-all ${formData.secretMode === mode
                                                    ? 'bg-primary text-white border-primary shadow-sm'
                                                    : 'bg-white text-slate-600 border-slate-200 hover:border-primary/50'
                                                    }`}
                                                onClick={() => setFormData({
                                                    ...formData,
                                                    secretMode: mode,
                                                    pppUsername: mode === 'NONE' ? '' : formData.pppUsername,
                                                    pppPassword: mode === 'NONE' ? '' : formData.pppPassword
                                                })}
                                            >
                                                {mode}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {formData.secretMode !== 'NONE' && (
                                    <div className="space-y-4 pt-2">
                                        {formData.secretMode === 'EXISTING' ? (
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-1 gap-4">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                                            <UserIcon size={12} />
                                                            PPP Username
                                                        </label>
                                                        <div className="flex gap-1.5">
                                                            <input
                                                                type="text"
                                                                className="flex-1 h-9 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm font-bold text-slate-500 outline-none cursor-not-allowed"
                                                                value={formData.pppUsername}
                                                                placeholder="Klik pencarian..."
                                                                readOnly
                                                            />
                                                            <button
                                                                type="button"
                                                                className="h-9 w-9 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center shrink-0 shadow-sm"
                                                                onClick={fetchAvailableSecrets}
                                                            >
                                                                <Search size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <CustomInput
                                                        label="PPP Password"
                                                        value={formData.pppPassword}
                                                        placeholder="Otomatis"
                                                        disabled
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                                        <Globe size={12} />
                                                        PPP Service
                                                    </label>
                                                    <CustomSelect
                                                        value={formData.pppService}
                                                        disabled
                                                        options={[
                                                            { label: "PPPOE", value: "pppoe" },
                                                            { label: "ANY", value: "any" },
                                                            { label: "L2TP", value: "l2tp" },
                                                        ]}
                                                        onChange={() => { }}
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <CustomInput
                                                        label="Username Baru"
                                                        icon={<UserIcon size={14} />}
                                                        value={formData.pppUsername}
                                                        onChange={(e) => setFormData({ ...formData, pppUsername: e.target.value })}
                                                        placeholder="user_baru"
                                                    />
                                                    <CustomInput
                                                        label="Password Baru"
                                                        icon={<Lock size={14} />}
                                                        value={formData.pppPassword}
                                                        onChange={(e) => setFormData({ ...formData, pppPassword: e.target.value })}
                                                        placeholder="pass_baru"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                                        <Globe size={12} />
                                                        PPP Service
                                                    </label>
                                                    <CustomSelect
                                                        value={formData.pppService}
                                                        options={[
                                                            { label: "PPPOE", value: "pppoe" },
                                                            { label: "ANY", value: "any" },
                                                            { label: "L2TP", value: "l2tp" },
                                                        ]}
                                                        onChange={(val) => setFormData({ ...formData, pppService: val })}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {formData.secretMode === 'NONE' && (
                                    <div className="p-4 bg-amber-50 border border-amber-200/50 rounded-xl">
                                        <p className="text-[12px] text-amber-700 font-bold leading-relaxed italic">
                                            * Mode Tanpa Secret (NONE). Konfigurasi PPPoE saat ini akan dinonaktifkan di sistem MikroTik setelah request disetujui.
                                        </p>
                                    </div>
                                )}

                                <CustomButton
                                    onClick={() => setShowConfirm(true)}
                                    disabled={loading || (formData.secretMode !== 'NONE' && !formData.pppUsername)}
                                    className="w-full h-11 rounded-xl font-bold mt-2 bg-primary hover:bg-primary/90 transition-all active:scale-[0.98] shadow-sm"
                                >
                                    {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save size={18} className="mr-2" />}
                                    Ajukan Perubahan
                                </CustomButton>
                            </div>
                        </InfoCard>
                    </div>
                </div>
            )}

            <ModalLoading isOpen={showLoading} message="Sedang memproses pengajuan perubahan koneksi..." />

            <ModalMessage
                isOpen={showMessage.show}
                onClose={() => setShowMessage({ ...showMessage, show: false })}
                title={showMessage.title}
                message={showMessage.message}
                type={showMessage.type}
            />

            <ModalConfirm
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={() => {
                    setShowConfirm(false);
                    handleSubmitRequest();
                }}
                title="Konfirmasi Perubahan"
                message={`Apakah Anda yakin ingin mengajukan perubahan data koneksi untuk pelanggan "${selectedCustomer?.namaPelanggan}"?`}
                confirmLabel="Ya, Proses"
                cancelLabel="Batal"
            />

            {/* Secrets Search Modal */}
            {isSecretsModalOpen && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-200">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Cari Secret MikroTik</h3>
                                <p className="text-xs text-slate-500 font-medium">Memilih dari daftar secret yang tersedia dengan profile yang sama</p>
                            </div>
                            <button
                                onClick={() => { setIsSecretsModalOpen(false); setSecretsSearch(""); }}
                                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Search Bar */}
                        <div className="p-5 bg-slate-50/50 border-b border-slate-100 italic">
                            <div className="relative group">
                                <Search size={20} className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Ketik username atau keterangan..."
                                    className="w-full h-12 pl-11 pr-4 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none shadow-sm focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all"
                                    value={secretsSearch}
                                    onChange={(e) => setSecretsSearch(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto">
                            {secretsLoading ? (
                                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                                    <Loader2 size={40} className="animate-spin mb-4 text-primary" />
                                    <p className="text-sm font-bold">Menghubungi MikroTik...</p>
                                </div>
                            ) : secretsError ? (
                                <div className="p-8 text-center">
                                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-500 mb-4">
                                        <X size={24} />
                                    </div>
                                    <p className="text-sm text-red-600 font-bold max-w-sm mx-auto">{secretsError}</p>
                                </div>
                            ) : (availableSecrets?.length || 0) === 0 ? (
                                <div className="text-center py-20 text-slate-400">
                                    <Search size={56} className="mx-auto mb-4 opacity-20" />
                                    <p className="text-sm font-bold">Tidak ada data ditemukan</p>
                                    <p className="text-xs font-medium">Pastikan profile MikroTik sudah sesuai</p>
                                </div>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50/50 sticky top-0 z-10">
                                        <tr className="border-b border-slate-200">
                                            <th className="px-5 py-3.5 text-left text-[11px] font-black text-slate-500 uppercase tracking-widest">Username</th>
                                            <th className="px-5 py-3.5 text-left text-[11px] font-black text-slate-500 uppercase tracking-widest">Password</th>
                                            <th className="px-5 py-3.5 text-left text-[11px] font-black text-slate-500 uppercase tracking-widest">Profile</th>
                                            <th className="px-5 py-3.5 text-center text-[11px] font-black text-slate-500 uppercase tracking-widest w-[110px]">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredSecrets.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-5 py-12 text-center text-slate-400">
                                                    <p className="text-sm font-bold">Hasil untuk "{secretsSearch}" tidak ditemukan</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredSecrets.map((secret) => (
                                                <tr key={secret.id || secret.name} className="hover:bg-slate-50/80 transition-colors group">
                                                    <td className="px-5 py-4">
                                                        <span className="font-mono font-black text-slate-700">{secret.name}</span>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span className="font-mono text-slate-400 italic">
                                                            {secret.password || "-"}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <Badge variant="secondary" className="text-[10px] font-black px-2 py-0.5 rounded uppercase">
                                                            {secret.profile}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-5 py-4 text-center">
                                                        <button
                                                            type="button"
                                                            className="px-4 py-2 text-[11px] font-black bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm"
                                                            onClick={() => handleSelectSecret(secret)}
                                                        >
                                                            PILIH
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
                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">
                                Data: <strong>{filteredSecrets?.length || 0}</strong> / {availableSecrets?.length || 0}
                            </p>
                            <button
                                type="button"
                                className="px-5 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                                onClick={() => { setIsSecretsModalOpen(false); setSecretsSearch(""); }}
                            >
                                CLOSE
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default ConnectionChangePage;
