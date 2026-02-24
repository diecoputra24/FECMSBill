import { useEffect, useState } from "react";
import { useTransactionStore } from "@/store/transactionStore";
import { useBranchStore } from "@/store/branchStore";
import { useAreaStore } from "@/store/areaStore";
import { useAuthStore } from "@/store/authStore";
import { CustomTable } from "@/components/ui/custom-table";
import { CustomFilter } from "@/components/ui/custom-filter";
import { CustomButton } from "@/components/ui/custom-button";
import { Printer, Trash2, CheckCircle, ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { ModalDetail } from "@/components/ui/modal-detail";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/store/transactionStore";

const InfoCard = ({ title, children, className, status }: { title: string; children: React.ReactNode; className?: string; status?: React.ReactNode }) => (
    <div className={cn("rounded-lg overflow-hidden flex flex-col bg-white border border-slate-100 transition-all duration-300", className)}>
        <div className="bg-slate-50 px-5 py-2 border-b border-slate-100 flex justify-between items-center">
            <h4 className="font-bold text-slate-700 text-[12px] uppercase tracking-wider">
                {title}
            </h4>
            {status && <div className="flex items-center gap-2">{status}</div>}
        </div>
        <div className="p-6 bg-white shrink-0">
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

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID').format(amount);
};

const TransactionPage: React.FC = () => {
    const {
        transactions,
        loading,
        fetchTransactions,
        filterValues,
        setFilterValues,
        appliedFilters,
        setAppliedFilters,
        resetFilters,
        pagination,
        deleteTransactions
    } = useTransactionStore();

    const { user } = useAuthStore();
    const { branches, fetchBranches, loading: branchLoading } = useBranchStore();
    const { areas, fetchAreas } = useAreaStore();

    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [lastSelectedId, setLastSelectedId] = useState<number | null>(null);
    const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);

    const selectedTransaction = transactions.find(t => t.id === lastSelectedId);

    useEffect(() => {
        fetchTransactions(pagination.page, pagination.limit);
        fetchBranches();
        fetchAreas();
    }, [fetchTransactions, pagination.page, pagination.limit, appliedFilters, fetchBranches, fetchAreas]);

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


    const handleSearch = () => {
        setAppliedFilters({ ...filterValues });
        fetchTransactions(1, pagination.limit);
    };

    const handleReset = () => {
        resetFilters();
        fetchTransactions(1, pagination.limit);
    };

    const handlePageSizeChange = (size: number) => {
        fetchTransactions(1, size);
    };

    const handlePageChange = (page: number) => {
        fetchTransactions(page, pagination.limit);
    };


    const handleDeleteBulk = async () => {
        if (!selectedIds.length) return;

        if (window.confirm(`Apakah Anda yakin ingin menghapus ${selectedIds.length} transaksi terpilih?`)) {
            try {
                await deleteTransactions(selectedIds);
                setSelectedIds([]);
            } catch (err: any) {
                console.error("Gagal menghapus transaksi:", err);
            }
        }
    };

    const handlePrintStruk = () => {
        if (!selectedTransaction) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const dateFormatted = format(new Date(selectedTransaction.createdAt), "dd/MM/yyyy HH:mm");
        const invoicesHtml = selectedTransaction.invoices?.map(inv => `
            <tr>
                <td style="padding: 5px 0; font-size: 11px;">
                    ${format(new Date(inv.period), "MMMM yyyy", { locale: id })}
                </td>
                <td style="padding: 5px 0; text-align: right; font-size: 11px; font-weight: bold;">
                    Rp ${Number(inv.amount).toLocaleString('id-ID')}
                </td>
            </tr>
        `).join('') || '';

        printWindow.document.write(`
            <html>
                <head>
                    <title>Struk Pembayaran - ${selectedTransaction.referenceNo}</title>
                    <style>
                        @page { size: 58mm auto; margin: 0; }
                        body { font-family: 'Courier New', monospace; padding: 10px; width: 58mm; margin: 0 auto; color: #000; font-size: 11px; }
                        .header { text-align: center; margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 5px; }
                        .title { font-weight: bold; font-size: 14px; margin-bottom: 2px; }
                        .subtitle { font-size: 9px; }
                        .info-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
                        .divider { border-bottom: 1px dashed #000; margin: 5px 0; }
                        .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 12px; margin-top: 5px; }
                        .footer { text-align: center; margin-top: 15px; font-size: 9px; }
                        table { width: 100%; border-collapse: collapse; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="title">CMS BILLING</div>
                        <div class="subtitle">Bukti Pembayaran</div>
                    </div>
                    
                    <div class="info-row">
                        <span>No. Ref</span>
                        <span>${selectedTransaction.referenceNo}</span>
                    </div>
                    <div class="info-row">
                        <span>Tgl</span>
                        <span>${dateFormatted}</span>
                    </div>
                    <div class="info-row">
                        <span>Plg</span>
                        <span>${selectedTransaction.customer?.idPelanggan || '-'}</span>
                    </div>

                    <div class="divider"></div>

                    <table>
                        ${invoicesHtml}
                    </table>

                    <div class="divider"></div>

                    <div class="total-row">
                        <span>TOTAL BAYAR</span>
                        <span>Rp ${selectedTransaction.amountPaid.toLocaleString('id-ID')}</span>
                    </div>
                     <div class="info-row" style="margin-top: 2px;">
                        <span>Metode</span>
                        <span>${selectedTransaction.paymentMethod}</span>
                    </div>

                    <div class="footer">
                        Terima Kasih<br/>
                        Simpan struk ini sebagai bukti pembayaran yang sah.
                    </div>

                    <script>
                        window.onload = function() { window.print(); window.close(); };
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const columns = [
        {
            header: "TANGGAL",
            className: "whitespace-nowrap w-[150px]",
            render: (row: Transaction) => (
                <span className="text-xs text-slate-700">
                    {format(new Date(row.createdAt), "dd MMM yyyy HH:mm", { locale: id })}
                </span>
            )
        },
        {
            header: "ID PELANGGAN",
            className: "w-[120px]",
            render: (row: Transaction) => (
                <span className="text-xs text-slate-700">
                    {row.customer?.idPelanggan || "-"}
                </span>
            )
        },
        {
            header: "NAMA PELANGGAN",
            className: "min-w-[150px]",
            render: (row: Transaction) => (
                <span className="text-xs text-slate-700 uppercase">
                    {row.customer?.namaPelanggan || "Umum/Hapus"}
                </span>
            )
        },
        {
            header: "NO. REFERENSI",
            className: "whitespace-nowrap w-[150px]",
            render: (row: Transaction) => (
                <span className="text-xs text-slate-700 uppercase">
                    {row.referenceNo}
                </span>
            )
        },
        {
            header: "METODE",
            className: "w-[100px]",
            render: (row: Transaction) => (
                <span className="text-xs text-slate-700 uppercase">{row.paymentMethod}</span>
            )
        },
        {
            header: "ITEM BAYAR",
            render: (row: Transaction) => (
                <div className="flex flex-wrap gap-1">
                    {row.invoices?.map((inv, idx) => (
                        <span key={inv.id} className="text-xs text-slate-600">
                            {format(new Date(inv.period), "MMM yyyy", { locale: id })}{idx < (row.invoices?.length || 0) - 1 ? "," : ""}
                        </span>
                    ))}
                    {!row.invoices?.length && <span className="text-xs text-slate-400">-</span>}
                </div>
            )
        },
        {
            header: "TOTAL",
            className: "text-right w-[150px]",
            render: (row: Transaction) => (
                <span className="text-xs text-slate-800">
                    Rp. {formatCurrency(row.amountPaid)}
                </span>
            )
        }
    ];

    return (
        <div className="space-y-4 pb-10">
            <CustomFilter
                onSearch={handleSearch}
                onReset={handleReset}
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
                    },
                    {
                        label: "Metode Bayar",
                        placeholder: "Semua Metode",
                        value: filterValues.method,
                        type: "select",
                        options: [
                            { label: "Semua", value: "all" },
                            { label: "Tunai (CASH)", value: "CASH" },
                            { label: "Transfer (BANK)", value: "TRANSFER" },
                            { label: "E-Wallet", value: "EWALLET" },
                        ],
                        onChange: (val) => setFilterValues({ method: val })
                    },
                    {
                        label: "Rentang Tanggal",
                        placeholder: "Pilih Tanggal",
                        value: filterValues.startDate,
                        endDate: filterValues.endDate,
                        type: "daterange",
                        onChange: (val) => setFilterValues({ startDate: val }),
                        onEndDateChange: (val) => setFilterValues({ endDate: val })
                    },
                    {
                        label: "Cari No. Ref / Pelanggan",
                        placeholder: "Cari...",
                        value: filterValues.search,
                        type: "text",
                        onChange: (val) => setFilterValues({ search: val })
                    }
                ]}
            />

            <CustomTable
                data={transactions}
                columns={columns}
                loading={loading}
                emptyMessage="Belum ada riwayat transaksi."
                pagination={{
                    currentPage: pagination.page,
                    pageSize: pagination.limit,
                    totalItems: pagination.total,
                    onPageChange: handlePageChange,
                    onPageSizeChange: handlePageSizeChange
                }}
                enableSelection={true}
                selectedIds={selectedIds}
                onMultiSelectionChange={(ids) => setSelectedIds(ids as number[])}
                onRowClick={(row) => {
                    setLastSelectedId(row.id);
                    setIsDetailModalOpen(true);
                }}
                actionButtons={
                    selectedIds.length > 0 && (
                        <div className="flex gap-2">
                            {selectedIds.length === 1 && (
                                <CustomButton
                                    variant="secondary"
                                    size="sm"
                                    className="h-8 gap-2 px-4 bg-white border-slate-200 text-slate-600 hover:text-primary hover:bg-slate-50 shadow-sm"
                                    onClick={() => {
                                        setLastSelectedId(selectedIds[0]);
                                        handlePrintStruk();
                                    }}
                                >
                                    <Printer size={16} />
                                    <span>Cetak Struk</span>
                                </CustomButton>
                            )}
                            {(user?.role === 'ADMIN' || user?.role === 'SUPERADMIN' || user?.role === 'FINANCE' || user?.permissions?.some(p => p.startsWith('billing.'))) && selectedIds.length > 0 && (
                                <>
                                    <span className="text-xs font-bold text-slate-400 self-center mr-2">
                                        {selectedIds.length} terpilih
                                    </span>
                                    <CustomButton
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 gap-2 px-4 text-red-500 hover:text-red-600 hover:bg-red-50"
                                        onClick={handleDeleteBulk}
                                    >
                                        <Trash2 size={16} />
                                        <span>Hapus ({selectedIds.length})</span>
                                    </CustomButton>
                                </>
                            )}
                        </div>
                    )
                }
            />

            <ModalDetail
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                title={`Detail Transaksi`}
                confirmLabel="Kembali"
                onConfirm={() => setIsDetailModalOpen(false)}
                cancelLabel=""
                maxWidth="full"
            >
                {selectedTransaction && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Column 1: Transaction Info */}
                        <div className="space-y-4">
                            <InfoCard
                                title="DATA TRANSAKSI"
                                status={
                                    <Badge variant="success" className="font-bold text-[9px] uppercase h-6 px-2 rounded-sm flex items-center gap-1">
                                        <CheckCircle size={10} />
                                        BERHASIL
                                    </Badge>
                                }
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                    <InfoRow label="No. Referensi" value={<span className="font-mono text-primary font-bold">{selectedTransaction.referenceNo}</span>} />
                                    <InfoRow label="Tanggal Transaksi" value={format(new Date(selectedTransaction.createdAt), "dd MMMM yyyy HH:mm", { locale: id })} />
                                    <InfoRow label="ID Pelanggan" value={<span className="font-mono font-bold">{selectedTransaction.customer?.idPelanggan || "-"}</span>} />
                                    <InfoRow label="Nama Pelanggan" value={<span className="uppercase font-bold">{selectedTransaction.customer?.namaPelanggan || "UMUM/HAPUS"}</span>} />
                                    <InfoRow label="Metode Bayar" value={<span className="font-bold">{selectedTransaction.paymentMethod}</span>} />
                                    <InfoRow label="Admin Penerima" value={`Admin ID: ${selectedTransaction.adminId}`} />
                                </div>
                            </InfoCard>
                        </div>

                        {/* Column 2: Payment Items */}
                        <div className="space-y-4">
                            <InfoCard title="RINCIAN ITEM DIBAYAR">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        {selectedTransaction.invoices?.map((inv) => (
                                            <div key={inv.id} className="py-2 border-b border-dashed border-slate-100 last:border-0 opacity-70">
                                                <div className="flex flex-col">
                                                    <span className="text-[12px] font-bold text-slate-600 uppercase">Tagihan {format(new Date(inv.period), "MMMM yyyy", { locale: id })}</span>
                                                    <span className="text-[9px] text-slate-400 font-mono">#{inv.invoiceNumber}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {(() => {
                                        let pkg = 0, add = 0, disc = 0, tax = 0;
                                        selectedTransaction.invoices?.forEach(inv => {
                                            const items = inv.items || [];
                                            if (items.length === 0) {
                                                // Fallback: treat entire amount as package if no items
                                                pkg += Number(inv.amount);
                                            } else {
                                                items.forEach(item => {
                                                    const amt = Number(item.amount);
                                                    if (item.itemType === 'PACKAGE') pkg += amt;
                                                    else if (item.itemType === 'ADDON') add += amt;
                                                    else if (item.itemType === 'DISCOUNT') disc += Math.abs(amt);
                                                    else if (item.itemType === 'TAX') tax += amt;
                                                });
                                            }
                                        });

                                        return (
                                            <div className="bg-slate-50/50 rounded-lg p-4 space-y-2 border border-slate-100">
                                                <div className="flex justify-between text-[11px] font-semibold text-slate-500 uppercase">
                                                    <span>Subtotal Paket</span>
                                                    <span className="text-slate-700">Rp. {formatCurrency(pkg)}</span>
                                                </div>
                                                <div className="flex justify-between text-[11px] font-semibold text-slate-500 uppercase">
                                                    <span>Layanan Tambahan (Addon)</span>
                                                    <span className="text-slate-700">Rp. {formatCurrency(add)}</span>
                                                </div>
                                                <div className="flex justify-between text-[11px] font-semibold text-green-600 uppercase">
                                                    <span>Potongan Diskon</span>
                                                    <span>- Rp. {formatCurrency(disc)}</span>
                                                </div>
                                                <div className="flex justify-between text-[11px] font-semibold text-slate-500 uppercase">
                                                    <span>PPN</span>
                                                    <span className="text-slate-700">Rp. {formatCurrency(tax)}</span>
                                                </div>
                                                <div className="pt-2 mt-2 border-t border-slate-200 flex justify-between items-center">
                                                    <span className="font-bold text-slate-800 uppercase text-[12px] tracking-wider">Total Pembayaran</span>
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-2xl font-black text-primary">Rp. {formatCurrency(selectedTransaction.amountPaid)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    <div className="flex justify-end pt-2">
                                        <CustomButton
                                            variant="primary"
                                            className="px-8 h-10 gap-2 font-bold shadow-sm"
                                            onClick={handlePrintStruk}
                                        >
                                            <Printer size={16} />
                                            Cetak Struk
                                        </CustomButton>
                                    </div>
                                </div>
                            </InfoCard>

                            {/* Bukti Transfer */}
                            {selectedTransaction.proofImage && (
                                <InfoCard title="BUKTI TRANSFER / PEMBAYARAN">
                                    <div className="space-y-3">
                                        <div
                                            className="relative rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white cursor-pointer hover:shadow-md transition-shadow"
                                            onClick={() => setIsImagePreviewOpen(true)}
                                        >
                                            <img
                                                src={selectedTransaction.proofImage}
                                                alt="Bukti Transfer"
                                                className="w-full max-h-64 object-contain bg-slate-50"
                                            />
                                            <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
                                                <ImageIcon size={14} className="text-slate-400" />
                                                <span className="text-[10px] font-semibold text-slate-500 uppercase">Klik untuk memperbesar</span>
                                            </div>
                                        </div>
                                    </div>
                                </InfoCard>
                            )}
                        </div>
                    </div>
                )}
            </ModalDetail>

            {/* Full screen image preview */}
            {isImagePreviewOpen && selectedTransaction?.proofImage && (
                <div
                    className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center cursor-pointer animate-in fade-in duration-200"
                    onClick={() => setIsImagePreviewOpen(false)}
                >
                    <div className="relative max-w-[90vw] max-h-[90vh]">
                        <img
                            src={selectedTransaction.proofImage}
                            alt="Bukti Transfer"
                            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                        />
                        <button
                            className="absolute top-3 right-3 w-10 h-10 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all"
                            onClick={() => setIsImagePreviewOpen(false)}
                        >
                            ✕
                        </button>
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white px-4 py-1.5 rounded-full text-xs font-medium">
                            Bukti Transfer • {selectedTransaction.referenceNo}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TransactionPage;
