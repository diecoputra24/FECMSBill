import React, { useState, useEffect, useMemo } from "react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { useConnectionChangeRequestStore } from "@/store/connectionChangeRequestStore";
import type { ConnectionChangeRequest } from "@/store/connectionChangeRequestStore";
import { useCustomerStore } from "@/store/customerStore";
import { useBranchStore } from "@/store/branchStore";
import { useAreaStore } from "@/store/areaStore";
import { usePackageStore } from "@/store/packageStore";
import { CustomTable } from "@/components/ui/custom-table";
import { CustomFilter } from "@/components/ui/custom-filter";
import { ModalDetail } from "@/components/ui/modal-detail";
import { Badge } from "@/components/ui/badge";
import {
    CheckCircle,
    XCircle,
    Clock,
    ArrowRight,
    Eye,
    User as UserIcon,
    Lock,
    Activity,
    Globe
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

// Change comparison component
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

const ConnectionHistoryPage: React.FC = () => {
    const {
        requests,
        loading,
        fetchRequests,
        historyFilterValues,
        appliedHistoryFilters,
        historyPagination,
        setHistoryFilterValues,
        setAppliedHistoryFilters,
        setHistoryPagination,
        resetHistoryFilters
    } = useConnectionChangeRequestStore();

    const { customers, fetchCustomers } = useCustomerStore();
    const { branches, fetchBranches, loading: branchLoading } = useBranchStore();
    const { areas, fetchAreas } = useAreaStore();
    const { packages, fetchPackages } = usePackageStore();

    const [showDetail, setShowDetail] = useState<ConnectionChangeRequest | null>(null);

    useEffect(() => {
        fetchRequests(true);
        fetchCustomers(true);
        fetchBranches();
        fetchAreas();
        fetchPackages();
    }, []);

    const handleSearch = () => {
        setAppliedHistoryFilters({ ...historyFilterValues });
        setHistoryPagination({ currentPage: 1 });
    };

    const handleReset = () => {
        resetHistoryFilters();
    };

    const getPacketName = (paketId?: number) => {
        if (!paketId) return "-";
        const paket = packages.find(p => p.id === paketId);
        return paket?.namaPaket || "-";
    };

    const countChanges = (request: ConnectionChangeRequest) => {
        let count = 0;
        if (request.currentPppUsername !== request.newPppUsername) count++;
        if (request.currentPppPassword !== request.newPppPassword) count++;
        if (request.currentPppService !== request.newPppService) count++;
        if (request.currentSecretMode !== request.newSecretMode) count++;
        if (request.currentPaketId !== request.newPaketId) count++;
        return count;
    };

    const filteredRequests = useMemo(() => {
        return requests.filter(r => {
            // Required Branch Selection
            if (!appliedHistoryFilters.branchId || appliedHistoryFilters.branchId === "") return false;

            const customer = customers.find(c => c.id === r.customerId);

            // Branch filter
            if (appliedHistoryFilters.branchId !== "all") {
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

    const handleExportExcel = async () => {
        if (!filteredRequests.length) {
            alert('Tidak ada data untuk diexport.');
            return;
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Perubahan Koneksi');

        const rows = filteredRequests.map((row, index) => {
            const customer = customers.find(c => c.id === row.customerId);

            return [
                index + 1,
                format(new Date(row.createdAt), "dd/MM/yyyy HH:mm"),
                customer?.idPelanggan || "-",
                customer?.namaPelanggan || "-",
                `${countChanges(row)} FIELD`,
                row.requestNote || "-",
                row.requestedBy || "-",
                row.status,
                row.approvalNote || "-",
                row.approvedBy || "-"
            ];
        });

        worksheet.addTable({
            name: 'ConnectionHistoryTable',
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
                { name: 'Pemohon', filterButton: true },
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
        saveAs(new Blob([buffer]), `Perubahan_Koneksi_${timestamp}.xlsx`);
    };

    const columns = [
        {
            header: "TANGGAL",
            render: (row: ConnectionChangeRequest) => <span className="text-sm">{format(new Date(row.createdAt), "dd/MM/yy HH:mm", { locale: id })}</span>
        },
        {
            header: "ID PELANGGAN",
            render: (row: ConnectionChangeRequest) => {
                const customer = customers.find(c => c.id === row.customerId);
                return <span className="text-sm font-mono text-primary font-bold">{customer?.idPelanggan || "-"}</span>;
            }
        },
        {
            header: "NAMA PELANGGAN",
            render: (row: ConnectionChangeRequest) => {
                const customer = customers.find(c => c.id === row.customerId);
                return <span className="text-sm">{customer?.namaPelanggan || "-"}</span>;
            }
        },
        {
            header: "PERUBAHAN",
            render: (row: ConnectionChangeRequest) => (
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] uppercase font-medium h-6 border-slate-200 bg-slate-50 text-slate-600">
                        {countChanges(row)} FIELD
                    </Badge>
                    <button
                        onClick={() => setShowDetail(row)}
                        className="h-7 px-2 flex items-center gap-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded text-[10px] font-bold transition-all border border-primary/20"
                    >
                        <Eye size={12} />
                        DETAIL
                    </button>
                </div>
            )
        },
        {
            header: "CATATAN PEMOHON",
            render: (row: ConnectionChangeRequest) => (
                <div className="max-w-[150px]">
                    <p className="text-xs text-slate-500 italic line-clamp-1" title={row.requestNote}>
                        {row.requestNote || "-"}
                    </p>
                </div>
            )
        },
        {
            header: "PEMOHON",
            render: (row: ConnectionChangeRequest) => <span className="text-sm font-medium text-slate-600">{row.requestedBy || "-"}</span>
        },
        {
            header: "STATUS",
            render: (row: ConnectionChangeRequest) => (
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
            render: (row: ConnectionChangeRequest) => (
                <div className="max-w-[150px]">
                    <p className="text-xs text-slate-500 italic line-clamp-1" title={row.approvalNote}>
                        {row.approvalNote || "-"}
                    </p>
                </div>
            )
        },
        {
            header: "APPROVED BY",
            render: (row: ConnectionChangeRequest) => <span className="text-sm font-medium text-slate-600">{row.approvedBy || "-"}</span>
        }
    ];

    const filteredAreas = areas.filter(a =>
        historyFilterValues.branchId && historyFilterValues.branchId !== "all" ? a.branchId.toString() === historyFilterValues.branchId : true
    );

    return (
        <div className="space-y-4 pb-20">
            <CustomFilter
                onSearch={handleSearch}
                onReset={handleReset}
                onPrint={handleExportExcel}
                filters={[
                    {
                        label: "Cabang",
                        value: historyFilterValues.branchId,
                        placeholder: "Pilih Cabang",
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

            <ModalDetail
                isOpen={!!showDetail}
                onClose={() => setShowDetail(null)}
                title="Detail Perubahan Koneksi"
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

                        <div className="space-y-1 max-h-[400px] overflow-y-auto pr-2">
                            <ChangeItem label="PPP Username" icon={UserIcon} oldValue={showDetail.currentPppUsername || ""} newValue={showDetail.newPppUsername || ""} />
                            <ChangeItem label="PPP Password" icon={Lock} oldValue="********" newValue="********" />
                            <ChangeItem label="PPP Service" icon={Globe} oldValue={showDetail.currentPppService || ""} newValue={showDetail.newPppService || ""} />
                            <ChangeItem label="Secret Mode" icon={Activity} oldValue={showDetail.currentSecretMode || ""} newValue={showDetail.newSecretMode || ""} />
                            <ChangeItem label="Paket Layanan" oldValue={getPacketName(showDetail.currentPaketId)} newValue={getPacketName(showDetail.newPaketId)} />
                        </div>

                        <div className="pt-4 mt-4 border-t border-slate-100">
                            <div className="flex items-center justify-between mb-1 text-left">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Catatan Pemohon:</span>
                                <span className="text-[10px] font-bold text-primary">Oleh: {showDetail.requestedBy || "Sistem"}</span>
                            </div>
                            <div className="bg-amber-50 rounded p-3 text-xs text-amber-800 italic border border-amber-100 text-left">
                                "{showDetail.requestNote || "Tidak ada catatan"}"
                            </div>
                        </div>

                        {showDetail.status !== 'PENDING' && (
                            <div className="pt-4 mt-4 border-t border-slate-100 italic">
                                <div className="flex items-center justify-between mb-1 text-left">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Catatan Approval:</span>
                                    <span className="text-[10px] font-bold text-primary">Oleh: {showDetail.approvedBy || "-"}</span>
                                </div>
                                <div className="bg-slate-50 rounded p-3 text-xs text-slate-600 border border-slate-100 text-left">
                                    "{showDetail.approvalNote || "Tidak ada catatan approval"}"
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </ModalDetail>
        </div>
    );
};

export default ConnectionHistoryPage;
