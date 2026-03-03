import React, { useState, useEffect, useMemo } from "react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { useDiscountRequestStore } from "@/store/discountRequestStore";
import type { DiscountRequest } from "@/store/discountRequestStore";
import { useCustomerStore } from "@/store/customerStore";
import { useAreaStore } from "@/store/areaStore";
import { useBranchStore } from "@/store/branchStore";
import { CustomTable } from "@/components/ui/custom-table";
import { CustomFilter } from "@/components/ui/custom-filter";
import { Badge } from "@/components/ui/badge";
import { ModalDetail } from "@/components/ui/modal-detail";
import {
    Percent,
    Eye,
    ArrowRight
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const DiscountHistoryPage: React.FC = () => {
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
    } = useDiscountRequestStore();

    const { customers, fetchCustomers } = useCustomerStore();
    const { branches, fetchBranches, loading: branchLoading } = useBranchStore();
    const { areas, fetchAreas } = useAreaStore();

    const [showDetail, setShowDetail] = useState<DiscountRequest | null>(null);

    useEffect(() => {
        fetchRequests(true);
        fetchCustomers(true);
        fetchBranches();
        fetchAreas();
    }, []);

    const handleSearch = () => {
        setAppliedHistoryFilters({ ...historyFilterValues });
        setHistoryPagination({ currentPage: 1 });
    };

    const handleReset = () => {
        resetHistoryFilters();
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case "APPROVED": return "success";
            case "REJECTED": return "destructive";
            default: return "warning";
        }
    };

    const filteredRequests = useMemo(() => {
        return requests.filter(r => {
            if (r.status === 'PENDING') return false;

            const customer = customers.find(c => c.id === r.customerId);

            if (appliedHistoryFilters.branchId && appliedHistoryFilters.branchId !== "" && appliedHistoryFilters.branchId !== "all") {
                if (customer?.area?.branchId?.toString() !== appliedHistoryFilters.branchId) return false;
            }

            if (appliedHistoryFilters.areaId && appliedHistoryFilters.areaId !== "" && appliedHistoryFilters.areaId !== "all") {
                if (customer?.areaId.toString() !== appliedHistoryFilters.areaId) return false;
            }

            if (appliedHistoryFilters.status && appliedHistoryFilters.status !== "all") {
                if (r.status !== appliedHistoryFilters.status) return false;
            }

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
        const worksheet = workbook.addWorksheet('History Approval Diskon');

        const rows = filteredRequests.map((row, index) => {
            const customer = customers.find(c => c.id === row.customerId);

            return [
                index + 1,
                format(new Date(row.createdAt), "dd/MM/yyyy HH:mm"),
                customer?.idPelanggan || "-",
                customer?.namaPelanggan || "-",
                Number(row.currentDiscount || 0),
                Number(row.newDiscount || 0),
                row.requestNote || "-",
                row.requestedBy || "-",
                row.status,
                row.approvalNote || "-",
                row.approvedBy || "-"
            ];
        });

        worksheet.addTable({
            name: 'DiscountApprovalHistoryTable',
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
                { name: 'Diskon Lama', filterButton: true },
                { name: 'Diskon Baru', filterButton: true },
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
        saveAs(new Blob([buffer]), `History_Approval_Diskon_${timestamp}.xlsx`);
    };

    const columns = [
        {
            header: "TANGGAL",
            render: (row: DiscountRequest) => <span className="text-sm">{format(new Date(row.createdAt), "dd/MM/yy HH:mm", { locale: id })}</span>
        },
        {
            header: "ID PELANGGAN",
            render: (row: DiscountRequest) => {
                const customer = customers.find(c => c.id === row.customerId);
                return <span className="text-sm font-mono text-primary font-bold">{customer?.idPelanggan || "-"}</span>;
            }
        },
        {
            header: "NAMA PELANGGAN",
            render: (row: DiscountRequest) => {
                const customer = customers.find(c => c.id === row.customerId);
                return <span className="text-sm">{customer?.namaPelanggan || "-"}</span>;
            }
        },
        {
            header: "PERUBAHAN DISKON",
            render: (row: DiscountRequest) => (
                <div
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowDetail(row);
                    }}
                    className="flex justify-center"
                >
                    <Badge variant="secondary" className="text-[10px] uppercase font-bold h-6 border-primary/20 bg-primary/5 text-primary cursor-pointer hover:bg-primary hover:text-white transition-all flex items-center gap-1.5 px-3">
                        <Percent size={11} />
                        LIHAT DISKON
                        <span className="opacity-40 text-[9px]">|</span>
                        <Eye size={12} />
                    </Badge>
                </div>
            )
        },
        {
            header: "PEMOHON",
            render: (row: DiscountRequest) => <span className="text-sm font-semibold text-slate-700">{row.requestedBy || "-"}</span>
        },
        {
            header: "STATUS",
            render: (row: DiscountRequest) => (
                <Badge variant={getStatusVariant(row.status)} className="text-[10px] uppercase font-bold px-2 py-0.5">
                    {row.status}
                </Badge>
            )
        },
        {
            header: "APPROVER",
            render: (row: DiscountRequest) => <span className="text-sm font-semibold text-slate-700">{row.approvedBy || "-"}</span>
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
                        placeholder: "Semua Cabang",
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
                        label: "Status",
                        placeholder: "Semua Status",
                        value: historyFilterValues.status,
                        type: "select",
                        options: [
                            { label: "Semua Status", value: "all" },
                            { label: "APPROVED", value: "APPROVED" },
                            { label: "REJECTED", value: "REJECTED" }
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
            />

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-1">
                <CustomTable
                    data={paginatedRequests}
                    columns={columns}
                    loading={loading}
                    emptyMessage="Tidak ada history approval."
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
                title="Detail Approval Diskon"
                maxWidth="md"
                cancelLabel="Tutup"
            >
                {showDetail && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center bg-slate-50 rounded-lg p-3 border border-slate-100 mb-4">
                            <div className="grid grid-cols-2 gap-4 flex-1">
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ID PELANGGAN</span>
                                    <span className="text-sm font-bold text-primary">{customers.find(c => c.id === showDetail.customerId)?.idPelanggan || "-"}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">NAMA PELANGGAN</span>
                                    <span className="text-sm font-bold text-slate-800">{customers.find(c => c.id === showDetail.customerId)?.namaPelanggan || "-"}</span>
                                </div>
                            </div>
                            <Badge variant={getStatusVariant(showDetail.status)} className="px-3 py-1 uppercase text-xs font-bold">
                                {showDetail.status}
                            </Badge>
                        </div>

                        <div className="flex items-center justify-center gap-6 py-4">
                            <div className="text-center">
                                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Diskon Sebelumnya</p>
                                <p className="text-lg text-slate-500 font-bold line-through">Rp {Number(showDetail.currentDiscount || 0).toLocaleString('id-ID')}</p>
                            </div>
                            <div className="text-slate-300">
                                <ArrowRight size={24} />
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold text-primary">Diskon Yang Diajukan</p>
                                <p className="text-xl text-green-600 font-bold">Rp {Number(showDetail.newDiscount || 0).toLocaleString('id-ID')}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 mt-4">
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Catatan Pemohon:</span>
                                <div className="bg-amber-50 rounded p-3 text-xs text-amber-800 italic border border-amber-100 h-[80px] overflow-y-auto">
                                    "{showDetail.requestNote || "Tidak ada catatan pemohon"}"
                                </div>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Catatan Approval:</span>
                                <div className="bg-slate-50 rounded p-3 text-xs text-slate-700 italic border border-slate-100 h-[80px] overflow-y-auto">
                                    "{showDetail.approvalNote || "Tidak ada catatan approval"}"
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 mt-4 text-[11px]">
                            <div>
                                <span className="font-bold text-slate-500 uppercase tracking-wider mr-2">Diajukan Oleh:</span>
                                <span className="text-slate-700">{showDetail.requestedBy || "-"}</span>
                                <br />
                                <span className="text-slate-400">{format(new Date(showDetail.createdAt), "dd MMM yyyy HH:mm", { locale: id })}</span>
                            </div>
                            <div>
                                <span className="font-bold text-slate-500 uppercase tracking-wider mr-2">Disetujui/Ditolak Oleh:</span>
                                <span className="text-slate-700">{showDetail.approvedBy || "-"}</span>
                                <br />
                                <span className="text-slate-400">{format(new Date(showDetail.updatedAt), "dd MMM yyyy HH:mm", { locale: id })}</span>
                            </div>
                        </div>
                    </div>
                )}
            </ModalDetail>
        </div>
    );
};

export default DiscountHistoryPage;
