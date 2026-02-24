import { useEffect, useState } from "react";
import { useInvoiceStore } from "@/store/invoiceStore";
import { useBranchStore } from "@/store/branchStore";
import { useAreaStore } from "@/store/areaStore";
import { useCustomerStore } from "@/store/customerStore";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import { CustomTable } from "@/components/ui/custom-table";
import { CustomFilter } from "@/components/ui/custom-filter";
import { CustomButton } from "@/components/ui/custom-button";
import {
    Printer,
    Settings,
    RefreshCw,
    Plus,
    Check,
    Search,
    Receipt,
    Ticket,
    Info,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    CheckCircle,
    XCircle,
    MapPin,
    Smartphone,
    CreditCard as CreditCardIcon,
    Trash2,
    ShieldAlert,
    Handshake,
    CalendarCheck,
    History,
    Upload,
    ImageIcon,
    X
} from "lucide-react";
import { CustomCurrencyInput } from "@/components/ui/custom-input";
import { CustomSelect } from "@/components/ui/custom-select";
import { CustomDatePicker } from "@/components/ui/custom-datepicker";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { ModalConfirm } from "@/components/ui/modal-confirm";
import { ModalMessage } from "@/components/ui/modal-message";
import { ModalDetail } from "@/components/ui/modal-detail";
import { Badge } from "@/components/ui/badge";
import type { Invoice, InvoiceItem } from "@/types/invoice";
import { useRef, useCallback } from "react";

