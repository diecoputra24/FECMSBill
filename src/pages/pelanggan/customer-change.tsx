import React, { useState, useEffect, useMemo } from "react";
import { useCustomerStore } from "@/store/customerStore";
import { useBranchStore } from "@/store/branchStore";
import { useOdpStore } from "@/store/odpStore";
import { useAreaStore } from "@/store/areaStore";
import { useCustomerChangeStore } from "@/store/customerChangeStore";
import { useCustomerChangeRequestStore } from "@/store/customerChangeRequestStore";
import { CustomSelect } from "@/components/ui/custom-select";
import { CustomButton } from "@/components/ui/custom-button";
import { CustomSwitch, CustomTextArea } from "@/components/ui/custom-input";
import { CustomTable } from "@/components/ui/custom-table";
import { Badge } from "@/components/ui/badge";
import {
    Search,
    ChevronDown,
    ChevronUp,
    RefreshCw,
    Loader2,
    Save,
    User,
    MapPin,
    Phone,
    FileText,
    ArrowRight,
    Send
} from "lucide-react";
import { ModalMessage } from "@/components/ui/modal-message";
import { ModalLoading } from "@/components/ui/modal-loading";
import { ModalConfirm } from "@/components/ui/modal-confirm";
import { ModalDetail } from "@/components/ui/modal-detail";
import { useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { MapPicker } from "@/components/ui/map-picker";

// Helper Components
const InfoCard = ({ title, children, className, status, collapsible, isCollapsed, onToggle }: { title: string; children: React.ReactNode; className?: string; status?: React.ReactNode; collapsible?: boolean; isCollapsed?: boolean; onToggle?: () => void }) => (
    <div className={cn("rounded-lg overflow-hidden flex flex-col bg-white border border-slate-100 transition-all duration-300", className)}>
        <div className="bg-slate-50 px-5 py-1.5 border-b border-slate-100 flex justify-between items-center">
            <h4 className="font-bold text-slate-700 text-[12px] uppercase tracking-wider">
                {title}
            </h4>
            <div className="flex items-center gap-2">
                {status}
                {collapsible && (
                    <button
                        onClick={onToggle}
                        className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-white rounded-sm transition-all border border-transparent hover:border-slate-200"
                    >
                        {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                    </button>
                )}
            </div>
        </div>
        <div className={cn(
            "p-6 bg-white transition-all duration-300 origin-top overflow-hidden",
            isCollapsed ? "h-0 p-0 opacity-0" : "h-auto opacity-100"
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

const FormField = ({ label, icon: Icon, children }: { label: string; icon?: React.ComponentType<{ size?: number; className?: string }>; children: React.ReactNode }) => (
    <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter flex items-center gap-1.5">
            {Icon && <Icon size={12} className="text-slate-400" />}
            {label}
        </label>
        {children}
    </div>
);

// New Component for comparison in modal
const ChangeItem = ({ label, oldValue, newValue, icon: Icon }: { label: string; oldValue: string; newValue: string; icon?: React.ComponentType<{ size?: number; className?: string }> }) => {
    const hasChange = oldValue !== newValue;
    if (!hasChange) return null;

    return (
        <div className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0 text-left">
            {Icon && <Icon size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />}
            <div className="flex-1 min-w-0">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">{label}</p>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-red-500 line-through truncate max-w-[150px]">{oldValue || "-"}</span>
                    <ArrowRight size={12} className="text-slate-300 flex-shrink-0" />
                    <span className="text-xs text-green-600 font-bold truncate max-w-[150px]">{newValue || "-"}</span>
                </div>
            </div>
        </div>
    );
};

const CustomerChangePage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const customerIdFromQuery = searchParams.get("id");

    const { customers, fetchCustomers } = useCustomerStore();
    const { branches, fetchBranches } = useBranchStore();
    const { areas, fetchAreas } = useAreaStore();
    const { odps, fetchOdps } = useOdpStore();

    const {
        filterValues,
        selectedCustomer,
        isInfoCollapsed,
        formData,
        setFilterValues,
        setSelectedCustomer,
        setIsInfoCollapsed,
        setFormData,
        resetFormData
    } = useCustomerChangeStore();

    const [loading, setLoading] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isAddressSyncing, setIsAddressSyncing] = useState(false);
    const [autoAddress, setAutoAddress] = useState(false);
    const [requestNote, setRequestNote] = useState("");

    // Modal states
    const [showMessage, setShowMessage] = useState({ show: false, title: "", message: "", type: "success" as any });
    const [showLoading, setShowLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);

    const searchOptions = [
        { value: "idPelanggan", label: "IdPel" },
        { value: "namaPelanggan", label: "NamaPel" },
        { value: "teleponPelanggan", label: "Telepon" },
    ];

    useEffect(() => {
        fetchCustomers();
        fetchBranches();
        fetchAreas();
        fetchOdps();
    }, []);

    // Handle customer ID from query params
    useEffect(() => {
        if (customerIdFromQuery && customers.length > 0) {
            const customer = customers.find(c => c.id.toString() === customerIdFromQuery);
            if (customer) {
                setSelectedCustomer(customer);
                initFormData(customer);
            }
        }
    }, [customerIdFromQuery, customers]);

    // Initialize form data when customer is selected
    const initFormData = (customer: any) => {
        setFormData({
            namaPelanggan: customer.namaPelanggan || "",
            alamatPelanggan: customer.alamatPelanggan || "",
            teleponPelanggan: customer.teleponPelanggan || "",
            identitasPelanggan: customer.identitasPelanggan || "",
            areaId: customer.areaId?.toString() || "",
            odpId: customer.odpId?.toString() || "",
            odpPortId: customer.odpPortId?.toString() || "",
            latitude: customer.latitude?.toString() || "",
            longitude: customer.longitude?.toString() || ""
        });
    };

    // Filter areas by selected branch
    const filteredAreas = useMemo(() => {
        if (!selectedCustomer) return areas;
        const customerBranchId = selectedCustomer.area?.branchId;
        if (customerBranchId) {
            return areas.filter(a => a.branchId === customerBranchId);
        }
        return areas;
    }, [selectedCustomer, areas]);

    // Filter ODPs by selected area
    const filteredOdps = useMemo(() => {
        if (!formData?.areaId) return [];
        return odps.filter(o => o.areaId === parseInt(formData.areaId));
    }, [formData?.areaId, odps]);

    // State for multiple search results
    const [searchResults, setSearchResults] = useState<typeof customers>([]);

    const handleSearch = () => {
        if (!filterValues.branchId && filterValues.branchId !== "all") return;

        const results = customers.filter(c => {
            if (filterValues.branchId && filterValues.branchId !== "all") {
                if (c.area?.branchId.toString() !== filterValues.branchId) {
                    return false;
                }
            }

            const searchValue = filterValues.searchValue.toLowerCase();
            if (filterValues.searchType === "idPelanggan") {
                return c.idPelanggan.toLowerCase() === searchValue;
            }
            if (filterValues.searchType === "namaPelanggan") {
                return c.namaPelanggan.toLowerCase().includes(searchValue);
            }
            if (filterValues.searchType === "teleponPelanggan") {
                return c.teleponPelanggan.includes(searchValue);
            }
            return false;
        });

        if (results.length === 1) {
            setSelectedCustomer(results[0]);
            initFormData(results[0]);
            setSearchResults([]);
        } else if (results.length > 1) {
            setSearchResults(results);
            setSelectedCustomer(null);
            resetFormData();
        } else {
            setSearchResults([]);
            setSelectedCustomer(null);
            resetFormData();
        }
    };

    const handleSelectFromResults = (customer: typeof customers[0]) => {
        setSelectedCustomer(customer);
        initFormData(customer);
        setSearchResults([]);
    };

    const hasChanges = useMemo(() => {
        if (!selectedCustomer || !formData) return false;
        return (
            formData.namaPelanggan !== (selectedCustomer.namaPelanggan || "") ||
            formData.alamatPelanggan !== (selectedCustomer.alamatPelanggan || "") ||
            formData.teleponPelanggan !== (selectedCustomer.teleponPelanggan || "") ||
            formData.identitasPelanggan !== (selectedCustomer.identitasPelanggan || "") ||
            formData.areaId !== (selectedCustomer.areaId?.toString() || "") ||
            formData.odpId !== (selectedCustomer.odpId?.toString() || "") ||
            formData.odpPortId !== (selectedCustomer.odpPortId?.toString() || "") ||
            formData.latitude !== (selectedCustomer.latitude?.toString() || "") ||
            formData.longitude !== (selectedCustomer.longitude?.toString() || "")
        );
    }, [selectedCustomer, formData]);

    const handleSubmitRequest = async () => {
        if (!selectedCustomer || !formData || !hasChanges) return;

        setLoading(true);
        setShowLoading(true);
        try {
            await useCustomerChangeRequestStore.getState().createRequest({
                customerId: selectedCustomer.id,
                // Current values
                currentNama: selectedCustomer.namaPelanggan,
                currentAlamat: selectedCustomer.alamatPelanggan,
                currentTelepon: selectedCustomer.teleponPelanggan,
                currentIdentitas: selectedCustomer.identitasPelanggan,
                currentAreaId: selectedCustomer.areaId,
                currentOdpId: selectedCustomer.odpId || undefined,
                currentOdpPortId: selectedCustomer.odpPortId || undefined,
                currentLatitude: selectedCustomer.latitude || undefined,
                currentLongitude: selectedCustomer.longitude || undefined,
                // New values
                newNama: formData.namaPelanggan,
                newAlamat: formData.alamatPelanggan,
                newTelepon: formData.teleponPelanggan,
                newIdentitas: formData.identitasPelanggan,
                newAreaId: parseInt(formData.areaId),
                newOdpId: formData.odpId ? parseInt(formData.odpId) : undefined,
                newOdpPortId: formData.odpPortId ? parseInt(formData.odpPortId) : undefined,
                newLatitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
                newLongitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
                requestNote: requestNote
            });

            setShowMessage({
                show: true,
                title: "Request Terkirim!",
                message: `Request perubahan data untuk pelanggan ${selectedCustomer?.namaPelanggan} berhasil dikirim dan menunggu persetujuan.`,
                type: "success"
            });
            setShowPreviewModal(false);
            setRequestNote("");
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || error.message;
            setShowMessage({
                show: true,
                title: "Gagal",
                message: errorMsg,
                type: "error"
            });
        } finally {
            setLoading(false);
            setShowLoading(false);
        }
    };

    const getAreaName = (areaId: string | number) => {
        if (!areaId) return "-";
        return areas.find(a => a.id.toString() === areaId.toString())?.namaArea || "-";
    };

    const getOdpName = (odpId: string | number) => {
        if (!odpId) return "-";
        return odps.find(o => o.id.toString() === odpId.toString())?.namaOdp || "-";
    };

    return (
        <div className="space-y-4 pb-20">
            {/* Header / Filter Section */}
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
                                        <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 overflow-hidden py-0 animate-in fade-in zoom-in-95 duration-100 flex flex-col">
                                            {searchOptions.map((option) => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => {
                                                        setFilterValues({ ...filterValues, searchType: option.value });
                                                        setIsDropdownOpen(false);
                                                    }}
                                                    className={cn(
                                                        "w-full text-left px-3 py-2 text-[11px] font-bold transition-colors",
                                                        filterValues.searchType === option.value
                                                            ? "bg-primary text-white"
                                                            : "text-slate-700 hover:bg-slate-50"
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
                                    className="w-full h-10 bg-white border border-slate-200 border-r-0 px-4 text-sm text-slate-700 outline-none focus:ring-1 focus:ring-slate-300 focus:border-slate-300 transition-all placeholder:text-slate-300 placeholder:font-normal tracking-tight"
                                    placeholder="Kata Kunci..."
                                    value={filterValues.searchValue}
                                    onChange={(e) => setFilterValues({ ...filterValues, searchValue: e.target.value })}
                                />
                            </div>
                            <button
                                onClick={handleSearch}
                                className="w-12 h-10 bg-primary text-white rounded-r-lg flex items-center justify-center hover:bg-primary/90 transition-colors shadow-sm"
                                title="Cari Data"
                            >
                                <Search size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search Results Table - shown when multiple customers found */}
            {searchResults.length > 1 && !selectedCustomer && (
                <div className="bg-white rounded-lg border border-slate-100 overflow-hidden">
                    <div className="bg-amber-50 px-5 py-2 border-b border-amber-100">
                        <h4 className="font-bold text-amber-700 text-[12px] uppercase tracking-wider">
                            Ditemukan {searchResults.length} Pelanggan - Pilih salah satu
                        </h4>
                    </div>
                    <CustomTable
                        data={searchResults}
                        onRowClick={handleSelectFromResults}
                        columns={[
                            { header: "ID PELANGGAN", render: (row) => <span className="font-mono font-bold text-primary">{row.idPelanggan}</span> },
                            { header: "NAMA PELANGGAN", render: (row) => <span className="font-bold">{row.namaPelanggan}</span> },
                            { header: "TELEPON", render: (row) => row.teleponPelanggan || "-" },
                            { header: "CABANG", render: (row) => branches.find(b => b.id === row.area?.branchId)?.namaBranch || "-" },
                            { header: "AREA", render: (row) => row.area?.namaArea || "-" },
                        ]}
                    />
                </div>
            )}

            {selectedCustomer && formData ? (
                <>
                    <InfoCard
                        title="PERUBAHAN DATA PELANGGAN"
                        collapsible
                        isCollapsed={isInfoCollapsed}
                        onToggle={() => setIsInfoCollapsed(!isInfoCollapsed)}
                        status={
                            <div className="flex gap-2">
                                <div
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        fetchCustomers(true);
                                    }}
                                    className="w-6 h-6 rounded-sm bg-primary text-white flex items-center justify-center shadow-sm cursor-pointer hover:bg-primary/90 transition-all"
                                    title="Refresh Data"
                                >
                                    <RefreshCw size={12} />
                                </div>
                                <Badge variant={selectedCustomer.statusPelanggan === 'AKTIF' ? 'success' : 'destructive'} className="font-bold text-[9px] uppercase h-6 px-2 rounded-sm flex items-center gap-1">
                                    <div className="w-1 h-1 bg-white rounded-full animate-pulse" />
                                    {selectedCustomer.statusPelanggan}
                                </Badge>
                            </div>
                        }
                    >
                        {/* Current Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-12 mb-8">
                            <InfoRow label="ID Pelanggan" value={selectedCustomer.idPelanggan} />
                            <InfoRow label="Nama Lengkap" value={selectedCustomer.namaPelanggan} />
                            <InfoRow label="Regional / Cabang" value={branches.find(b => b.id === selectedCustomer.area?.branchId)?.namaBranch} />
                        </div>

                        {/* Edit Form */}
                        <div className="border-t border-slate-100 -mx-6">
                            <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100">
                                <h5 className="font-bold text-slate-700 text-[12px] uppercase tracking-wider">Form Perubahan Data</h5>
                            </div>

                            <div className="p-6">
                                {/* Section: Data Pribadi */}
                                <div className="space-y-6 mb-8">
                                    <h6 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">Data Pribadi</h6>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField label="Nama Pelanggan" icon={User}>
                                            <input
                                                type="text"
                                                className="w-full h-10 bg-white border border-slate-200 rounded-lg px-4 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                value={formData.namaPelanggan}
                                                onChange={(e) => setFormData({ ...formData, namaPelanggan: e.target.value.toUpperCase() })}
                                            />
                                        </FormField>

                                        <FormField label="NIK / Identitas" icon={FileText}>
                                            <input
                                                type="text"
                                                className="w-full h-10 bg-white border border-slate-200 rounded-lg px-4 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                value={formData.identitasPelanggan}
                                                onChange={(e) => setFormData({ ...formData, identitasPelanggan: e.target.value })}
                                            />
                                        </FormField>

                                        <FormField label="Nomor Telepon" icon={Phone}>
                                            <input
                                                type="text"
                                                className="w-full h-10 bg-white border border-slate-200 rounded-lg px-4 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                value={formData.teleponPelanggan}
                                                onChange={(e) => setFormData({ ...formData, teleponPelanggan: e.target.value })}
                                            />
                                        </FormField>
                                    </div>
                                </div>

                                {/* Section: Lokasi & Alamat - 2 Column Layout */}
                                <div className="space-y-6 mb-8">
                                    <h6 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">Lokasi & Alamat</h6>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* Kolom Kiri: Koordinat + Peta */}
                                        <div className="space-y-3">
                                            {/* Lat/Lng Inputs */}
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Latitude</label>
                                                    <input
                                                        type="text"
                                                        value={formData.latitude}
                                                        onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                                                        placeholder="-6.123456"
                                                        className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Longitude</label>
                                                    <input
                                                        type="text"
                                                        value={formData.longitude}
                                                        onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                                                        placeholder="106.123456"
                                                        className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                                                    />
                                                </div>
                                            </div>

                                            {/* Map Picker - Interactive */}
                                            <div className="h-[240px] rounded-xl overflow-hidden border border-slate-200">
                                                <MapPicker
                                                    lat={formData.latitude}
                                                    lng={formData.longitude}
                                                    autoAddress={autoAddress}
                                                    onSyncChange={setIsAddressSyncing}
                                                    onLocationSelect={(lat, lng, address) => {
                                                        const updates: any = { ...formData, latitude: lat, longitude: lng };
                                                        if (autoAddress && address) {
                                                            updates.alamatPelanggan = address;
                                                        }
                                                        setFormData(updates);
                                                    }}
                                                />
                                            </div>

                                            {/* Google Maps Link */}
                                            {formData.latitude && formData.longitude && (
                                                <a
                                                    href={`https://www.google.com/maps?q=${formData.latitude},${formData.longitude}`}
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
                                                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                                                    <MapPin size={12} className="text-slate-400" />
                                                    Alamat Pemasangan
                                                </label>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] text-slate-400">Auto dari Peta</span>
                                                    <CustomSwitch
                                                        checked={autoAddress}
                                                        onChange={(checked) => setAutoAddress(checked)}
                                                    />
                                                </div>
                                            </div>
                                            <textarea
                                                value={isAddressSyncing ? "Syncing address..." : formData.alamatPelanggan}
                                                onChange={(e) => setFormData({ ...formData, alamatPelanggan: e.target.value })}
                                                placeholder={autoAddress ? "Alamat akan terisi otomatis dari peta..." : "Alamat lengkap pemasangan..."}
                                                disabled={autoAddress || isAddressSyncing}
                                                className={`w-full min-h-[200px] px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all resize-none ${autoAddress || isAddressSyncing ? "bg-slate-50 text-slate-500 italic" : ""}`}
                                            />

                                            {autoAddress && (
                                                <p className="text-[10px] text-amber-600 italic">
                                                    ✓ Alamat akan diisi otomatis saat Anda memilih lokasi di peta.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Section: Data Teknis */}
                                <div className="space-y-6 mb-8">
                                    <h6 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">Data Teknis</h6>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <FormField label="Area">
                                            <CustomSelect
                                                placeholder="Pilih Area"
                                                value={formData.areaId}
                                                options={filteredAreas.map(a => ({ label: a.namaArea, value: a.id.toString() }))}
                                                onChange={(val) => setFormData({ ...formData, areaId: val, odpId: "", odpPortId: "" })}
                                            />
                                        </FormField>

                                        <FormField label="ODP">
                                            <CustomSelect
                                                placeholder="Pilih ODP"
                                                value={formData.odpId}
                                                options={filteredOdps.map(o => ({ label: `${o.namaOdp} (${o.portOdp} port)`, value: o.id.toString() }))}
                                                onChange={(val) => setFormData({ ...formData, odpId: val })}
                                            />
                                        </FormField>

                                        <FormField label="Port ODP">
                                            <input
                                                type="number"
                                                className="w-full h-10 bg-white border border-slate-200 rounded-lg px-4 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                value={formData.odpPortId}
                                                onChange={(e) => setFormData({ ...formData, odpPortId: e.target.value })}
                                                placeholder="Nomor Port"
                                            />
                                        </FormField>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <div className="pt-6 border-t border-slate-100">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            {hasChanges && (
                                                <Badge variant="warning" className="text-[10px] uppercase">
                                                    Ada perubahan yang belum disimpan
                                                </Badge>
                                            )}
                                        </div>
                                        <CustomButton
                                            onClick={() => setShowPreviewModal(true)}
                                            disabled={!hasChanges || loading}
                                            className="h-11 px-6 rounded-lg font-bold shadow-md"
                                        >
                                            {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save size={16} className="mr-2" />}
                                            Ajukan Perubahan Data
                                        </CustomButton>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </InfoCard>
                </>
            ) : (
                <div className="min-h-[400px]" />
            )}

            {/* Preview and Note Modal */}
            <ModalDetail
                isOpen={showPreviewModal}
                onClose={() => setShowPreviewModal(false)}
                title="Review Perubahan Data"
                maxWidth="md"
                showFooter={false}
            >
                <div className="space-y-6 py-2">
                    {selectedCustomer && (
                        <>
                            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ID PELANGGAN</span>
                                        <span className="text-sm font-bold text-primary">{selectedCustomer.idPelanggan}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">NAMA PELANGGAN</span>
                                        <span className="text-sm font-bold text-slate-800">{selectedCustomer.namaPelanggan}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1 max-h-[300px] overflow-y-auto pr-2">
                                <ChangeItem label="Nama Pelanggan" icon={User} oldValue={selectedCustomer.namaPelanggan} newValue={formData.namaPelanggan} />
                                <ChangeItem label="Alamat" icon={MapPin} oldValue={selectedCustomer.alamatPelanggan} newValue={formData.alamatPelanggan} />
                                <ChangeItem label="Telepon" icon={Phone} oldValue={selectedCustomer.teleponPelanggan} newValue={formData.teleponPelanggan} />
                                <ChangeItem label="NIK / Identitas" icon={FileText} oldValue={selectedCustomer.identitasPelanggan} newValue={formData.identitasPelanggan} />
                                <ChangeItem label="Area" oldValue={getAreaName(selectedCustomer.areaId)} newValue={getAreaName(formData.areaId)} />
                                <ChangeItem label="ODP" oldValue={getOdpName(selectedCustomer.odpId)} newValue={getOdpName(formData.odpId)} />
                                <ChangeItem label="Port ODP" oldValue={selectedCustomer.odpPortId?.toString() || "-"} newValue={formData.odpPortId?.toString() || "-"} />
                                <ChangeItem label="Latitude" oldValue={selectedCustomer.latitude?.toString() || "-"} newValue={formData.latitude?.toString() || "-"} />
                                <ChangeItem label="Longitude" oldValue={selectedCustomer.longitude?.toString() || "-"} newValue={formData.longitude?.toString() || "-"} />
                            </div>

                            <div className="pt-4 border-t border-slate-100 space-y-3">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Catatan Pemohon:</label>
                                <CustomTextArea
                                    placeholder="Berikan alasan atau keterangan perubahan data ini..."
                                    value={requestNote}
                                    onChange={(e) => setRequestNote(e.target.value)}
                                    rows={3}
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                                <CustomButton variant="ghost" onClick={() => setShowPreviewModal(false)}>Batal</CustomButton>
                                <CustomButton
                                    variant="primary"
                                    onClick={() => setShowConfirm(true)}
                                    disabled={!requestNote.trim()}
                                >
                                    <Send size={14} className="mr-2" />
                                    Kirim Request
                                </CustomButton>
                            </div>
                        </>
                    )}
                </div>
            </ModalDetail>

            <ModalLoading isOpen={showLoading} message="Sedang mengirim request perubahan data..." />

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
                title="Konfirmasi Request Perubahan"
                message={`Apakah Anda yakin ingin mengajukan perubahan data pelanggan "${selectedCustomer?.namaPelanggan}"? Request ini akan menunggu persetujuan terlebih dahulu sebelum diterapkan.`}
                confirmLabel="Ya, Ajukan Request"
                cancelLabel="Batal"
            />
        </div>
    );
};

export default CustomerChangePage;
