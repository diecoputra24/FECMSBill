import React, { useState, useEffect, useMemo } from "react";
import { useCustomerStore } from "@/store/customerStore";
import { usePackageStore } from "@/store/packageStore";
import { useBranchStore } from "@/store/branchStore";
import { useUpgradeStore } from "@/store/upgradeStore";
import { useUpgradeRequestStore } from "@/store/upgradeRequestStore";
import { CustomSelect } from "@/components/ui/custom-select";
import { CustomButton } from "@/components/ui/custom-button";
import { CustomTable } from "@/components/ui/custom-table";
import { CustomTextArea } from "@/components/ui/custom-input";
import { ModalDetail } from "@/components/ui/modal-detail";
import { Badge } from "@/components/ui/badge";
import {
    Search,
    ChevronDown,
    ChevronUp,
    RefreshCw,
    Loader2,
    Save,
    TrendingUp,
    TrendingDown,
    ArrowRight,
    ShoppingBag
} from "lucide-react";
import { ModalMessage } from "@/components/ui/modal-message";
import { ModalLoading } from "@/components/ui/modal-loading";

import { useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";

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

const UpgradePage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const customerIdFromQuery = searchParams.get("id");

    const { customers, connections, fetchCustomers, fetchConnections } = useCustomerStore();
    const { packages, fetchPackages } = usePackageStore();
    const { branches, fetchBranches } = useBranchStore();

    // Use Zustand store for persistent state
    const {
        filterValues,
        selectedCustomer,
        newPaketId,
        isInfoCollapsed,
        setFilterValues,
        setSelectedCustomer,
        setNewPaketId,
        setIsInfoCollapsed
    } = useUpgradeStore();

    const [loading, setLoading] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [requestNote, setRequestNote] = useState("");

    // Modal states
    const [showMessage, setShowMessage] = useState({ show: false, title: "", message: "", type: "success" as any });
    const [showLoading, setShowLoading] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

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

    // Handle customer ID from query params
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

    const currentPaket = currentConnection?.paket;

    const availablePackages = useMemo(() => {
        if (!selectedCustomer || !currentPaket) return [];
        return packages.filter(p => p.routerId === currentPaket.routerId && p.id !== currentPaket.id);
    }, [selectedCustomer, currentPaket, packages]);

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
            if (filterValues.searchType === "pppUsername") {
                const customerConnection = connections.find(conn => conn.pelangganId === c.id);
                return customerConnection?.pppUsername?.toLowerCase() === searchValue;
            }
            if (filterValues.searchType === "namaPelanggan") {
                return c.namaPelanggan.toLowerCase().includes(searchValue);
            }
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

    const handleUpdatePackage = async () => {
        if (!selectedCustomer || !newPaketId || !currentConnection || !currentPaket) return;

        setLoading(true);
        setShowLoading(true);
        try {
            // Create a request instead of directly updating
            await useUpgradeRequestStore.getState().createRequest({
                connectionId: currentConnection.id,
                customerId: selectedCustomer.id,
                currentPaketId: currentPaket.id,
                newPaketId: parseInt(newPaketId),
                requestNote,
                requestedBy: "Admin" // Should be dynamic from auth
            });

            setNewPaketId("");
            setRequestNote("");
            setShowMessage({
                show: true,
                title: "Request Terkirim!",
                message: `Request upgrade/downgrade untuk pelanggan ${selectedCustomer?.namaPelanggan} berhasil dikirim dan menunggu persetujuan.`,
                type: "success"
            });
            setShowPreview(false);
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


    const selectedNewPaket = packages.find(p => p.id.toString() === newPaketId);
    const priceDiff = (Number(selectedNewPaket?.hargaPaket) || 0) - (Number(currentPaket?.hargaPaket) || 0);


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

            {/* Search Results Table */}
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

            {selectedCustomer ? (
                <>
                    {/* Detail Information Card */}
                    <InfoCard
                        title="UPGRADE / DOWNGRADE PAKET"
                        collapsible
                        isCollapsed={isInfoCollapsed}
                        onToggle={() => setIsInfoCollapsed(!isInfoCollapsed)}
                        status={
                            <div className="flex gap-2">
                                <div
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        fetchConnections(true);
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-12">
                            <InfoRow label="ID Pelanggan" value={selectedCustomer.idPelanggan} />
                            <InfoRow label="Nama Lengkap" value={selectedCustomer.namaPelanggan} />
                            <InfoRow label="NIK / Identitas" value={selectedCustomer.identitasPelanggan} />

                            <InfoRow label="Nomor Telepon" value={selectedCustomer.teleponPelanggan} />
                            <InfoRow label="Alamat Pemasangan" value={selectedCustomer.alamatPelanggan} />
                            <InfoRow label="Regional / Cabang" value={branches.find(b => b.id === selectedCustomer.area?.branchId)?.namaBranch} />
                        </div>

                        <div className="mt-8 border-t border-slate-100 -mx-6">
                            <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100">
                                <h5 className="font-bold text-slate-700 text-[12px] uppercase tracking-wider">Konfigurasi Paket</h5>
                            </div>

                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Current Package */}
                                    <div className="space-y-4">
                                        <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Paket Saat Ini</div>
                                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-lg font-black text-slate-800">{currentPaket?.namaPaket || "-"}</span>
                                                <Badge variant="secondary" className="text-[9px] uppercase font-bold">{currentConnection?.pppService || "pppoe"}</Badge>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-slate-500">Harga</span>
                                                <span className="font-bold text-slate-700">Rp {Number(currentPaket?.hargaPaket || 0).toLocaleString('id-ID')}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-slate-500">Profile MikroTik</span>
                                                <span className="font-mono text-xs text-primary">{currentPaket?.mikrotikProfile || "-"}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-slate-500">PPP Username</span>
                                                <span className="font-mono text-xs text-primary font-bold">{currentConnection?.pppUsername || "-"}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* New Package Selection */}
                                    <div className="space-y-4">
                                        <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Paket Baru</div>
                                        <div className="space-y-4">
                                            <CustomSelect
                                                placeholder="Pilih paket baru..."
                                                value={newPaketId}
                                                options={availablePackages.map(p => ({
                                                    label: `${p.namaPaket} - Rp ${Number(p.hargaPaket).toLocaleString('id-ID')}`,
                                                    value: p.id.toString()
                                                }))}
                                                onChange={setNewPaketId}
                                            />

                                            {newPaketId && (
                                                <div className={cn(
                                                    "p-4 rounded-lg border animate-in zoom-in-95 duration-200",
                                                    priceDiff >= 0 ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"
                                                )}>
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className={cn(
                                                                "text-[10px] font-bold uppercase",
                                                                priceDiff >= 0 ? "text-green-600" : "text-amber-600"
                                                            )}>
                                                                {priceDiff >= 0 ? "Upgrade" : "Downgrade"}
                                                            </p>
                                                            <p className={cn(
                                                                "text-lg font-black",
                                                                priceDiff >= 0 ? "text-green-700" : "text-amber-700"
                                                            )}>
                                                                {priceDiff >= 0 ? "+" : ""}Rp {priceDiff.toLocaleString('id-ID')}
                                                            </p>
                                                        </div>
                                                        <div className={cn(
                                                            "w-10 h-10 rounded-full flex items-center justify-center",
                                                            priceDiff >= 0 ? "bg-green-200/50 text-green-600" : "bg-amber-200/50 text-amber-600"
                                                        )}>
                                                            {priceDiff >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="py-2">
                                                <CustomTextArea
                                                    label="Catatan Pemohon (Opsional)"
                                                    placeholder="Contoh: Permintaan pelanggan untuk upgrade kecepatan..."
                                                    value={requestNote}
                                                    onChange={(e) => setRequestNote(e.target.value)}
                                                    rows={3}
                                                />
                                            </div>

                                            <CustomButton
                                                onClick={() => setShowPreview(true)}
                                                disabled={!newPaketId || loading}
                                                className="w-full h-11 rounded-lg font-bold shadow-md"
                                            >
                                                {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save size={16} className="mr-2" />}
                                                Ajukan Perubahan Paket
                                            </CustomButton>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </InfoCard>
                </>
            ) : (
                <div className="min-h-[400px]" />
            )}

            <ModalLoading isOpen={showLoading} message="Sedang memperbarui paket dan sinkronisasi MikroTik..." />

            <ModalMessage
                isOpen={showMessage.show}
                onClose={() => setShowMessage({ ...showMessage, show: false })}
                title={showMessage.title}
                message={showMessage.message}
                type={showMessage.type}
            />

            {/* Preview Modal */}
            <ModalDetail
                isOpen={showPreview}
                onClose={() => setShowPreview(false)}
                title="Konfirmasi Request Perubahan"
                maxWidth="md"
                onConfirm={handleUpdatePackage}
                confirmLabel="Ya, Kirim Request"
                cancelLabel="Batal"
            >
                <div className="space-y-4">
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <ShoppingBag size={20} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-800">{selectedCustomer?.namaPelanggan}</h4>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{selectedCustomer?.idPelanggan}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg shadow-sm">
                            <div className="flex-1">
                                <p className="text-[10px] text-slate-400 uppercase font-black mb-1">Paket Lama</p>
                                <p className="text-xs font-bold text-slate-600 line-through">{currentPaket?.namaPaket}</p>
                                <p className="text-[10px] text-slate-400">Rp {Number(currentPaket?.hargaPaket).toLocaleString('id-ID')}</p>
                            </div>
                            <ArrowRight className="mx-4 text-slate-300" size={16} />
                            <div className="flex-1 text-right">
                                <p className="text-[10px] text-primary uppercase font-black mb-1">Paket Baru</p>
                                <p className="text-xs font-bold text-primary">{selectedNewPaket?.namaPaket}</p>
                                <p className="text-[10px] text-primary">Rp {Number(selectedNewPaket?.hargaPaket).toLocaleString('id-ID')}</p>
                            </div>
                        </div>

                        <div className={cn(
                            "p-3 rounded-lg border flex items-center justify-between",
                            priceDiff >= 0 ? "bg-green-50 border-green-100" : "bg-amber-50 border-amber-100"
                        )}>
                            <span className="text-[11px] font-bold text-slate-600 uppercase">Selisih Biaya:</span>
                            <span className={cn(
                                "text-sm font-black",
                                priceDiff >= 0 ? "text-green-600" : "text-amber-600"
                            )}>
                                {priceDiff >= 0 ? "+" : ""}Rp {priceDiff.toLocaleString('id-ID')}
                            </span>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Catatan Pemohon:</label>
                            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 text-xs italic text-slate-600">
                                {requestNote || "Tidak ada catatan."}
                            </div>
                        </div>
                    </div>

                    <p className="text-[11px] text-slate-400 text-center leading-relaxed px-4">
                        Request ini akan dikirim ke antrian persetujuan admin. Paket pelanggan tidak akan berubah sampai disetujui.
                    </p>
                </div>
            </ModalDetail>
        </div>
    );
};

export default UpgradePage;
