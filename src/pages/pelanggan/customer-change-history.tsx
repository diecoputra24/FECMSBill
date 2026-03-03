import React, { useEffect, useMemo, useState } from "react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { useCustomerChangeRequestStore } from "@/store/customerChangeRequestStore";
import type { CustomerChangeRequest } from "@/store/customerChangeRequestStore";
import { useCustomerStore } from "@/store/customerStore";
import { useBranchStore } from "@/store/branchStore";
import { useAreaStore } from "@/store/areaStore";
import { useOdpStore } from "@/store/odpStore";
import { CustomFilter } from "@/components/ui/custom-filter";
import { CustomTable } from "@/components/ui/custom-table";
import { Badge } from "@/components/ui/badge";
import { ModalDetail } from "@/components/ui/modal-detail";
import {
    Eye,
    ArrowRight,
    User,
    MapPin,
    Phone,
    FileText,
    CheckCircle,
    XCircle,
    Clock
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

const CustomerChangeHistoryPage: React.FC = () => {
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
    } = useCustomerChangeRequestStore();

    const { customers, fetchCustomers } = useCustomerStore();
    const { branches, fetchBranches, loading: branchLoading } = useBranchStore();
    const { areas, fetchAreas } = useAreaStore();
    const { odps, fetchOdps } = useOdpStore();

    const [showDetail, setShowDetail] = useState<CustomerChangeRequest | null>(null);

    useEffect(() => {
        fetchRequests(true);
        fetchCustomers();
        fetchBranches();
        fetchAreas();
        fetchOdps();
    }, []);

    const handleSearch = () => {
        setAppliedHistoryFilters({ ...historyFilterValues });
        setHistoryPagination({ currentPage: 1 });
    };

    const handleReset = () => {
        resetHistoryFilters();
    };

    const countChanges = (request: CustomerChangeRequest) => {
        let count = 0;
        if (request.currentNama !== request.newNama) count++;
        if (request.currentAlamat !== request.newAlamat) count++;
        if (request.currentTelepon !== request.newTelepon) count++;
        if (request.currentIdentitas !== request.newIdentitas) count++;
        if (request.currentAreaId !== request.newAreaId) count++;
        if (request.currentOdpId !== request.newOdpId) count++;
        if (request.currentOdpPortId !== request.newOdpPortId) count++;
        if (request.currentLatitude !== request.newLatitude) count++;
        if (request.currentLongitude !== request.newLongitude) count++;
        return count;
    };

    const getAreaName = (areaId: number) => {
        const area = areas.find(a => a.id === areaId);
        return area?.namaArea || "-";
    };

    const getOdpName = (odpId: number | null | undefined) => {
        if (!odpId) return "-";
        const odp = odps.find(o => o.id === odpId);
        return odp?.namaOdp || "-";
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

    const handleExportExcel = async () => {
        if (!filteredRequests.length) {
            alert('Tidak ada data untuk diexport.');
            return;
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Perubahan Data');

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
            name: 'CustomerChangeHistoryTable',
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
        saveAs(new Blob([buffer]), `Perubahan_Data_${timestamp}.xlsx`);
    };

    const columns = [
        {
            header: "TANGGAL",
            render: (row: CustomerChangeRequest) => <span className="text-sm">{format(new Date(row.createdAt), "dd/MM/yy HH:mm", { locale: id })}</span>
        },
        {
            header: "ID PELANGGAN",
            render: (row: CustomerChangeRequest) => {
                const customer = customers.find(c => c.id === row.customerId);
                return <span className="text-sm font-mono text-primary font-bold">{customer?.idPelanggan || "-"}</span>;
            }
        },
        {
            header: "NAMA PELANGGAN",
            render: (row: CustomerChangeRequest) => {
                const customer = customers.find(c => c.id === row.customerId);
                return <span className="text-sm font-medium">{customer?.namaPelanggan || "-"}</span>;
            }
        },
        {
            header: "PERUBAHAN",
            render: (row: CustomerChangeRequest) => (
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
            render: (row: CustomerChangeRequest) => (
                <div className="max-w-[150px]">
                    <p className="text-xs text-slate-500 italic line-clamp-1" title={row.requestNote}>
                        {row.requestNote || "-"}
                    </p>
                </div>
            )
        },
        {
            header: "PEMOHON",
            render: (row: CustomerChangeRequest) => <span className="text-sm font-medium text-slate-600">{row.requestedBy || "-"}</span>
        },
        {
            header: "STATUS",
            render: (row: CustomerChangeRequest) => (
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
            render: (row: CustomerChangeRequest) => (
                <div className="max-w-[150px]">
                    <p className="text-xs text-slate-500 italic line-clamp-1" title={row.approvalNote}>
                        {row.approvalNote || "-"}
                    </p>
                </div>
            )
        },
        {
            header: "APPROVED BY",
            render: (row: CustomerChangeRequest) => <span className="text-sm font-medium text-slate-600">{row.approvedBy || "-"}</span>
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
                    columns={columns}
                    loading={loading}
                    emptyMessage={!appliedHistoryFilters.branchId ? "Pilih Cabang terlebih dahulu." : "Tidak ada data riwayat."}
                    enableSelection={false}
                    pagination={{
                        ...historyPagination,
                        totalItems: filteredRequests.length,
                        onPageChange: (page) => setHistoryPagination({ currentPage: page }),
                        onPageSizeChange: (size) => setHistoryPagination({ pageSize: size, currentPage: 1 })
                    }}
                />
            </div>

            {/* Detail Modal */}
            <ModalDetail
                isOpen={!!showDetail}
                onClose={() => setShowDetail(null)}
                title="Detail Perubahan Data"
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
                            <ChangeItem label="Nama Pelanggan" icon={User} oldValue={showDetail.currentNama} newValue={showDetail.newNama} />
                            <ChangeItem label="Alamat" icon={MapPin} oldValue={showDetail.currentAlamat} newValue={showDetail.newAlamat} />
                            <ChangeItem label="Telepon" icon={Phone} oldValue={showDetail.currentTelepon} newValue={showDetail.newTelepon} />
                            <ChangeItem label="NIK / Identitas" icon={FileText} oldValue={showDetail.currentIdentitas} newValue={showDetail.newIdentitas} />
                            <ChangeItem label="Area" oldValue={getAreaName(showDetail.currentAreaId)} newValue={getAreaName(showDetail.newAreaId)} />
                            <ChangeItem label="ODP" oldValue={getOdpName(showDetail.currentOdpId)} newValue={getOdpName(showDetail.newOdpId)} />
                            <ChangeItem label="Port ODP" oldValue={showDetail.currentOdpPortId?.toString() || "-"} newValue={showDetail.newOdpPortId?.toString() || "-"} />
                            <ChangeItem label="Latitude" oldValue={showDetail.currentLatitude?.toString() || "-"} newValue={showDetail.newLatitude?.toString() || "-"} />
                            <ChangeItem label="Longitude" oldValue={showDetail.currentLongitude?.toString() || "-"} newValue={showDetail.newLongitude?.toString() || "-"} />
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
                    </div>
                )}
            </ModalDetail>
        </div>
    );
};

export default CustomerChangeHistoryPage;
