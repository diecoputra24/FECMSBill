import React, { useState, useEffect } from "react";
import { useCustomerStore } from "@/store/customerStore";
import { useBranchStore } from "@/store/branchStore";
import { useCustomerStatusStore } from "@/store/customerStatusStore";
import { useCustomerStatusRequestStore } from "@/store/customerStatusRequestStore";
import { CustomSelect } from "@/components/ui/custom-select";
import { CustomButton } from "@/components/ui/custom-button";
import { CustomTable } from "@/components/ui/custom-table";
import { Badge } from "@/components/ui/badge";
import {
    Search,
    ChevronDown,
    ChevronUp,
    RefreshCw,
    Loader2,
    Send,
    UserMinus,
    UserX,
    UserCheck,
    AlertTriangle,
    FileText
} from "lucide-react";
import { ModalMessage } from "@/components/ui/modal-message";
import { ModalLoading } from "@/components/ui/modal-loading";
import { ModalConfirm } from "@/components/ui/modal-confirm";
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

const FormField = ({ label, icon: Icon, children }: { label: string; icon?: React.ComponentType<{ size?: number; className?: string }>; children: React.ReactNode }) => (
    <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter flex items-center gap-1.5">
            {Icon && <Icon size={12} className="text-slate-400" />}
            {label}
        </label>
        {children}
    </div>
);

const CustomerStatusPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const customerIdFromQuery = searchParams.get("id");
    const actionType = searchParams.get("action"); // 'nonaktif' or 'berhenti'

    const { customers, fetchCustomers } = useCustomerStore();
    const { branches, fetchBranches } = useBranchStore();
    const { createRequest } = useCustomerStatusRequestStore();

    const {
        filterValues,
        selectedCustomer,
        selectedAction,
        reason,
        isInfoCollapsed,
        setFilterValues,
        setSelectedCustomer,
        setSelectedAction,
        setReason,
        setIsInfoCollapsed
    } = useCustomerStatusStore();

    const [loading, setLoading] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Modal states
    const [showMessage, setShowMessage] = useState({ show: false, title: "", message: "", type: "success" as any });
    const [showLoading, setShowLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // Search results for multiple matches
    const [searchResults, setSearchResults] = useState<typeof customers>([]);

    const searchOptions = [
        { value: "idPelanggan", label: "IdPel" },
        { value: "namaPelanggan", label: "NamaPel" },
        { value: "teleponPelanggan", label: "Telepon" },
    ];

    useEffect(() => {
        fetchCustomers();
        fetchBranches();
    }, []);

    // Handle query params
    useEffect(() => {
        if (customerIdFromQuery && customers.length > 0) {
            const customer = customers.find(c => c.id.toString() === customerIdFromQuery);
            if (customer) {
                setSelectedCustomer(customer);
            }
        }
        if (actionType === 'nonaktif') {
            setSelectedAction('NONAKTIF');
        } else if (actionType === 'berhenti') {
            setSelectedAction('BERHENTI');
        }
    }, [customerIdFromQuery, actionType, customers]);

    const handleSearch = () => {
        if (!filterValues.branchId && filterValues.branchId !== "all") return;

        const results = customers.filter(c => {
            // Filter by branch
            if (filterValues.branchId && filterValues.branchId !== "all") {
                if (c.area?.branchId.toString() !== filterValues.branchId) {
                    return false;
                }
            }

            // Filter by search value
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

    const handleSubmitRequest = async () => {
        if (!selectedCustomer || !selectedAction) return;

        setLoading(true);
        setShowLoading(true);
        try {
            await createRequest({
                customerId: selectedCustomer.id,
                currentStatus: selectedCustomer.statusPelanggan,
                newStatus: selectedAction,
                reason,
                requestedBy: "Admin", // TODO: Get from auth context
            });

            setShowMessage({
                show: true,
                title: "Request Terkirim!",
                message: `Request ${selectedAction === 'AKTIF' ? 'aktivasi kembali' : selectedAction === 'NONAKTIF' ? 'nonaktif sementara' : 'berhenti berlangganan'} untuk pelanggan ${selectedCustomer?.namaPelanggan} berhasil dikirim dan menunggu persetujuan.`,
                type: "success"
            });
            setSelectedAction('');
            setReason('');
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

    const canSubmit = selectedCustomer && selectedAction && selectedCustomer.statusPelanggan !== selectedAction;

    return (
        <div className="space-y-4 pb-20">
            {/* Header / Filter Section - SAME AS customer-change.tsx */}
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
                                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
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
                            {
                                header: "STATUS",
                                render: (row) => (
                                    <Badge variant={row.statusPelanggan === 'AKTIF' ? 'success' : row.statusPelanggan === 'NONAKTIF' ? 'warning' : 'destructive'}>
                                        {row.statusPelanggan}
                                    </Badge>
                                )
                            },
                        ]}
                    />
                </div>
            )}

            {selectedCustomer ? (
                <>
                    <InfoCard
                        title="PERUBAHAN STATUS PELANGGAN"
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
                                <Badge variant={selectedCustomer.statusPelanggan === 'AKTIF' ? 'success' : selectedCustomer.statusPelanggan === 'NONAKTIF' ? 'warning' : 'destructive'} className="font-bold text-[9px] uppercase h-6 px-2 rounded-sm flex items-center gap-1">
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
                            <InfoRow label="Nomor Telepon" value={selectedCustomer.teleponPelanggan} />
                            <InfoRow label="Alamat Pemasangan" value={selectedCustomer.alamatPelanggan} />
                            <InfoRow label="NIK / Identitas" value={selectedCustomer.identitasPelanggan} />
                        </div>

                        {/* Status Change Form */}
                        <div className="border-t border-slate-100 -mx-6">
                            <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100">
                                <h5 className="font-bold text-slate-700 text-[12px] uppercase tracking-wider">Pilih Aksi Perubahan Status</h5>
                            </div>

                            <div className="p-6">
                                {/* Show AKTIF option only if customer is not AKTIF */}
                                {selectedCustomer.statusPelanggan !== 'AKTIF' && (
                                    <div className="mb-6">
                                        <button
                                            onClick={() => setSelectedAction('AKTIF')}
                                            className={cn(
                                                "w-full p-6 rounded-lg border-2 text-left transition-all",
                                                selectedAction === 'AKTIF'
                                                    ? "border-green-500 bg-green-50"
                                                    : "border-slate-200 hover:border-green-300 hover:bg-green-50/50"
                                            )}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "w-12 h-12 rounded-full flex items-center justify-center",
                                                    selectedAction === 'AKTIF' ? "bg-green-500 text-white" : "bg-green-100 text-green-500"
                                                )}>
                                                    <UserCheck size={24} />
                                                </div>
                                                <div>
                                                    <h6 className="font-bold text-slate-800">Aktifkan Kembali</h6>
                                                    <p className="text-xs text-slate-500 mt-1">Mengaktifkan kembali layanan pelanggan. PPP Secret akan di-enable kembali di MikroTik.</p>
                                                </div>
                                            </div>
                                        </button>
                                    </div>
                                )}

                                {/* Show NONAKTIF/BERHENTI options only if customer is AKTIF */}
                                {selectedCustomer.statusPelanggan === 'AKTIF' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                        {/* Nonaktif Sementara */}
                                        <button
                                            onClick={() => setSelectedAction('NONAKTIF')}
                                            className={cn(
                                                "p-6 rounded-lg border-2 text-left transition-all",
                                                selectedAction === 'NONAKTIF'
                                                    ? "border-amber-500 bg-amber-50"
                                                    : "border-slate-200 hover:border-amber-300 hover:bg-amber-50/50"
                                            )}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "w-12 h-12 rounded-full flex items-center justify-center",
                                                    selectedAction === 'NONAKTIF' ? "bg-amber-500 text-white" : "bg-amber-100 text-amber-500"
                                                )}>
                                                    <UserX size={24} />
                                                </div>
                                                <div>
                                                    <h6 className="font-bold text-slate-800">Nonaktif Sementara</h6>
                                                    <p className="text-xs text-slate-500 mt-1">Layanan dinonaktifkan sementara. Dapat diaktifkan kembali kapan saja.</p>
                                                </div>
                                            </div>
                                        </button>

                                        {/* Berhenti Berlangganan */}
                                        <button
                                            onClick={() => setSelectedAction('BERHENTI')}
                                            className={cn(
                                                "p-6 rounded-lg border-2 text-left transition-all",
                                                selectedAction === 'BERHENTI'
                                                    ? "border-red-500 bg-red-50"
                                                    : "border-slate-200 hover:border-red-300 hover:bg-red-50/50"
                                            )}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "w-12 h-12 rounded-full flex items-center justify-center",
                                                    selectedAction === 'BERHENTI' ? "bg-red-500 text-white" : "bg-red-100 text-red-500"
                                                )}>
                                                    <UserMinus size={24} />
                                                </div>
                                                <div>
                                                    <h6 className="font-bold text-slate-800">Berhenti Berlangganan</h6>
                                                    <p className="text-xs text-slate-500 mt-1">Pelanggan mengakhiri langganan secara permanen.</p>
                                                </div>
                                            </div>
                                        </button>
                                    </div>
                                )}

                                {/* Reason Input */}
                                {selectedAction && (
                                    <div className="space-y-6 animate-in slide-in-from-top-2 duration-200">
                                        <FormField label="Alasan Perubahan Status" icon={FileText}>
                                            <textarea
                                                value={reason}
                                                onChange={(e) => setReason(e.target.value)}
                                                placeholder="Masukkan alasan perubahan status (opsional)..."
                                                className="w-full h-24 bg-white border border-slate-200 rounded-lg p-4 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                                            />
                                        </FormField>

                                        {/* Warning for Berhenti */}
                                        {selectedAction === 'BERHENTI' && (
                                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                                                <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-sm font-bold text-red-700">Perhatian!</p>
                                                    <p className="text-xs text-red-600 mt-1">
                                                        Tindakan ini akan menghentikan langganan pelanggan secara permanen.
                                                        PPP Secret di MikroTik akan dinonaktifkan dan pelanggan tidak akan bisa mengakses layanan internet.
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Submit Button */}
                                <div className="pt-6 border-t border-slate-100 mt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            {selectedAction && (
                                                <Badge variant={selectedAction === 'NONAKTIF' ? 'warning' : 'destructive'} className="text-[10px] uppercase">
                                                    {selectedAction === 'NONAKTIF' ? 'Nonaktif Sementara' : 'Berhenti Berlangganan'}
                                                </Badge>
                                            )}
                                        </div>
                                        <CustomButton
                                            onClick={() => setShowConfirm(true)}
                                            disabled={!canSubmit || loading}
                                            variant={selectedAction === 'BERHENTI' ? 'danger' : 'primary'}
                                            className="h-11 px-6 rounded-lg font-bold shadow-md"
                                        >
                                            {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : <Send size={16} className="mr-2" />}
                                            Ajukan Perubahan Status
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

            <ModalLoading isOpen={showLoading} message="Sedang mengirim request perubahan status..." />

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
                variant={selectedAction === 'BERHENTI' ? 'danger' : 'primary'}
                title={`Konfirmasi ${selectedAction === 'AKTIF' ? 'Aktivasi Kembali' : selectedAction === 'NONAKTIF' ? 'Nonaktif Sementara' : 'Berhenti Berlangganan'}`}
                message={`Apakah Anda yakin ingin mengajukan ${selectedAction === 'AKTIF' ? 'aktivasi kembali' : selectedAction === 'NONAKTIF' ? 'nonaktif sementara' : 'berhenti berlangganan'} untuk pelanggan "${selectedCustomer?.namaPelanggan}"? Request ini akan menunggu persetujuan.`}
                confirmLabel="Ya, Ajukan Request"
                cancelLabel="Batal"
            />
        </div>
    );
};

export default CustomerStatusPage;
