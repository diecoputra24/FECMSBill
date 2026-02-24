import React, { useState, useEffect, useRef } from "react";
import { useBranchStore } from "@/store/branchStore";
import { useCustomerStore } from "@/store/customerStore";
import { useInvoiceStore } from "@/store/invoiceStore";
import { useOpportunityStore } from "@/store/opportunityStore";
import { CustomSelect } from "@/components/ui/custom-select";
import { Search, Receipt, Package, Ticket, Activity, Info, AlertCircle, RefreshCw, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CustomTable } from "@/components/ui/custom-table";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { id } from "date-fns/locale";

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

const DetailOpportunity: React.FC = () => {
    const { branches, fetchBranches, loading: branchLoading } = useBranchStore();
    const { customers, connections, fetchCustomers, fetchConnections } = useCustomerStore();
    const { invoices, fetchInvoices } = useInvoiceStore();

    const {
        filterValues, setFilterValues,
        activeTab, setActiveTab,
        selectedCustomer, setSelectedCustomer
    } = useOpportunityStore();

    const scrollRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(false);

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setShowLeftArrow(scrollLeft > 0);
            setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 5);
        }
    };

    useEffect(() => {
        // Initial check and set up resize observer or listener
        checkScroll();
        const timer = setTimeout(checkScroll, 100); // Small delay to ensure render is complete
        window.addEventListener('resize', checkScroll);
        return () => {
            window.removeEventListener('resize', checkScroll);
            clearTimeout(timer);
        };
    }, []);

    const scrollTabs = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { current } = scrollRef;
            const scrollAmount = 300;
            const targetScroll = direction === 'left'
                ? current.scrollLeft - scrollAmount
                : current.scrollLeft + scrollAmount;

            current.scrollTo({
                left: targetScroll,
                behavior: 'smooth'
            });
        }
    };

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isInfoCollapsed, setIsInfoCollapsed] = useState(false);

    const searchOptions = [
        { value: "idPelanggan", label: "IdPel" },
        { value: "pppUsername", label: "PPPUser" },
        { value: "namaPelanggan", label: "NamaPel" },
    ];

    useEffect(() => {
        fetchBranches();
        fetchConnections();
    }, [fetchBranches, fetchConnections]);

    useEffect(() => {
        if (filterValues.branchId) {
            fetchCustomers(true);
        }
    }, [filterValues.branchId, fetchCustomers]);

    // State for multiple search results
    const [searchResults, setSearchResults] = useState<typeof customers>([]);

    const handleSearch = () => {
        if (!filterValues.branchId) return;

        // Find all customers matching criteria using filter instead of find
        const results = customers.filter(c => {
            // First check branch filter if strictly selected (not 'all')
            if (filterValues.branchId && filterValues.branchId !== "all") {
                // Assuming customer has area relation loaded
                if (c.area?.branchId.toString() !== filterValues.branchId) {
                    return false;
                }
            }

            const searchValue = filterValues.searchValue.toLowerCase();
            if (filterValues.searchType === "idPelanggan") {
                return c.idPelanggan.toLowerCase() === searchValue;
            }
            if (filterValues.searchType === "pppUsername") {
                // Assuming pppUsername is available in customer model or from connections
                // Since connections are loaded, we can check there too if needed, but for now stick to simple props or join
                // Actually pppUsername is usually on connection. Let's try to check connections for this customer.
                const customerConnection = connections.find(conn => conn.pelangganId === c.id);
                return customerConnection?.pppUsername?.toLowerCase() === searchValue;
            }
            if (filterValues.searchType === "namaPelanggan") {
                return c.namaPelanggan.toLowerCase().includes(searchValue);
            }
            return false;
        });

        if (results.length === 1) {
            // Only one result, select directly
            setSelectedCustomer(results[0]);
            setSearchResults([]);
            fetchInvoices(true);
        } else if (results.length > 1) {
            // Multiple results, show selection table
            setSearchResults(results);
            setSelectedCustomer(null);
        } else {
            // No results
            setSearchResults([]);
            setSelectedCustomer(null);
        }
    };

    const handleSelectFromResults = (customer: typeof customers[0]) => {
        setSelectedCustomer(customer);
        setSearchResults([]);
        fetchInvoices(true);
    };

    const tabs = [
        { id: "layanan", label: "LAYANAN", icon: Package },
        { id: "billing", label: "BILLING", icon: Receipt },
        { id: "teknis", label: "TEKNIS", icon: Activity },
        { id: "non-rutin", label: "NON RUTIN", icon: Activity },
        { id: "ticket", label: "TICKET", icon: Ticket },
        { id: "mutasi", label: "MUTASI", icon: Activity },
        { id: "isolir", label: "ISOLIR", icon: AlertCircle },
    ];

    return (
        <div className="space-y-4 pb-20">
            {/* Header / Filter Section - Plain style */}
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
                            loading={branchLoading}
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

            {selectedCustomer ? (
                <>
                    {/* Detail Information Card */}
                    <InfoCard
                        title="DETAIL INFORMASI"
                        collapsible
                        isCollapsed={isInfoCollapsed}
                        onToggle={() => setIsInfoCollapsed(!isInfoCollapsed)}
                        status={
                            <div className="flex gap-2">
                                <div
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        // Add refresh logic if needed
                                    }}
                                    className="w-6 h-6 rounded-sm bg-primary text-white flex items-center justify-center shadow-sm cursor-pointer hover:bg-primary/90 transition-all"
                                    title="Refresh Data"
                                >
                                    <RefreshCw size={12} />
                                </div>
                                <Badge variant="destructive" className="font-bold text-[9px] uppercase h-6 px-2 rounded-sm flex items-center gap-1">
                                    <div className="w-1 h-1 bg-white rounded-full animate-pulse" />
                                    Offline
                                </Badge>
                            </div>
                        }
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-12">
                            <InfoRow label="ID Pelanggan" value={selectedCustomer.idPelanggan} />
                            <InfoRow label="Nama Lengkap" value={selectedCustomer.namaPelanggan} />
                            <InfoRow label="NIK / Identitas" value={selectedCustomer.identitasPelanggan} />

                            <InfoRow label="Email Address" value={(selectedCustomer as any).email || "-"} />
                            <InfoRow label="Nomor Telepon" value={selectedCustomer.teleponPelanggan} />
                            <InfoRow label="Alamat Pemasangan" value={selectedCustomer.alamatPelanggan} />

                            <InfoRow label="Titik Kordinat" value={(selectedCustomer as any).latitude && (selectedCustomer as any).longitude ? `${(selectedCustomer as any).latitude}, ${(selectedCustomer as any).longitude}` : "-"} />
                            <InfoRow label="Regional / Cabang" value={branches.find(b => b.id === selectedCustomer.area?.branchId)?.namaBranch} />
                            <InfoRow label="Area" value={selectedCustomer.area?.namaArea} />
                        </div>

                        {/* Tabs Section inside Card */}
                        <div className="mt-8 border-t border-slate-100 -mx-6">
                            <div className="relative group border-b border-slate-100 bg-slate-50/50 h-[52px]">
                                {/* Scroll Buttons */}
                                {showLeftArrow && (
                                    <button
                                        onClick={() => scrollTabs('left')}
                                        className="absolute left-0 top-0 bottom-0 z-20 w-10 bg-gradient-to-r from-slate-50 via-slate-50/80 to-transparent text-slate-400 hover:text-primary transition-all flex items-center justify-center"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                )}
                                {showRightArrow && (
                                    <button
                                        onClick={() => scrollTabs('right')}
                                        className="absolute right-0 top-0 bottom-0 z-20 w-10 bg-gradient-to-l from-slate-50 via-slate-50/80 to-transparent text-slate-400 hover:text-primary transition-all flex items-center justify-center"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                )}

                                <div
                                    ref={scrollRef}
                                    onScroll={checkScroll}
                                    className="flex h-full overflow-x-hidden no-scrollbar scroll-smooth"
                                >
                                    {tabs.map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={cn(
                                                "px-6 h-full text-[12px] font-black uppercase tracking-wider transition-all relative whitespace-nowrap flex items-center flex-shrink-0",
                                                activeTab === tab.id
                                                    ? "text-primary bg-white"
                                                    : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                                            )}
                                        >
                                            {tab.label}
                                            {activeTab === tab.id && (
                                                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="p-0">
                                {activeTab === "layanan" && (
                                    <div className="animate-in fade-in duration-300">
                                        <CustomTable
                                            data={connections.filter(c => c.pelangganId === selectedCustomer.id)}
                                            columns={[
                                                { header: "ID PELANGGAN", render: () => selectedCustomer.idPelanggan },
                                                { header: "LAYANAN PRODUK", render: (row) => row.paket?.namaPaket || "-" },
                                                { header: "BILLING TYPE", render: (row) => row.id ? "PREPAID" : "-" }, // Assuming largely PREPAID
                                                { header: "RP LAYANAN", render: (row) => (row.paket?.hargaPaket || 0).toLocaleString('id-ID') },
                                                { header: "RP INSTALASI", render: () => "0" },
                                                { header: "RP PPN", render: (row) => ((row.paket?.hargaPaket || 0) * 0.11).toLocaleString('id-ID') },
                                                { header: "RP ADDON", render: () => "0" },
                                                { header: "RP DISKON", render: () => (selectedCustomer.diskon || 0).toLocaleString('id-ID') },
                                                {
                                                    header: "RP JUMLAH", render: (row) => {
                                                        const harga = row.paket?.hargaPaket || 0;
                                                        const ppn = harga * 0.11;
                                                        const diskon = selectedCustomer.diskon || 0;
                                                        return <span className="font-bold text-primary">{(harga + ppn - diskon).toLocaleString('id-ID')}</span>
                                                    }
                                                },
                                            ]}
                                        />
                                    </div>
                                )}

                                {activeTab === "billing" && (
                                    <div className="animate-in fade-in duration-300">
                                        <CustomTable
                                            data={invoices.filter(inv => inv.customerId === selectedCustomer.id)}
                                            columns={[
                                                { header: "TGL BUAT", render: (row) => format(new Date(row.createdAt), "dd/MM/yyyy HH:mm", { locale: id }) },
                                                { header: "ID TAGIHAN", render: (row) => row.invoiceNumber },
                                                {
                                                    header: "PRODUK", render: () => {
                                                        const conn = connections.find(c => c.pelangganId === selectedCustomer.id);
                                                        return conn?.paket?.namaPaket || "-";
                                                    }
                                                },
                                                { header: "BILLING TYPE", render: (row) => row.type || "PREPAID" },
                                                { header: "RP INSTALASI", render: () => "0" },
                                                { header: "RP LAYANAN", render: (row) => typeof row.amount === 'string' ? parseFloat(row.amount).toLocaleString('id-ID') : (row.amount as number).toLocaleString('id-ID') },
                                                {
                                                    header: "RP PPN", render: (row) => {
                                                        const amount = typeof row.amount === 'string' ? parseFloat(row.amount) : (row.amount as number);
                                                        return (amount * 0.11).toLocaleString('id-ID'); // Mock calculation
                                                    }
                                                },
                                                { header: "RP ADDON", render: () => "0" },
                                                { header: "RP DISKON", render: () => "0" },
                                                {
                                                    header: "RP JUMLAH", render: (row) => {
                                                        const amount = typeof row.amount === 'string' ? parseFloat(row.amount) : (row.amount as number);
                                                        const ppn = amount * 0.11;
                                                        return <span className="font-bold text-primary">{(amount + ppn).toLocaleString('id-ID')}</span>;
                                                    }
                                                },
                                                {
                                                    header: "STATUS",
                                                    render: (row) => (
                                                        <div className="flex justify-center">
                                                            {row.status === 'PAID' ? (
                                                                <CheckCircle className="text-green-500 w-5 h-5" />
                                                            ) : (
                                                                <XCircle className="text-red-500 w-5 h-5" />
                                                            )}
                                                        </div>
                                                    )
                                                },
                                            ]}
                                        />
                                    </div>
                                )}

                                {activeTab === "teknis" && (
                                    <div className="animate-in fade-in duration-300">
                                        <CustomTable
                                            data={connections.filter(c => c.pelangganId === selectedCustomer.id)}
                                            columns={[
                                                { header: "ID PELANGGAN", render: () => selectedCustomer.idPelanggan },
                                                { header: "LAYANAN PRODUK", render: (row) => row.paket?.namaPaket || "-" },
                                                { header: "AREA / WILAYAH", render: () => selectedCustomer.area?.namaArea || "-" },
                                                { header: "NAMA ODP", render: (row) => (row as any).odp?.namaOdp || "-" },
                                                { header: "PORT ODP", render: (row) => (row as any).odpPort?.nomorPort || "-" },
                                                { header: "PPP USERNAME", render: (row) => <span className="font-mono text-primary font-bold">{row.pppUsername || "-"}</span> },
                                                { header: "PPP PASSWORD", render: (row) => <span className="font-mono">{row.pppPassword || "-"}</span> },
                                                { header: "IP ADDRESS", render: (row) => (row as any).ipAddress || "-" },
                                            ]}
                                        />
                                    </div>
                                )}


                                {activeTab === "non-rutin" && (
                                    <div className="animate-in fade-in duration-300">
                                        <CustomTable
                                            data={[]}
                                            emptyMessage="Belum ada data tagihan non-rutin untuk pelanggan ini"
                                            columns={[
                                                { header: "TANGGAL", render: () => "" },
                                                { header: "KATEGORI", render: () => "" },
                                                { header: "DESKRIPSI", render: () => "" },
                                                { header: "RP JUMLAH", render: () => "" },
                                                { header: "STATUS", render: () => "" },
                                            ]}
                                        />
                                    </div>
                                )}

                                {activeTab === "ticket" && (
                                    <div className="animate-in fade-in duration-300">
                                        <CustomTable
                                            data={[]}
                                            emptyMessage="Belum ada riwayat ticket bantuan/gangguan"
                                            columns={[
                                                { header: "TANGGAL", render: () => "" },
                                                { header: "ID TICKET", render: () => "" },
                                                { header: "KATEGORI", render: () => "" },
                                                { header: "PRIORITAS", render: () => "" },
                                                { header: "STATUS", render: () => "" },
                                            ]}
                                        />
                                    </div>
                                )}

                                {activeTab === "mutasi" && (
                                    <div className="animate-in fade-in duration-300">
                                        <CustomTable
                                            data={[]} // Mock empty history
                                            emptyMessage="Belum ada riwayat mutasi (Pergantian Nama/Alamat/Layanan)"
                                            columns={[
                                                { header: "TANGGAL", render: () => "" },
                                                { header: "JENIS MUTASI", render: () => "" },
                                                { header: "DETAIL LAMA", render: () => "" },
                                                { header: "DETAIL BARU", render: () => "" },
                                                { header: "OLEH", render: () => "" },
                                            ]}
                                        />
                                    </div>
                                )}

                                {activeTab === "isolir" && (
                                    <div className="animate-in fade-in duration-300">
                                        <CustomTable
                                            data={[]} // Mock empty history
                                            emptyMessage="Belum ada riwayat isolir untuk pelanggan ini"
                                            columns={[
                                                { header: "TANGGAL", render: () => "" },
                                                { header: "AKSI", render: () => "" },
                                                { header: "ALASAN / KETERANGAN", render: () => "" },
                                                { header: "PETUGAS / SISTEM", render: () => "" },
                                                {
                                                    header: "STATUS AKHIR",
                                                    render: () => (
                                                        <Badge variant={selectedCustomer.statusPelanggan === 'AKTIF' ? 'success' : 'destructive'}>
                                                            {selectedCustomer.statusPelanggan === 'AKTIF' ? 'NORMAL' : 'TERISOLIR'}
                                                        </Badge>
                                                    )
                                                },
                                            ]}
                                        />
                                    </div>
                                )}

                                {activeTab !== "billing" &&
                                    activeTab !== "layanan" &&
                                    activeTab !== "mutasi" &&
                                    activeTab !== "isolir" &&
                                    activeTab !== "teknis" &&
                                    activeTab !== "non-rutin" &&
                                    activeTab !== "ticket" && (
                                        <div className="p-20 text-center space-y-3">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                                                <Info size={32} />
                                            </div>
                                            <p className="text-slate-400 font-bold text-sm uppercase tracking-tight">Data {activeTab} Belum Tersedia</p>
                                        </div>
                                    )}
                            </div>
                        </div>
                    </InfoCard>
                </>
            ) : (
                <div className="min-h-[400px]" />
            )}
        </div>
    );
};

export default DetailOpportunity;