// Helper Components for Detail UI (Matching Opportunity Detail)
const InfoCard = ({ title, children, className, status, collapsible, isCollapsed, onToggle }: { title: string; children: React.ReactNode; className?: string; status?: React.ReactNode; collapsible?: boolean; isCollapsed?: boolean; onToggle?: () => void }) => (
    <div className={cn("rounded-lg overflow-hidden flex flex-col bg-white border border-slate-100 transition-all duration-300", className)}>
        <div className="bg-slate-50 px-5 py-2 border-b border-slate-100 flex justify-between items-center cursor-pointer" onClick={onToggle}>
            <h4 className="font-bold text-slate-700 text-[12px] uppercase tracking-wider">
                {title}
            </h4>
            <div className="flex items-center gap-2">
                {status}
                {collapsible && (
                    <div className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-primary transition-all">
                        {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                    </div>
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
        <div className="text-[13px] text-slate-700 leading-relaxed font-semibold">
            {value || <span className="text-slate-300 italic font-normal">-</span>}
        </div>
    </div>
);

const InvoicePage: React.FC = () => {
    const {
        invoices,
        loading,
        fetchInvoices,
        generateNextMonth,
        generateBatch,
        getBatchInfo,
        deleteInvoice,
        recalculateInvoice,
        payInvoice,
        runIsolation,
        createPromise,
        filterValues,
        setFilterValues,
        appliedFilters,
        setAppliedFilters,
        resetFilters,
        fetchPromises
    } = useInvoiceStore();

    const { user } = useAuthStore();

    const { branches, fetchBranches, loading: branchLoading } = useBranchStore();
    const { areas, fetchAreas } = useAreaStore();
    const { fetchCustomers } = useCustomerStore(); // Destructured fetchCustomers

    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [selectedCustomerInvoices, setSelectedCustomerInvoices] = useState<Invoice[]>([]);
    const [invoicesToPay, setInvoicesToPay] = useState<number[]>([]);
    const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [paymentConfig, setPaymentConfig] = useState({
        method: "CASH",
        amount: 0
    });
    const [proofImage, setProofImage] = useState<string | null>(null);
    const [proofPreview, setProofPreview] = useState<string | null>(null);
    const [isResizing, setIsResizing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const MAX_IMAGE_SIZE = 200 * 1024; // 200KB

    const resizeImage = useCallback(async (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let { width, height } = img;

                    // Scale down proportionally if too large
                    const maxDim = 1200;
                    if (width > maxDim || height > maxDim) {
                        const ratio = Math.min(maxDim / width, maxDim / height);
                        width = Math.round(width * ratio);
                        height = Math.round(height * ratio);
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) { reject('Canvas context error'); return; }
                    ctx.drawImage(img, 0, 0, width, height);

                    // Iteratively reduce quality until under MAX_IMAGE_SIZE
                    let quality = 0.85;
                    let result = canvas.toDataURL('image/jpeg', quality);

                    while (result.length > MAX_IMAGE_SIZE * 1.37 && quality > 0.1) {
                        quality -= 0.1;
                        result = canvas.toDataURL('image/jpeg', quality);
                    }

                    // If still too large, scale down more aggressively
                    if (result.length > MAX_IMAGE_SIZE * 1.37) {
                        const scaleFactor = 0.5;
                        canvas.width = Math.round(width * scaleFactor);
                        canvas.height = Math.round(height * scaleFactor);
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        result = canvas.toDataURL('image/jpeg', 0.6);
                    }

                    resolve(result);
                };
                img.onerror = () => reject('Failed to load image');
                img.src = e.target?.result as string;
            };
            reader.onerror = () => reject('Failed to read file');
            reader.readAsDataURL(file);
        });
    }, []);

    const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setMessageConfig({
                type: "error",
                title: "Format Tidak Valid",
                message: "File harus berupa gambar (JPG, PNG, dll)."
            });
            setIsMessageModalOpen(true);
            return;
        }

        setIsResizing(true);
        try {
            const resized = await resizeImage(file);
            setProofImage(resized);
            setProofPreview(resized);
        } catch (err) {
            setMessageConfig({
                type: "error",
                title: "Gagal Proses Gambar",
                message: "Gagal memproses gambar. Coba file lain."
            });
            setIsMessageModalOpen(true);
        } finally {
            setIsResizing(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }, [resizeImage]);

    const clearProofImage = useCallback(() => {
        setProofImage(null);
        setProofPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, []);
    const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
    const [batchInfo, setBatchInfo] = useState<{ targetMonth: string, totalActiveCustomers: number, customersToGenerate: number } | null>(null);
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [messageConfig, setMessageConfig] = useState<{ type: "success" | "error", title: string, message: string }>({
        type: "success", title: "", message: ""
    });

    const [isPromiseModalOpen, setIsPromiseModalOpen] = useState(false);
    const [isPromiseConfirmOpen, setIsPromiseConfirmOpen] = useState(false);
    const [promiseConfirmConfig, setPromiseConfirmConfig] = useState({
        title: "",
        message: "",
        variant: "danger" as "danger" | "primary"
    });

    const [promiseConfig, setPromiseConfig] = useState({
        date: format(new Date(), "yyyy-MM-dd"),
        note: ""
    });

    const handlePromiseCheck = async () => {
        if (!clickedInvoice?.customerId || invoicesToPay.length === 0) return;

        try {
            // 1. Ambil data janji bayar
            const allPromises = await fetchPromises();

            // 2. Filter janji milik customer ini
            const customerPromises = allPromises.filter(p => p.customerId === clickedInvoice.customerId);

            // 3. Cek Limit 3x di Bulan Ini
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();

            const promisesThisMonth = customerPromises.filter(p => {
                const d = new Date(p.createdAt);
                return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            });

            // BLOCKER: Sudah 3x
            if (promisesThisMonth.length >= 3) {
                setMessageConfig({
                    type: "error",
                    title: "Batas Janji Bayar Tercapai",
                    message: `Pelanggan ini sudah membuat ${promisesThisMonth.length} janji bayar bulan ini. Maksimal 3 kali per bulan. Tidak dapat membuat janji baru.`
                });
                setIsMessageModalOpen(true);
                return;
            }

            // WARNING 1: Kesempatan Terakhir (Janji ke-3)
            if (promisesThisMonth.length === 2) {
                setPromiseConfirmConfig({
                    title: "PERINGATAN: KESEMPATAN TERAKHIR!",
                    message: "Ini adalah janji bayar ke-3 (terakhir) untuk bulan ini. Jika pelanggan ingkar janji lagi, maka TIDAK AKAN BISA membuat janji bayar lagi di bulan ini. Apakah Anda yakin lanjut?",
                    variant: "danger"
                });
                setIsPromiseConfirmOpen(true);
                return;
            }

            // WARNING 2: Duplikat Aktif
            const selectedInvoiceIds = invoicesToPay;
            const hasDuplicateActive = customerPromises.some(p =>
                p.status === 'WAITING' &&
                selectedInvoiceIds.includes(p.invoiceId)
            );

            if (hasDuplicateActive) {
                setPromiseConfirmConfig({
                    title: "Konfirmasi Janji Bayar Duplikat",
                    message: "Pelanggan ini SUDAH MEMILIKI JANJI BAYAR yang belum lunas (Waiting) untuk tagihan yang dipilih. Apakah Anda yakin ingin membuat janji bayar baru (dobel)?",
                    variant: "danger"
                });
                setIsPromiseConfirmOpen(true);
                return;
            }

            // Jika Aman
            setIsPromiseModalOpen(true);

        } catch (error) {
            console.error("Gagal cek data janji", error);
            setIsPromiseModalOpen(true);
        }
    };

    // Detail Modal State
    // (Collapsed state removed to keep info fixed in 2-column layout)

    // Instead of selecting a single invoice, we find the customer associated with the selected invoice
    // and then fetch all relevant invoices for that customer.
    // For simplicity in the table, we still select based on invoice ID, but logic will focus on customer.

    // Group invoices by customer for the main table view?
    // User request: "ditagihan hanya info customer saja... jadi 1 data customer"
    // This implies the main table should probably show customers with unpaid bills, or just list invoices but detail view is customer-centric.
    // Let's stick to listing invoices but when clicked, we identify the customer and show ALL their invoices.

    const clickedInvoice = invoices.find(inv => inv.id === selectedId);

    useEffect(() => {
        if (clickedInvoice?.customerId) {
            // Filter invoices for this customer
            const customerInvoices = invoices.filter(inv => inv.customerId === clickedInvoice.customerId);
            // Sort by period descending
            customerInvoices.sort((a, b) => new Date(b.period).getTime() - new Date(a.period).getTime());
            setSelectedCustomerInvoices(customerInvoices);

            // Do not auto-select for payment, let user choose
            setInvoicesToPay([]);
            setPaymentConfig(prev => ({ ...prev, amount: 0 }));
        }
    }, [clickedInvoice, invoices]);

    // Auto-set branch filter if user has branchId
    // DEPRECATED: User requested to NOT auto-select ("jangan langsung dipilih")
    /*
    useEffect(() => {
        if (user?.branchId) {
            const branchIdStr = user.branchId.toString();
            setAppliedFilters({ ...appliedFilters, branchId: branchIdStr });
            setFilterValues({ branchId: branchIdStr });
        }
    }, [user?.branchId, setAppliedFilters, setFilterValues]);
    */


    // Update total amount when invoicesToPay changes
    useEffect(() => {
        const total = selectedCustomerInvoices
            .filter(inv => invoicesToPay.includes(inv.id))
            .reduce((sum, inv) => sum + Number(inv.amount), 0);
        setPaymentConfig(prev => ({ ...prev, amount: total }));
    }, [invoicesToPay, selectedCustomerInvoices]);

    const handleToggleInvoiceSelection = (invoiceId: number) => {
        if (invoicesToPay.includes(invoiceId)) {
            setInvoicesToPay(prev => prev.filter(id => id !== invoiceId));
        } else {
            setInvoicesToPay(prev => [...prev, invoiceId]);
        }
    };


    // Pagination State
    const [pagination, setPagination] = useState({
        currentPage: 1,
        pageSize: 10,
        totalItems: invoices.length
    });

    useEffect(() => {
        fetchBranches();
        fetchAreas();
    }, [fetchBranches, fetchAreas]);

    useEffect(() => {
        if (appliedFilters.branchId !== "") {
            fetchInvoices();
        }
    }, [appliedFilters.branchId, fetchInvoices]);

    useEffect(() => {
        setPagination(prev => ({ ...prev, totalItems: invoices.length }));
    }, [invoices]);

    const handleSearch = () => {
        setAppliedFilters({ ...filterValues });
    };

    const handleReset = () => {
        resetFilters();
        setSelectedId(null);
    };

    const handlePageSizeChange = (size: number) => {
        setPagination(prev => ({ ...prev, pageSize: size, currentPage: 1 }));
    };

    const handlePageChange = (page: number) => {
        setPagination(prev => ({ ...prev, currentPage: page }));
    };

    // Helper to extract amounts from items
    const getInvoiceValues = (items: InvoiceItem[] = []) => {
        const packageItem = items.find(i => i.itemType === 'PACKAGE');
        const discountItem = items.find(i => i.itemType === 'DISCOUNT');
        const addons = items.filter(i => i.itemType === 'ADDON');
        const taxItem = items.find(i => i.itemType === 'TAX');

        // Clean up description if it has prefixes
        const cleanProduct = (packageItem?.description || "-")
            .replace(/^LAYANAN INTERNET: /i, "")
            .replace(/^ADDON: /i, "");

        return {
            produk: cleanProduct,
            rpProduk: parseFloat(packageItem?.amount?.toString() || "0"),
            rpAddon: addons.reduce((sum, item) => sum + parseFloat(item.amount?.toString() || "0"), 0),
            rpDiskon: Math.abs(parseFloat(discountItem?.amount?.toString() || "0")),
            rpPajak: parseFloat(taxItem?.amount?.toString() || "0"),
        };
    };

    // Filter Logic (Must be defined before grouping)
    const filteredInvoices = invoices.filter(inv => {
        if (appliedFilters.branchId === "") return false;

        if (appliedFilters.branchId !== "" && appliedFilters.branchId !== "all" && inv.customer?.area?.branchId?.toString() !== appliedFilters.branchId) {
            return false;
        }
        if (appliedFilters.areaId && appliedFilters.areaId !== "all") {
            if (inv.customer?.areaId?.toString() !== appliedFilters.areaId) return false;
        }

        const searchTerm = appliedFilters.search.toLowerCase();
        const matchesSearch =
            inv.invoiceNumber.toLowerCase().includes(searchTerm) ||
            inv.customer?.namaPelanggan?.toLowerCase().includes(searchTerm) ||
            inv.customer?.idPelanggan?.toLowerCase().includes(searchTerm);

        if (!matchesSearch) return false;
        if (appliedFilters.status && inv.status !== appliedFilters.status) return false;

        return true;
    });

    // Group Invoices by Customer for Main Table
    const groupedCustomers = Array.from(
        filteredInvoices.reduce((acc, inv) => {
            const customerId = inv.customerId;
            if (!acc.has(customerId)) {
                acc.set(customerId, {
                    ...inv,
                    totalInvoicesCount: 0,
                    unpaidCount: 0,
                    totalUnpaidAmount: 0,
                    allInvoices: []
                });
            }
            const group = acc.get(customerId);
            group.totalInvoicesCount += 1;
            group.allInvoices.push(inv);
            if (inv.status === 'UNPAID') {
                group.unpaidCount += 1;
                group.totalUnpaidAmount += Number(inv.amount);
            }
            return acc;
        }, new Map())
    ).map(([_, data]: [any, any]) => {
        data.allInvoices.sort((a: any, b: any) => new Date(b.period).getTime() - new Date(a.period).getTime());
        const status = data.unpaidCount > 0 ? 'UNPAID' : 'PAID';
        return {
            ...data.allInvoices[0],
            unpaidCount: data.unpaidCount,
            totalUnpaidAmount: data.totalUnpaidAmount,
            totalInvoicesCount: data.totalInvoicesCount,
            groupStatus: status
        };
    });

    const paginatedInvoices = groupedCustomers.slice(
        (pagination.currentPage - 1) * pagination.pageSize,
        pagination.currentPage * pagination.pageSize
    );

    // Table Columns (Customer Group View)
    const columns = [
        {
            header: "ID PELANGGAN",
            className: "whitespace-nowrap",
            render: (row: any) => (
                <span className="text-[12px] text-slate-700 font-mono uppercase">
                    {row.customer?.idPelanggan || "-"}
                </span>
            )
        },
        {
            header: "NAMA PELANGGAN",
            className: "whitespace-nowrap",
            render: (row: any) => (
                <span className="text-[12px] text-slate-700 uppercase tracking-tight">
                    {row.customer?.namaPelanggan || "-"}
                </span>
            )
        },
        {
            header: "STATUS PELANGGAN",
            className: "whitespace-nowrap text-center",
            render: (row: any) => {
                const status = row.customer?.statusPelanggan || "-";
                const colorClass =
                    status === "AKTIF" ? "text-green-600 bg-green-50 border-green-100" :
                        status === "ISOLIR" ? "text-red-600 bg-red-50 border-red-100" :
                            "text-slate-500 bg-slate-50 border-slate-100";

                return (
                    <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold border uppercase whitespace-nowrap",
                        colorClass
                    )}>
                        {status}
                    </span>
                );
            }
        },
        {
            header: "PRODUK",
            className: "whitespace-nowrap",
            render: (row: any) => (
                <span className="text-[12px] text-slate-600 uppercase">
                    {getInvoiceValues(row.items).produk}
                </span>
            )
        },
        {
            header: "PIUTANG (RP)",
            className: "whitespace-nowrap text-right",
            render: (row: any) => (
                <span className="text-[12px] text-slate-700 font-bold whitespace-nowrap">
                    {row.totalUnpaidAmount.toLocaleString('id-ID')}
                </span>
            )
        },
        {
            header: "STATUS",
            className: "whitespace-nowrap",
            render: (row: any) => (
                <span className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-bold border uppercase whitespace-nowrap",
                    row.groupStatus === 'PAID'
                        ? "text-green-600 bg-green-50 border-green-100"
                        : "text-orange-600 bg-orange-50 border-orange-100"
                )}>
                    {row.groupStatus === 'PAID' ? 'LUNAS' : `${row.unpaidCount} TUNGGAKAN`}
                </span>
            )
        },
        {
            header: "WILAYAH",
            className: "whitespace-nowrap",
            render: (row: any) => (
                <span className="text-[12px] text-slate-600 uppercase">
                    {row.customer?.area?.namaArea || "-"}
                </span>
            )
        },
        {
            header: "DATA",
            className: "whitespace-nowrap text-center",
            render: (row: any) => (
                <span className="text-[11px] text-slate-500 font-bold uppercase">
                    {row.totalInvoicesCount} INV
                </span>
            )
        }
    ];

    const handleGenerateNext = async () => {
        if (!clickedInvoice?.customerId) return;
        try {
            await generateNextMonth(clickedInvoice.customerId);
            // Refresh invoices to show new one
            await fetchInvoices(true);
            setIsGenerateModalOpen(false);
            setMessageConfig({
                type: "success",
                title: "Berhasil",
                message: `Berhasil generate tagihan bulan selanjutnya untuk ${clickedInvoice.customer?.namaPelanggan}.`
            });
            setIsMessageModalOpen(true);
            // Don't close detail modal, but update selected customer invoices
            // The useEffect will handle this if invoices state updates
        } catch (error: any) {
            setMessageConfig({
                type: "error",
                title: "Gagal",
                message: error.response?.data?.message || error.message || "Gagal generate tagihan."
            });
            setIsMessageModalOpen(true);
        }
    };

    const handleDelete = async () => {
        if (!selectedId) return;
        try {
            await deleteInvoice(selectedId);
            setIsDeleteModalOpen(false);
            // IMPORTANT: Also close detail modal if the deleted invoice was the entry point
            setIsDetailModalOpen(false);

            setMessageConfig({
                type: "success",
                title: "Berhasil",
                message: "Tagihan telah berhasil dihapus."
            });
            setIsMessageModalOpen(true);
            setSelectedId(null);
        } catch (error: any) {
            setMessageConfig({
                type: "error",
                title: "Gagal",
                message: error.response?.data?.message || error.message || "Gagal menghapus tagihan."
            });
            setIsMessageModalOpen(true);
        }
    };

    const handleRecalculate = async (invoiceId: number) => {
        try {
            await recalculateInvoice(invoiceId);
            setMessageConfig({
                type: "success",
                title: "Data Diperbarui",
                message: `Tagihan telah diperbarui dengan data pelanggan terbaru.`
            });
            setIsMessageModalOpen(true);
        } catch (error: any) {
            setMessageConfig({
                type: "error",
                title: "Gagal Memperbarui",
                message: error.response?.data?.message || error.message || "Gagal memperbarui tagihan."
            });
            setIsMessageModalOpen(true);
        }
    };

    const handleRecalculateAllUnpaid = async () => {
        if (selectedCustomerInvoices.length === 0) return;
        const unpaidInvoices = selectedCustomerInvoices.filter(inv => inv.status === 'UNPAID');
        if (unpaidInvoices.length === 0) {
            setMessageConfig({
                type: "success",
                title: "Data Sudah Sesuai",
                message: "Tidak ada tagihan 'BELUM BAYAR' yang perlu diperbarui."
            });
            setIsMessageModalOpen(true);
            return;
        }

        try {
            // Process all unpaid invoices
            await Promise.all(unpaidInvoices.map(inv => recalculateInvoice(inv.id)));
            setMessageConfig({
                type: "success",
                title: "Refresh Berhasil",
                message: `${unpaidInvoices.length} Tagihan telah diperbarui dengan data terbaru.`
            });
            setIsMessageModalOpen(true);
        } catch (error: any) {
            setMessageConfig({
                type: "error",
                title: "Gagal Refresh",
                message: "Terjadi kesalahan saat memperbarui tagihan."
            });
            setIsMessageModalOpen(true);
        }
    };

    const handlePay = async () => {
        if (invoicesToPay.length === 0) return;

        // Validate: proof image required for TRANSFER/EWALLET
        const needsProof = paymentConfig.method === 'TRANSFER' || paymentConfig.method === 'EWALLET';
        if (needsProof && !proofImage) {
            setMessageConfig({
                type: "error",
                title: "Bukti Transfer Diperlukan",
                message: "Untuk pembayaran Transfer Bank atau E-Wallet, wajib mengupload bukti transfer."
            });
            setIsMessageModalOpen(true);
            return;
        }

        try {
            await payInvoice(
                invoicesToPay,
                paymentConfig.amount,
                paymentConfig.method,
                1, // TODO: Get actual admin ID from auth
                selectedCustomerInvoices[0]?.customerId,
                needsProof ? proofImage! : undefined
            );
            setIsPaymentModalOpen(false);
            setIsDetailModalOpen(false);
            clearProofImage(); // Reset proof image after success
            setMessageConfig({
                type: "success",
                title: "Pembayaran Berhasil",
                message: `${invoicesToPay.length} Tagihan telah berhasil dibayar.`
            });
            setIsMessageModalOpen(true);
            setSelectedId(null);
            fetchCustomers(true);
        } catch (error: any) {
            setMessageConfig({
                type: "error",
                title: "Pembayaran Gagal",
                message: error.response?.data?.message || error.message || "Gagal memproses pembayaran."
            });
            setIsMessageModalOpen(true);
        }
    };

    const handlePromise = async () => {
        if (!clickedInvoice?.customerId) return;
        try {
            await createPromise({
                customerId: clickedInvoice.customerId,
                invoiceId: clickedInvoice.id,
                promiseDate: promiseConfig.date,
                note: promiseConfig.note,
                adminId: 1 // TODO: Get actual admin ID
            });
            setIsPromiseModalOpen(false);
            setIsDetailModalOpen(false);
            setMessageConfig({
                type: "success",
                title: "Janji Bayar Tersimpan",
                message: `Berhasil mencatat janji bayar untuk ${clickedInvoice.customer?.namaPelanggan} s/d tanggal ${format(new Date(promiseConfig.date), 'dd MMMM yyyy', { locale: id })}.`
            });
            setIsMessageModalOpen(true);
            fetchCustomers(true);
        } catch (error: any) {
            setMessageConfig({
                type: "error",
                title: "Gagal Mencatat",
                message: error.response?.data?.message || error.message || "Gagal mencatat janji bayar."
            });
            setIsMessageModalOpen(true);
        }
    };

    const handlePrint = (invoice: Invoice) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const dateFormatted = format(new Date(invoice.createdAt), "dd MMMM yyyy", { locale: id });
        const periodFormatted = format(new Date(invoice.period), "MMMM yyyy", { locale: id });
        let subtotalVal = 0;
        let taxVal = 0;
        let taxName = 'Pajak';

        invoice.items?.forEach(item => {
            const amt = Number(item.amount);
            if (item.itemType === 'TAX') {
                taxVal += amt;
                taxName = item.description.replace(/^PPN PPN/i, 'PPN');
            } else {
                subtotalVal += amt;
            }
        });

        const itemsHtml = invoice.items?.filter(item => item.itemType !== 'TAX').map(item => `
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-transform: uppercase; font-size: 12px;">
                    ${item.itemType === 'PACKAGE' ? 'PAKET: ' : item.itemType === 'ADDON' ? 'ADDON: ' : ''}
                    ${item.description}
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold; font-size: 12px;">
                    ${item.itemType === 'DISCOUNT' ? '-' : ''}Rp ${Math.abs(Number(item.amount)).toLocaleString('id-ID')}
                </td>
            </tr>
        `).join('');

        const subtotalFormatted = subtotalVal.toLocaleString('id-ID');
        const taxFormatted = taxVal.toLocaleString('id-ID');
        const totalFormatted = (typeof invoice.amount === 'string' ? parseFloat(invoice.amount) : invoice.amount).toLocaleString('id-ID');

        printWindow.document.write(`
            <html>
                <head>
                    <title>Print Invoice - ${invoice.invoiceNumber}</title>
                    <style>
                        @page { size: portrait; margin: 20mm; }
                        body { font-family: 'Inter', sans-serif; padding: 0; color: #1e293b; line-height: 1.5; }
                        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; }
                        .logo-text { font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.025em; }
                        .invoice-title { font-size: 14px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; }
                        .info-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
                        .info-box h3 { font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; }
                        .info-box p { font-size: 13px; font-weight: 600; margin: 0; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                        th { background: #f8fafc; text-align: left; padding: 12px 10px; font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; }
                        .footer { margin-top: 50px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; }
                        .total-section { display: flex; justify-content: flex-end; }
                        .total-box { background: #f8fafc; padding: 20px; border-radius: 8px; min-width: 250px; }
                        .total-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12px; }
                        .grand-total { border-top: 2px solid #e2e8f0; margin-top: 10px; padding-top: 10px; font-size: 18px; font-weight: 800; color: #0f172a; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div>
                            <div class="logo-text">CMS BILLING</div>
                            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Smart ISP Management System</div>
                        </div>
                        <div style="text-align: right;">
                            <div class="invoice-title">TAGIHAN LAYANAN</div>
                            <div style="font-size: 18px; font-weight: 800; color: #2563eb; margin-top: 5px;">#${invoice.invoiceNumber}</div>
                        </div>
                    </div>

                    <div class="info-grid">
                        <div class="info-box">
                            <h3>PELANGGAN</h3>
                            <p style="font-size: 15px; color: #0f172a;">${invoice.customer?.namaPelanggan}</p>
                            <p style="font-weight: 500; color: #64748b; margin-top: 4px;">ID: ${invoice.customer?.idPelanggan}</p>
                            <p style="font-weight: 500; color: #64748b; margin-top: 2px;">${invoice.customer?.alamatPelanggan || '-'}</p>
                        </div>
                        <div class="info-box" style="text-align: right;">
                            <h3>DETAIL INVOICE</h3>
                            <p>Periode: ${periodFormatted}</p>
                            <p style="font-weight: 400;"><span style="font-weight: 700;">Tgl Buat:</span> ${dateFormatted}</p>
                            <p>Status: <span style="color: ${invoice.status === 'PAID' ? '#10b981' : '#f59e0b'};">${invoice.status === 'PAID' ? 'LUNAS' : 'BELUM BAYAR'}</span></p>
                        </div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>DESKRIPSI LAYANAN</th>
                                <th style="text-align: right;">JUMLAH (RP)</th>
                            </tr>
                        </thead>
                        <tbody>${itemsHtml}</tbody>
                    </table>

                    <div class="total-section">
                        <div class="total-box">
                            <div class="total-row">
                                <span style="color: #64748b;">Subtotal</span>
                                <span>Rp ${subtotalFormatted}</span>
                            </div>
                            <div class="total-row">
                                <span style="color: #64748b;">${taxName}</span>
                                <span>Rp ${taxFormatted}</span>
                            </div>
                            <div class="total-row grand-total">
                                <span>TOTAL</span>
                                <span>Rp ${totalFormatted}</span>
                            </div>
                        </div>
                    </div>

                    <div class="footer">
                        <p>Terima kasih telah menggunakan layanan kami.</p>
                        <p style="margin-top: 5px; font-weight: 600;">CMS BILLING SYSTEM &bull; Automated Network Solution</p>
                    </div>

                    <script>
                        window.onload = function() { 
                            setTimeout(() => {
                                window.print(); 
                                window.close(); 
                            }, 500);
                        };
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const handleRunIsolation = async () => {
        if (!window.confirm("HARI INI: Jalankan proses isolir otomatis sekarang? Sistem akan menyisir semua tagihan UNPAID yang sudah lewat masa toleransi.")) return;
        try {
            const res = await runIsolation();
            alert(res?.message || "Proses isolir selesai.");
        } catch (error: any) {
            alert("Gagal menjalankan isolir: " + error.message);
        }
    };

    const handleBatchProcess = async () => {
        try {
            const data = await getBatchInfo();
            setBatchInfo(data);
            setIsBatchModalOpen(true);
        } catch (error: any) {
            setMessageConfig({
                type: "error",
                title: "Gagal",
                message: "Gagal mengambil informasi batch generate."
            });
            setIsMessageModalOpen(true);
        }
    };

    const handleConfirmBatch = async () => {
        try {
            const result = await generateBatch();
            setIsBatchModalOpen(false);
            setMessageConfig({
                type: "success",
                title: "Generate Selesai",
                message: `Telah digenerate ${result.generated} tagihan baru. ${result.skipped} tagihan dilewati (sudah ada).`
            });
            setIsMessageModalOpen(true);
        } catch (error: any) {
            setMessageConfig({
                type: "error",
                title: "Gagal",
                message: error.response?.data?.message || error.message || "Gagal menjalankan batch generate."
            });
            setIsMessageModalOpen(true);
        }
    };

    return (
        <div className="space-y-4 pb-10">
            <CustomFilter
                onSearch={handleSearch}
                onReset={handleReset}
                onPrint={() => console.log("Printing...")}
                loading={loading}
                filters={[
                    {
                        label: "Filter Cabang",
                        placeholder: "Pilih Cabang",
                        value: filterValues.branchId,
                        type: "select",
                        options: [
                            { label: "Semua Cabang", value: "all" },
                            ...branches.map(b => ({ label: b.namaBranch, value: b.id.toString() }))
                        ],
                        loading: branchLoading,
                        // User requested to keep it open ("selectnya terbuka")
                        disabled: false,

                        onChange: (val) => setFilterValues({ branchId: val, areaId: "" })
                    },
                    {
                        label: "Filter Area",
                        placeholder: filterValues.branchId ? "Semua Area" : "Pilih Cabang dulu",
                        value: filterValues.areaId,
                        type: "select",
                        disabled: !filterValues.branchId,
                        options: [
                            { label: "Semua Area", value: "all" },
                            ...areas
                                .filter(a => filterValues.branchId === "all" || a.branchId.toString() === filterValues.branchId)
                                .map(a => ({ label: a.namaArea, value: a.id.toString() }))
                        ],
                        onChange: (val) => setFilterValues({ areaId: val })
                    }
                ]}
            >
                <div className="w-full">
                    {/* Row 2: Status and Search (Matched size) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="w-full space-y-1">
                            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-tighter ml-1 block">
                                Filter Status
                            </label>
                            <CustomSelect
                                placeholder={filterValues.branchId ? "Semua Status" : "Pilih Cabang dulu"}
                                value={filterValues.status}
                                options={[
                                    { label: "Semua Status", value: "" },
                                    { label: "Belum Bayar", value: "UNPAID" },
                                    { label: "Lunas", value: "PAID" },
                                    { label: "Dibatalkan", value: "VOID" },
                                ]}
                                onChange={(val) => setFilterValues({ status: val })}
                                disabled={!filterValues.branchId}
                            />
                        </div>
                        <div className="w-full space-y-1">
                            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-tighter ml-1 block">
                                Cari Invoice / Pelanggan
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    className="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/40 transition-all placeholder:text-slate-300 placeholder:font-normal disabled:bg-slate-50 disabled:cursor-not-allowed"
                                    placeholder={filterValues.branchId ? "No. Invoice, Nama, atau ID..." : "Pilih Cabang dulu"}
                                    value={filterValues.search}
                                    onChange={(e) => setFilterValues({ search: e.target.value })}
                                    disabled={!filterValues.branchId}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </CustomFilter>

            <CustomTable
                data={paginatedInvoices}
                columns={columns}
                loading={loading}
                emptyMessage={
                    !appliedFilters.branchId || appliedFilters.branchId === ""
                        ? "Silakan pilih Cabang terlebih dahulu untuk melihat data tagihan."
                        : "Tidak ada data tagihan ditemukan matching filter yang dipilih."
                }
                pagination={{
                    ...pagination,
                    totalItems: groupedCustomers.length,
                    onPageChange: handlePageChange,
                    onPageSizeChange: handlePageSizeChange
                }}
                enableSelection={false}
                onRowClick={(row) => {
                    setSelectedId(row.id);
                    setIsDetailModalOpen(true);
                }}
                actionButtons={
                    (user?.role === 'ADMIN' || user?.role === 'SUPERADMIN' || user?.role === 'FINANCE' || user?.permissions?.some(p => p.startsWith('billing.'))) ? (
                        <div className="flex items-center gap-2">
                            <CustomButton
                                variant="secondary"
                                size="sm"
                                className="h-8 gap-2 font-bold px-4 bg-white border-slate-200 text-slate-600 hover:text-primary hover:bg-slate-50 transition-all shadow-sm"
                                onClick={handleBatchProcess}
                            >
                                <Settings size={16} />
                                <span>Batch Generate (Tgl 1)</span>
                            </CustomButton>
                            <CustomButton
                                variant="secondary"
                                size="sm"
                                className="h-8 gap-2 font-bold px-4 bg-red-50 border-red-100 text-red-600 hover:bg-red-100 hover:text-red-700 transition-all shadow-sm"
                                onClick={handleRunIsolation}
                            >
                                <ShieldAlert size={16} />
                                <span>Jalankan Isolir Otomatis</span>
                            </CustomButton>
                        </div>
                    ) : null
                }
            />

            <ModalDetail
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                onConfirm={() => setIsDetailModalOpen(false)}
                confirmLabel="Kembali"
                cancelLabel=""
                title={`Detail Tagihan Pelanggan`}
                maxWidth="full"
            >
                {clickedInvoice && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Column 1: Customer Information (Left Side) */}
                        <div className="space-y-4">
                            <InfoCard
                                title="DATA PELANGGAN"
                                status={
                                    <Badge variant="success" className="font-bold text-[9px] uppercase h-6 px-2 rounded-sm flex items-center gap-1">
                                        <div className="w-1 h-1 bg-white rounded-full animate-pulse" />
                                        AKTIF
                                    </Badge>
                                }
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                    <InfoRow label="ID Pelanggan" value={<span className="font-mono text-primary font-bold">{clickedInvoice.customer?.idPelanggan}</span>} />
                                    <InfoRow label="Nama Lengkap" value={<span className="uppercase font-bold">{clickedInvoice.customer?.namaPelanggan}</span>} />
                                    <InfoRow label="Layanan Aktif" value={clickedInvoice.items.find(i => i.itemType === 'PACKAGE')?.description} />
                                    <InfoRow label="Status" value="AKTIF / PREPAID" />
                                    <InfoRow label="Telepon" value={clickedInvoice.customer?.teleponPelanggan} />
                                    <InfoRow
                                        label="Masa Aktif"
                                        value={
                                            clickedInvoice.customer?.tanggalAkhir ? (
                                                <span className="font-bold text-blue-600">
                                                    {format(new Date(clickedInvoice.customer.tanggalAkhir), "dd MMMM yyyy", { locale: id })}
                                                </span>
                                            ) : "-"
                                        }
                                    />
                                    <InfoRow
                                        label="Regional / Area"
                                        value={`${branches.find(b => b.id === clickedInvoice.customer?.area?.branchId)?.namaBranch || clickedInvoice.customer?.area?.branch?.namaBranch || "CABANG UTAMA"} - ${clickedInvoice.customer?.area?.namaArea || "-"}`}
                                    />
                                    <div className="md:col-span-2">
                                        <InfoRow label="Alamat Pemasangan" value={clickedInvoice.customer?.alamatPelanggan} />
                                    </div>
                                </div>
                            </InfoCard>

                            {/* Additional info or instructions */}
                            <div className="p-5 bg-blue-50/50 rounded-lg border border-blue-100/50">
                                <h5 className="text-[11px] font-bold text-blue-700 uppercase mb-2 flex items-center gap-2">
                                    <Info size={14} />
                                    Catatan Billing
                                </h5>
                                <p className="text-[11px] text-blue-600/80 leading-relaxed italic">
                                    Gunakan tombol "Generate Tagihan" di samping header tabel untuk membuat invoice periode berikutnya secara manual untuk pelanggan ini.
                                </p>
                            </div>
                        </div>

                        {/* Column 2: Billing Table (Right Side) */}
                        <div className="space-y-6">
                            {/* Financial Summary (Payment Action) */}
                            <div className="bg-slate-900 px-6 py-6 text-white flex flex-col md:flex-row items-center justify-between gap-4 rounded-lg shadow-lg relative overflow-hidden">
                                <div className="text-center md:text-left z-10">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Setoran Kasir (Terpilih)</p>
                                    <p className="text-3xl font-black text-white">
                                        Rp {paymentConfig.amount.toLocaleString('id-ID')}
                                    </p>
                                    <p className="text-[10px] text-slate-500 italic mt-1">* Centang daftar di bawah untuk bayar sekaligus</p>
                                </div>
                                {(user?.role === 'ADMIN' || user?.role === 'SUPERADMIN' || user?.role === 'FINANCE' || user?.permissions?.some(p => p.startsWith('billing.'))) && (
                                    <div className="flex flex-col gap-3 z-10 w-full md:w-auto">
                                        <CustomButton
                                            variant="primary"
                                            className="h-12 px-10 font-black text-sm shadow-xl hover:scale-105 transition-transform w-full md:w-auto"
                                            onClick={() => setIsPaymentModalOpen(true)}
                                            disabled={invoicesToPay.length === 0 || loading}
                                        >
                                            <CreditCardIcon size={18} className="mr-3" />
                                            PROSES BAYAR {invoicesToPay.length > 0 ? `${invoicesToPay.length} BULAN` : ''}
                                        </CustomButton>

                                        <CustomButton
                                            variant="secondary"
                                            className="h-8 px-6 font-bold text-[10px] bg-white/10 border-white/20 text-white hover:bg-white/20 transition-all w-full md:w-auto"
                                            onClick={handlePromiseCheck}
                                            disabled={invoicesToPay.length === 0 || loading}
                                        >
                                            <Handshake size={14} className="mr-2" />
                                            BUAT JANJI BAYAR
                                        </CustomButton>
                                    </div>
                                )}
                                <div className="absolute right-0 top-0 p-4 opacity-5 pointer-events-none">
                                    <CreditCardIcon size={120} />
                                </div>
                            </div>

                            <div className="rounded-lg border border-slate-100 overflow-hidden bg-white shadow-sm">
                                <div className="bg-slate-50/50 px-5 py-3 border-b border-slate-100 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-2">
                                        <Receipt size={16} className="text-slate-400" />
                                        <h4 className="font-bold text-slate-700 text-[12px] uppercase tracking-wider">Daftar Tagihan & Riwayat</h4>
                                    </div>
                                    {(user?.role === 'ADMIN' || user?.role === 'SUPERADMIN' || user?.role === 'FINANCE') && (
                                        <div className="flex items-center gap-2">
                                            <CustomButton
                                                variant="secondary"
                                                size="sm"
                                                className="h-7 text-[10px] font-extrabold px-3 bg-white border-slate-200 text-slate-600 hover:text-primary transition-all shadow-sm"
                                                onClick={() => setIsGenerateModalOpen(true)}
                                            >
                                                <Plus size={14} className="mr-1" />
                                                GENERATE TAGIHAN
                                            </CustomButton>
                                            <CustomButton
                                                variant="secondary"
                                                size="sm"
                                                className="h-7 text-[10px] font-extrabold px-3 bg-white border-slate-200 text-blue-600 hover:bg-blue-50 transition-all shadow-sm"
                                                onClick={handleRecalculateAllUnpaid}
                                                disabled={loading}
                                            >
                                                <RefreshCw size={14} className={cn("mr-1.5", loading && "animate-spin")} />
                                                REFRESH DATA
                                            </CustomButton>
                                        </div>
                                    )}
                                </div>

                                <CustomTable
                                    data={selectedCustomerInvoices}
                                    columns={[
                                        {
                                            header: "PILIH",
                                            className: "text-center w-[50px]",
                                            render: (row) => (
                                                row.status === 'UNPAID' ? (
                                                    <input
                                                        type="checkbox"
                                                        className="rounded-[4px] border-slate-300 text-primary w-4 h-4 cursor-pointer accent-primary"
                                                        checked={invoicesToPay.includes(row.id)}
                                                        onChange={() => handleToggleInvoiceSelection(row.id)}
                                                    />
                                                ) : (
                                                    <div className="flex justify-center text-green-500"><Check size={18} strokeWidth={4} /></div>
                                                )
                                            )
                                        },
                                        {
                                            header: "TGL BUAT",
                                            render: (row) => format(new Date(row.createdAt), "dd/MM/yyyy", { locale: id })
                                        },
                                        {
                                            header: "PERIODE",
                                            render: (row) => <span className="font-bold text-slate-700">{format(new Date(row.period), "MMMM yyyy", { locale: id })}</span>
                                        },
                                        {
                                            header: "JATUH TEMPO",
                                            className: "text-center",
                                            render: (row) => (
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[10px] font-medium text-slate-500">
                                                        {new Date(row.tanggalJatuhTempo).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </span>
                                                </div>
                                            )
                                        },
                                        { header: "ID TAGIHAN", render: (row) => row.invoiceNumber },
                                        {
                                            header: "PRODUK",
                                            render: (row) => {
                                                const values = getInvoiceValues(row.items);
                                                return <span className="text-[12px]">{values.produk}</span>;
                                            }
                                        },
                                        { header: "BILLING TYPE", className: "text-center", render: (row) => row.type || "PRE" },
                                        {
                                            header: "LAYANAN",
                                            className: "text-right",
                                            render: (row) => {
                                                const values = getInvoiceValues(row.items);
                                                return values.rpProduk.toLocaleString('id-ID');
                                            }
                                        },
                                        {
                                            header: "PPN",
                                            className: "text-right",
                                            render: (row) => {
                                                const values = getInvoiceValues(row.items);
                                                return values.rpPajak.toLocaleString('id-ID');
                                            }
                                        },
                                        {
                                            header: "ADDON",
                                            className: "text-right",
                                            render: (row) => {
                                                const values = getInvoiceValues(row.items);
                                                return values.rpAddon.toLocaleString('id-ID');
                                            }
                                        },
                                        {
                                            header: "DISKON",
                                            className: "text-right",
                                            render: (row) => {
                                                const values = getInvoiceValues(row.items);
                                                return values.rpDiskon.toLocaleString('id-ID');
                                            }
                                        },
                                        {
                                            header: "TOTAL",
                                            className: "text-right",
                                            render: (row) => <span className="font-bold text-primary">{Number(row.amount).toLocaleString('id-ID')}</span>
                                        },
                                        {
                                            header: "STATUS",
                                            className: "text-center",
                                            render: (row) => (
                                                <div className="flex justify-center">
                                                    {row.status === 'PAID' ? (
                                                        <CheckCircle className="text-green-500 w-5 h-5 shadow-sm" />
                                                    ) : (
                                                        <XCircle className="text-orange-400 w-5 h-5 shadow-sm" />
                                                    )}
                                                </div>
                                            )
                                        },
                                        {
                                            header: "AKSI",
                                            className: "text-center w-[80px]",
                                            render: (row) => (
                                                <div className="flex justify-center gap-1">
                                                    <CustomButton
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-slate-400 hover:text-primary"
                                                        onClick={() => handlePrint(row)}
                                                    >
                                                        <Printer size={14} />
                                                    </CustomButton>
                                                    {(user?.role === 'ADMIN' || user?.role === 'SUPERADMIN' || user?.role === 'FINANCE' || user?.permissions?.some(p => p.startsWith('billing.'))) && (
                                                        <>
                                                            <CustomButton
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 text-slate-400 hover:text-blue-600"
                                                                onClick={() => handleRecalculate(row.id)}
                                                                disabled={row.status === 'PAID'}
                                                            >
                                                                <RefreshCw size={14} />
                                                            </CustomButton>
                                                            <CustomButton
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 text-slate-400 hover:text-red-500"
                                                                onClick={() => {
                                                                    setSelectedId(row.id);
                                                                    setIsDeleteModalOpen(true);
                                                                }}
                                                                disabled={row.status === 'PAID'}
                                                            >
                                                                <Trash2 size={14} />
                                                            </CustomButton>
                                                        </>
                                                    )}
                                                </div>
                                            )
                                        }
                                    ]}
                                    emptyMessage="Belum ada riwayat tagihan untuk pelanggan ini."
                                />
                            </div>
                        </div>
                    </div>
                )}
            </ModalDetail>

            <ModalConfirm
                isOpen={isGenerateModalOpen}
                onClose={() => setIsGenerateModalOpen(false)}
                onConfirm={handleGenerateNext}
                title="Generate Tagihan Selanjutnya?"
                message={`Sistem akan membuat invoice untuk periode bulan berikutnya bagi pelanggan "${clickedInvoice?.customer?.namaPelanggan}".`}
                confirmLabel="Ya, Generate"
                loading={loading}
            />

            <ModalConfirm
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Hapus Tagihan?"
                message={`Peringatan: Tagihan "${clickedInvoice?.invoiceNumber}" akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.`}
                confirmLabel="Ya, Hapus"
                variant="danger"
                loading={loading}
            />

            <ModalConfirm
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                onConfirm={handlePay}
                title="Konfirmasi Pembayaran Massal"
                message={
                    <div className="space-y-4 pt-2 text-left">
                        <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg">
                            <h4 className="font-bold text-blue-800 text-xs uppercase mb-2">Tagihan yang akan dibayar:</h4>
                            <div className="space-y-1 max-h-32 overflow-y-auto pr-2">
                                {selectedCustomerInvoices
                                    .filter(inv => invoicesToPay.includes(inv.id))
                                    .map(inv => (
                                        <div key={inv.id} className="flex justify-between text-xs border-b border-blue-100 last:border-0 pb-1 last:pb-0">
                                            <span className="text-blue-600">{format(new Date(inv.period), "MMMM yyyy", { locale: id })}</span>
                                            <span className="font-mono font-bold text-blue-700">Rp {Number(inv.amount).toLocaleString('id-ID')}</span>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <CustomSelect
                                label="Metode Pembayaran"
                                value={paymentConfig.method}
                                onChange={(val) => {
                                    setPaymentConfig(prev => ({ ...prev, method: val }));
                                    if (val === 'CASH') clearProofImage();
                                }}
                                options={[
                                    { label: "TUNAI (CASH)", value: "CASH" },
                                    { label: "TRANSFER BANK", value: "TRANSFER" },
                                    { label: "E-WALLET", value: "EWALLET" },
                                ]}
                            />

                            <CustomCurrencyInput
                                label="Total Bayar (Rp)"
                                value={paymentConfig.amount}
                                onValueChange={(val) => setPaymentConfig(prev => ({ ...prev, amount: parseFloat(val) || 0 }))}
                                disabled={false}
                            />

                            {/* Upload Bukti Transfer */}
                            {(paymentConfig.method === 'TRANSFER' || paymentConfig.method === 'EWALLET') && (
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-tighter ml-1 block">
                                        Bukti Transfer / Pembayaran <span className="text-red-500">*</span>
                                    </label>

                                    {!proofPreview ? (
                                        <div
                                            className="relative border-2 border-dashed border-slate-300 hover:border-primary/50 rounded-xl p-6 text-center cursor-pointer transition-all hover:bg-primary/5 group"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            {isResizing ? (
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                                    <p className="text-xs text-slate-500">Mengompres gambar...</p>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="w-12 h-12 mx-auto mb-3 bg-slate-100 group-hover:bg-primary/10 rounded-full flex items-center justify-center transition-colors">
                                                        <Upload size={20} className="text-slate-400 group-hover:text-primary transition-colors" />
                                                    </div>
                                                    <p className="text-sm font-semibold text-slate-600">Klik untuk upload bukti</p>
                                                    <p className="text-[10px] text-slate-400 mt-1">JPG, PNG • Auto resize max 200KB</p>
                                                </>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50">
                                            <img
                                                src={proofPreview}
                                                alt="Bukti Transfer"
                                                className="w-full max-h-48 object-contain bg-white"
                                            />
                                            <div className="absolute top-2 right-2 flex gap-1">
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                                                    className="w-7 h-7 bg-white/90 hover:bg-white border border-slate-200 rounded-lg flex items-center justify-center shadow-sm transition-all hover:scale-105"
                                                    title="Ganti gambar"
                                                >
                                                    <ImageIcon size={14} className="text-slate-600" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); clearProofImage(); }}
                                                    className="w-7 h-7 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg flex items-center justify-center shadow-sm transition-all hover:scale-105"
                                                    title="Hapus gambar"
                                                >
                                                    <X size={14} className="text-red-500" />
                                                </button>
                                            </div>
                                            <div className="px-3 py-2 bg-green-50 border-t border-green-100 flex items-center gap-2">
                                                <CheckCircle size={14} className="text-green-600" />
                                                <span className="text-[10px] font-bold text-green-700 uppercase">Bukti siap diupload</span>
                                                <span className="text-[10px] text-green-600 ml-auto">
                                                    {Math.round((proofImage?.length || 0) * 0.75 / 1024)}KB
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                }
                confirmLabel={`Bayar Total Rp ${paymentConfig.amount.toLocaleString('id-ID')}`}
                loading={loading}
            />

            <ModalConfirm
                isOpen={isBatchModalOpen}
                onClose={() => setIsBatchModalOpen(false)}
                onConfirm={handleConfirmBatch}
                title="Konfirmasi Batch Generate Tagihan"
                message={
                    batchInfo ? (
                        <div className="space-y-2">
                            <p>Sistem akan membuat tagihan secara massal untuk periode:</p>
                            <p className="font-bold text-lg text-primary">
                                {format(new Date(batchInfo.targetMonth), "MMMM yyyy", { locale: id })}
                            </p>
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm">
                                <p>Total Customer Aktif: <span className="font-bold">{batchInfo.totalActiveCustomers}</span></p>
                                <p>Customer yang butuh tagihan: <span className="font-bold text-orange-600">{batchInfo.customersToGenerate}</span></p>
                            </div>
                            <p className="text-xs text-slate-500 italic mt-2">*Hanya customer aktif yang belum memiliki tagihan pada periode tersebut yang akan dibuatkan invoice.</p>
                        </div>
                    ) : "Sedang memproses data..."
                }
                confirmLabel="Ya, Jalankan Sekarang"
                loading={loading}
            />

            {/* Janji Bayar Modal */}
            <ModalDetail
                isOpen={isPromiseModalOpen}
                onClose={() => setIsPromiseModalOpen(false)}
                onConfirm={handlePromise}
                confirmLabel="Simpan Janji"
                cancelLabel="Batal"
                title="Input Janji Bayar"
                loading={loading}
            >
                <div className="space-y-6">
                    <div className="p-4 bg-orange-50 border border-orange-100 rounded-lg flex items-start gap-3">
                        <AlertCircle className="text-orange-500 mt-0.5" size={18} />
                        <div>
                            <p className="text-[12px] font-bold text-orange-700 uppercase">Perhatian</p>
                            <p className="text-[12px] text-orange-600 leading-relaxed">
                                Memasukkan janji bayar akan <strong>mengaktifkan kembali internet pelanggan</strong> sampai batas tanggal yang ditentukan.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <CustomDatePicker
                            label="Tanggal Janji Bayar"
                            value={promiseConfig.date}
                            onChange={(val) => setPromiseConfig(prev => ({ ...prev, date: val }))}
                        />

                        <div>
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                                Catatan / Alasan
                            </label>
                            <textarea
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all min-h-[100px]"
                                placeholder="Contoh: Gajian tanggal 27, minta tolong aktifkan dulu..."
                                value={promiseConfig.note}
                                onChange={(e) => setPromiseConfig(prev => ({ ...prev, note: e.target.value }))}
                            />
                        </div>
                    </div>
                </div>
            </ModalDetail>

            <ModalConfirm
                isOpen={isPromiseConfirmOpen}
                onClose={() => setIsPromiseConfirmOpen(false)}
                onConfirm={() => {
                    setIsPromiseConfirmOpen(false);
                    setIsPromiseModalOpen(true);
                }}
                title={promiseConfirmConfig.title}
                message={promiseConfirmConfig.message}
                confirmLabel="Ya, Lanjutkan"
                variant={promiseConfirmConfig.variant}
            />

            <ModalMessage
                isOpen={isMessageModalOpen}
                onClose={() => setIsMessageModalOpen(false)}
                type={messageConfig.type}
                title={messageConfig.title}
                message={messageConfig.message}
            />
        </div >
    );
};

export default InvoicePage;
