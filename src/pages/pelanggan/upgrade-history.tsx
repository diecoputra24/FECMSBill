import React, { useState, useEffect, useMemo } from "react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { useUpgradeRequestStore } from "@/store/upgradeRequestStore";
import type { UpgradeRequest } from "@/store/upgradeRequestStore";
import { useCustomerStore } from "@/store/customerStore";
import { usePackageStore } from "@/store/packageStore";
import { useBranchStore } from "@/store/branchStore";
import { useAreaStore } from "@/store/areaStore";
import { CustomTable } from "@/components/ui/custom-table";
import { CustomFilter } from "@/components/ui/custom-filter";
import { ModalDetail } from "@/components/ui/modal-detail";
import { Badge } from "@/components/ui/badge";
import {
    CheckCircle,
    XCircle,
    Clock,
    TrendingUp,
    TrendingDown,
    ArrowRight,
    Eye
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";

const UpgradeHistoryPage: React.FC = () => {
    const {
        requests,
        fetchRequests,
        loading,
        historyFilterValues,
        appliedHistoryFilters,
        historyPagination,
        setHistoryFilterValues,
        setAppliedHistoryFilters,
        setHistoryPagination,
        resetHistoryFilters
    } = useUpgradeRequestStore();

    const { customers, fetchCustomers } = useCustomerStore();
    const { packages, fetchPackages } = usePackageStore();
    const { branches, fetchBranches, loading: branchLoading } = useBranchStore();
    const { areas, fetchAreas } = useAreaStore();

    const [showDetail, setShowDetail] = useState<UpgradeRequest | null>(null);

    useEffect(() => {
        fetchRequests(true);
        fetchCustomers();
        fetchPackages();
        fetchBranches();
        fetchAreas();
    }, []);

    const handleSearch = () => {
        setAppliedHistoryFilters(historyFilterValues);
        setHistoryPagination({ currentPage: 1 });
    };

    const handleReset = () => {
        resetHistoryFilters();
    };

    const filteredRequests = useMemo(() => {
        return requests.filter(r => {
            // Required Branch Selection
            if (!appliedHistoryFilters.branchId || appliedHistoryFilters.branchId === "") return false;

            const customer = customers.find(c => c.id === r.customerId);

            // Branch filter
            if (appliedHistoryFilters.branchId && appliedHistoryFilters.branchId !== "" && appliedHistoryFilters.branchId !== "all") {
                if (customer?.area?.branchId?.toString() !== appliedHistoryFilters.branchId) return false;
            }

            // Area filter
            if (appliedHistoryFilters.areaId && appliedHistoryFilters.areaId !== "" && appliedHistoryFilters.areaId !== "all") {
                if (customer?.areaId.toString() !== appliedHistoryFilters.areaId) return false;
            }

            // Status filter
            if (appliedHistoryFilters.status !== "all") {
                if (r.status !== appliedHistoryFilters.status) return false;
            }

            // Search
            const searchTerm = appliedHistoryFilters.search.toLowerCase();
            if (searchTerm) {
                const customerId = customer?.idPelanggan?.toLowerCase() || "";
                const customerName = customer?.namaPelanggan?.toLowerCase() || "";
                if (!customerId.includes(searchTerm) && !customerName.includes(searchTerm)) return false;
            }

            return true;
        });
    }, [requests, customers, appliedHistoryFilters]);

    const paginatedRequests = filteredRequests.slice(
        (historyPagination.currentPage - 1) * historyPagination.pageSize,
        historyPagination.currentPage * historyPagination.pageSize
    );

    const getPacketName = (paketId: number) => packages.find(p => p.id === paketId)?.namaPaket || "-";
    const getPacketPrice = (paketId: number) => Number(packages.find(p => p.id === paketId)?.hargaPaket) || 0;

    const handleExportExcel = async () => {
        if (!filteredRequests.length) {
            alert('Tidak ada data untuk diexport.');
            return;
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Data Perubahan Paket');

        const rows = filteredRequests.map((row, index) => {
            const customer = customers.find(c => c.id === row.customerId);
            const priceDiff = getPacketPrice(row.newPaketId) - getPacketPrice(row.currentPaketId);
            const isUpgrade = priceDiff >= 0;

            return [
                index + 1,
                format(new Date(row.createdAt), "dd/MM/yyyy HH:mm"),
                customer?.idPelanggan || "-",
                customer?.namaPelanggan || "-",
                isUpgrade ? "UPGRADE" : "DOWNGRADE",
                row.requestNote || "-",
                row.requestedBy || "-",
                row.status,
                row.approvalNote || "-",
                row.approvedBy || "-"
            ];
        });

        worksheet.addTable({
            name: 'UpgradeHistoryTable',
            ref: 'A1',
            headerRow: true,
            totalsRow: false,
            style: {
                theme: 'TableStyleMedium2',
                showRowStripes: true,
            },
            columns: [
                { name: 'No', filterButton: true },
                { name: 'Tanggal', filterButton: true },
                { name: 'ID Pelanggan', filterButton: true },
                { name: 'Nama Pelanggan', filterButton: true },
                { name: 'Perubahan', filterButton: true },
                { name: 'Catatan Pemohon', filterButton: true },
                { name: 'Requested By', filterButton: true },
                { name: 'Status', filterButton: true },
                { name: 'Catatan Approval', filterButton: true },
                { name: 'Approved By', filterButton: true }
            ],
            rows: rows,
        });

        worksheet.columns.forEach(column => {
            if (column.values) {
                let maxLength = 0;
                column.values.forEach(v => {
                    const columnLength = v ? v.toString().length : 0;
                    if (columnLength > maxLength) {
                        maxLength = columnLength;
                    }
                });
                column.width = maxLength < 10 ? 10 : maxLength + 2;
            }
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const timestamp = new Date().toISOString().replace(/[:T]/g, '-').split('.')[0];
        saveAs(new Blob([buffer]), `Upgrade_History_${timestamp}.xlsx`);
    };

    const columns = [
        {
            header: "TANGGAL",
            render: (row: UpgradeRequest) => <span className="text-sm">{format(new Date(row.createdAt), "dd/MM/yy HH:mm", { locale: id })}</span>
        },
        {
            header: "ID PELANGGAN",
            render: (row: UpgradeRequest) => {
                const customer = customers.find(c => c.id === row.customerId);
                return <span className="text-sm text-slate-700">{customer?.idPelanggan || "-"}</span>;
            }
        },
        {
            header: "NAMA PELANGGAN",
            render: (row: UpgradeRequest) => {
                const customer = customers.find(c => c.id === row.customerId);
                return <span className="text-sm font-medium">{customer?.namaPelanggan || "-"}</span>;
            }
        },
        {
            header: "PERUBAHAN",
            render: (row: UpgradeRequest) => {
                const priceDiff = getPacketPrice(row.newPaketId) - getPacketPrice(row.currentPaketId);
                const isUpgrade = priceDiff >= 0;
                return (
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] uppercase font-medium h-6 border-slate-200 bg-slate-50 text-slate-600">
                            {isUpgrade ? "UPGRADE" : "DOWNGRADE"}
                        </Badge>
                        <button
                            onClick={() => setShowDetail(row)}
                            className="h-7 px-2 flex items-center gap-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded text-[10px] font-bold transition-all border border-primary/20"
                        >
                            <Eye size={12} />
                            DETAIL
                        </button>
                    </div>
                );
            }
        },
        {
            header: "CATATAN PEMOHON",
            render: (row: UpgradeRequest) => (
                <div className="max-w-[150px]">
                    <p className="text-xs text-slate-500 italic line-clamp-1" title={row.requestNote}>
                        {row.requestNote || "-"}
                    </p>
                </div>
            )
        },
        {
            header: "REQUESTED BY",
            render: (row: UpgradeRequest) => <span className="text-sm font-medium text-slate-600">{row.requestedBy || "-"}</span>
        },
        {
            header: "STATUS",
            render: (row: UpgradeRequest) => (
                <div className="flex items-center gap-1.5">
                    {row.status === 'APPROVED' ? (
                        <Badge variant="success" className="text-[10px] font-bold py-0.5 h-6 uppercase leading-none border-green-200">
                            <CheckCircle size={10} className="mr-1" /> Approved
                        </Badge>
                    ) : row.status === 'REJECTED' ? (
                        <Badge variant="destructive" className="text-[10px] font-bold py-0.5 h-6 uppercase leading-none border-red-200">
                            <XCircle size={10} className="mr-1" /> Rejected
                        </Badge>
                    ) : (
                        <Badge variant="warning" className="text-[10px] font-bold py-0.5 h-6 uppercase leading-none border-amber-200">
                            <Clock size={10} className="mr-1" /> Pending
                        </Badge>
                    )}
                </div>
            )
        },
        {
            header: "CATATAN APPROVAL",
            render: (row: UpgradeRequest) => (
                <div className="max-w-[150px]">
                    <p className="text-xs text-slate-500 italic line-clamp-1" title={row.approvalNote}>
                        {row.approvalNote || "-"}
                    </p>
                </div>
            )
        },
        {
            header: "APPROVED BY",
            render: (row: UpgradeRequest) => <span className="text-sm font-medium text-slate-600">{row.approvedBy || "-"}</span>
        }
    ];

    const priceDiffDetail = showDetail ? (getPacketPrice(showDetail.newPaketId) - getPacketPrice(showDetail.currentPaketId)) : 0;

    const filteredAreas = areas.filter(a =>
        historyFilterValues.branchId && historyFilterValues.branchId !== "all" ? a.branchId.toString() === historyFilterValues.branchId : true
    );

    return (
        <div className="space-y-4 pb-20">
            <CustomFilter
                onSearch={handleSearch}
                onReset={handleReset}
                onPrint={handleExportExcel}
                loading={loading}
                filters={[
                    {
                        label: "Cabang",
                        placeholder: "Pilih Cabang",
                        value: historyFilterValues.branchId,
                        type: "select",
                        options: [{ label: "Semua Cabang", value: "all" }, ...branches.map(b => ({ label: b.namaBranch, value: b.id.toString() }))],
                        loading: branchLoading,
                        onChange: (val: string) => setHistoryFilterValues({ branchId: val, areaId: "" })
                    },
                    {
                        label: "Area",
                        placeholder: historyFilterValues.branchId ? "Semua Area" : "Pilih Cabang dulu",
                        value: historyFilterValues.areaId,
                        type: "select",
                        disabled: !historyFilterValues.branchId,
                        options: [{ label: "Semua Area", value: "all" }, ...filteredAreas.map(a => ({ label: a.namaArea, value: a.id.toString() }))],
                        onChange: (val: string) => setHistoryFilterValues({ areaId: val })
                    },
                    {
                        label: "Status Approval",
                        value: historyFilterValues.status,
                        placeholder: "Semua Status",
                        type: "select",
                        options: [
                            { label: "Semua Status", value: "all" },
                            { label: "Pending", value: "PENDING" },
                            { label: "Approved", value: "APPROVED" },
                            { label: "Rejected", value: "REJECTED" },
                        ],
                        onChange: (val: string) => setHistoryFilterValues({ status: val })
                    },
                    {
                        label: "Cari Pelanggan",
                        placeholder: "Nama atau ID Pelanggan...",
                        value: historyFilterValues.search,
                        type: "text",
                        onChange: (val: string) => setHistoryFilterValues({ search: val })
                    }
                ]}
            >
            </CustomFilter>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-1">
                <CustomTable
                    data={paginatedRequests}
                    columns={columns as any}
                    loading={loading}
                    emptyMessage={!appliedHistoryFilters.branchId ? "Pilih Cabang terlebih dahulu." : "Tidak ada data riwayat."}
                    enableSelection={false}
                    pagination={{
                        currentPage: historyPagination.currentPage,
                        totalItems: filteredRequests.length,
                        pageSize: historyPagination.pageSize,
                        onPageChange: (page) => setHistoryPagination({ currentPage: page }),
                        onPageSizeChange: (size) => setHistoryPagination({ pageSize: size, currentPage: 1 })
                    }}
                />
            </div>

            {/* Detail Modal */}
            <ModalDetail
                isOpen={!!showDetail}
                onClose={() => setShowDetail(null)}
                title="Detail Perubahan Paket"
                maxWidth="md"
                cancelLabel="Tutup"
            >
                {showDetail && (
                    <div className="space-y-4">
                        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 mb-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ID PELANGGAN</span>
                                    <span className="text-sm font-bold text-primary">{customers.find(c => c.id === showDetail.customerId)?.idPelanggan || "-"}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">NAMA PELANGGAN</span>
                                    <span className="text-sm font-bold text-slate-800">{customers.find(c => c.id === showDetail.customerId)?.namaPelanggan || "-"}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-lg shadow-sm">
                            <div className="flex-1">
                                <p className="text-[10px] text-slate-400 uppercase font-black mb-1">Paket Lama</p>
                                <p className="text-xs font-bold text-slate-600 line-through">{getPacketName(showDetail.currentPaketId)}</p>
                                <p className="text-[10px] text-slate-400">Rp {getPacketPrice(showDetail.currentPaketId).toLocaleString('id-ID')}</p>
                            </div>
                            <ArrowRight className="mx-4 text-slate-300" size={16} />
                            <div className="flex-1 text-right">
                                <p className="text-[10px] text-primary uppercase font-black mb-1">Paket Baru</p>
                                <p className="text-xs font-bold text-primary">{getPacketName(showDetail.newPaketId)}</p>
                                <p className="text-[10px] text-primary">Rp {getPacketPrice(showDetail.newPaketId).toLocaleString('id-ID')}</p>
                            </div>
                        </div>

                        <div className={cn(
                            "p-3 rounded-lg border flex items-center justify-between",
                            priceDiffDetail >= 0 ? "bg-green-50 border-green-100" : "bg-amber-50 border-amber-100"
                        )}>
                            <div className="flex items-center gap-2">
                                {priceDiffDetail >= 0 ? <TrendingUp size={16} className="text-green-600" /> : <TrendingDown size={16} className="text-amber-600" />}
                                <span className="text-[11px] font-bold text-slate-600 uppercase">Tipe Perubahan:</span>
                            </div>
                            <span className={cn(
                                "text-sm font-black",
                                priceDiffDetail >= 0 ? "text-green-600" : "text-amber-600"
                            )}>
                                {priceDiffDetail >= 0 ? "UPGRADE" : "DOWNGRADE"} ({priceDiffDetail >= 0 ? "+" : ""}Rp {priceDiffDetail.toLocaleString('id-ID')})
                            </span>
                        </div>

                        <div className="pt-4 mt-4 border-t border-slate-100 flex flex-col gap-4">
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Catatan Pemohon:</span>
                                <div className="bg-amber-50 rounded p-3 text-xs text-amber-800 italic border border-amber-100 font-medium">
                                    "{showDetail.requestNote || "Tidak ada catatan"}"
                                </div>
                            </div>
                            {showDetail.approvalNote && (
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Catatan Approval:</span>
                                    <div className="bg-slate-50 rounded p-3 text-xs text-slate-700 border border-slate-200">
                                        "{showDetail.approvalNote}"
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg border border-slate-100 mt-4">
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Requested By</p>
                                <p className="text-xs font-medium text-slate-700">{showDetail.requestedBy || "-"}</p>
                                <p className="text-[9px] text-slate-400">{format(new Date(showDetail.createdAt), "dd MMM yyyy HH:mm", { locale: id })}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Approved By</p>
                                <p className="text-xs font-medium text-slate-700">{showDetail.approvedBy || "-"}</p>
                                <p className="text-[9px] text-slate-400">{showDetail.updatedAt ? format(new Date(showDetail.updatedAt), "dd MMM yyyy HH:mm", { locale: id }) : "-"}</p>
                            </div>
                        </div>
                    </div>
                )}
            </ModalDetail>
        </div>
    );
};

export default UpgradeHistoryPage;
