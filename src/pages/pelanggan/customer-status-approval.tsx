import React, { useState, useEffect, useMemo } from "react";
import { useCustomerStatusRequestStore } from "@/store/customerStatusRequestStore";
import type { CustomerStatusRequest } from "@/store/customerStatusRequestStore";
import { useCustomerStore } from "@/store/customerStore";
import { useBranchStore } from "@/store/branchStore";
import { useAreaStore } from "@/store/areaStore";
import { CustomTable } from "@/components/ui/custom-table";
import { CustomFilter } from "@/components/ui/custom-filter";
import { CustomTextArea } from "@/components/ui/custom-input";
import { ModalDetail } from "@/components/ui/modal-detail";
import { ModalMessage } from "@/components/ui/modal-message";
import { ModalLoading } from "@/components/ui/modal-loading";
import { Badge } from "@/components/ui/badge";
import {
    CheckCircle,
    XCircle,
    ArrowRight,
    Eye,
    Edit3
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { CustomButton } from "@/components/ui/custom-button";

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

const CustomerStatusApprovalPage: React.FC = () => {
    const {
        requests,
        loading,
        fetchRequests,
        approveRequest,
        rejectRequest,
        filterValues,
        appliedFilters,
        pagination,
        selectedIds,
        setFilterValues,
        setAppliedFilters,
        setPagination,
        setSelectedIds,
        resetFilters
    } = useCustomerStatusRequestStore();

    const { customers, fetchCustomers, fetchConnections } = useCustomerStore();
    const { branches, fetchBranches, loading: branchLoading } = useBranchStore();
    const { areas, fetchAreas } = useAreaStore();

    // Modal state
    const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
    const [showDetail, setShowDetail] = useState<CustomerStatusRequest | null>(null);
    const [approvalData, setApprovalData] = useState({
        status: "APPROVED" as "APPROVED" | "REJECTED",
        notes: ""
    });

    const [showLoading, setShowLoading] = useState(false);
    const [showMessage, setShowMessage] = useState({ show: false, title: "", message: "", type: "success" as any });

    useEffect(() => {
        fetchRequests(true);
        fetchCustomers(true);
        fetchBranches();
        fetchAreas();
    }, []);

    const handleSearch = () => {
        setAppliedFilters({ ...filterValues });
        setPagination({ currentPage: 1 });
        setSelectedIds([]);
    };

    const handleReset = () => {
        resetFilters();
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'AKTIF': return 'Aktif';
            case 'NONAKTIF': return 'Nonaktif Sementara';
            case 'BERHENTI': return 'Berhenti Berlangganan';
            default: return status;
        }
    };

    const getStatusColor = (status: string) => {
        if (status === 'AKTIF') return 'text-green-600';
        if (status === 'NONAKTIF') return 'text-amber-600';
        if (status === 'BERHENTI') return 'text-red-600';
        return 'text-slate-600';
    };

    const countChanges = (request: CustomerStatusRequest) => {
        let count = 0;
        if (request.currentStatus !== request.newStatus) count++;
        return count;
    };
    const filteredRequests = useMemo(() => {
        return requests.filter(r => {
            if (r.status !== 'PENDING') return false;

            // Required Branch Selection
            if (!appliedFilters.branchId || appliedFilters.branchId === "") return false;

            const customer = customers.find(c => c.id === r.customerId);

            // Branch filter
            if (appliedFilters.branchId !== "all") {
                if (customer?.area?.branchId?.toString() !== appliedFilters.branchId) return false;
            }

            // Area filter
            if (appliedFilters.areaId && appliedFilters.areaId !== "" && appliedFilters.areaId !== "all") {
                if (customer?.areaId.toString() !== appliedFilters.areaId) return false;
            }

            // Search
            const searchTerm = appliedFilters.search.toLowerCase();
            if (searchTerm) {
                const customerId = customer?.idPelanggan?.toLowerCase() || "";
                const customerName = customer?.namaPelanggan?.toLowerCase() || "";
                if (!customerId.includes(searchTerm) && !customerName.includes(searchTerm)) return false;
            }

            return true;
        });
    }, [requests, customers, appliedFilters]);

    const paginatedRequests = filteredRequests.slice(
        (pagination.currentPage - 1) * pagination.pageSize,
        pagination.currentPage * pagination.pageSize
    );

    const handleBatchAction = async () => {
        if (selectedIds.length === 0) return;

        const request = requests.find(r => r.id === selectedIds[0]);
        if (!request) return;

        setShowLoading(true);
        try {
            if (approvalData.status === "APPROVED") {
                await approveRequest(request.id, approvalData.notes, "Admin");
                await fetchConnections(true);
                await fetchCustomers(true);
            } else {
                await rejectRequest(request.id, approvalData.notes, "Admin");
            }

            setIsApprovalModalOpen(false);
            setShowMessage({
                show: true,
                title: "Berhasil",
                message: `Request perubahan status berhasil di-${approvalData.status === "APPROVED" ? "approve" : "reject"}.`,
                type: "success"
            });
            setSelectedIds([]);
            setApprovalData({ status: "APPROVED", notes: "" });
        } catch (error: any) {
            setShowMessage({
                show: true,
                title: "Gagal",
                message: error.message || "Terjadi kesalahan sistem.",
                type: "error"
            });
        } finally {
            setShowLoading(false);
        }
    };

    const columns = [
        {
            header: "TANGGAL",
            render: (row: CustomerStatusRequest) => <span className="text-sm">{format(new Date(row.createdAt), "dd/MM/yy HH:mm", { locale: id })}</span>
        },
        {
            header: "ID PELANGGAN",
            render: (row: CustomerStatusRequest) => {
                const customer = customers.find(c => c.id === row.customerId);
                return <span className="text-sm font-mono text-primary font-bold">{customer?.idPelanggan || "-"}</span>;
            }
        },
        {
            header: "NAMA PELANGGAN",
            render: (row: CustomerStatusRequest) => {
                const customer = customers.find(c => c.id === row.customerId);
                return <span className="text-sm">{customer?.namaPelanggan || "-"}</span>;
            }
        },
        {
            header: "PERUBAHAN",
            render: (row: CustomerStatusRequest) => (
                <div
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowDetail(row);
                    }}
                    className="flex justify-center"
                >
                    <Badge variant="secondary" className="text-[10px] uppercase font-bold h-6 border-primary/20 bg-primary/5 text-primary cursor-pointer hover:bg-primary hover:text-white transition-all flex items-center gap-1.5 px-3">
                        <Edit3 size={11} />
                        {countChanges(row)} FIELD
                        <span className="opacity-40 text-[9px]">|</span>
                        <Eye size={12} />
                    </Badge>
                </div>
            )
        },
        {
            header: "PEMOHON",
            render: (row: CustomerStatusRequest) => <span className="text-sm font-semibold text-slate-700">{row.requestedBy || "-"}</span>
        },
        {
            header: "CATATAN PEMOHON",
            render: (row: CustomerStatusRequest) => <span className="text-xs font-medium text-amber-700 max-w-[180px] truncate block" title={row.reason || row.requestNote || ""}>{row.reason || row.requestNote || "-"}</span>
        }
    ];

    const activeRequest = useMemo(() => {
        if (selectedIds.length === 1) {
            return requests.find(r => r.id === selectedIds[0]);
        }
        return null;
    }, [selectedIds, requests]);

    const filteredAreas = areas.filter(a =>
        filterValues.branchId && filterValues.branchId !== "all" ? a.branchId.toString() === filterValues.branchId : true
    );

    return (
        <div className="space-y-4 pb-20">
            <CustomFilter
                onSearch={handleSearch}
                onReset={handleReset}
                filters={[
                    {
                        label: "Cabang",
                        value: filterValues.branchId,
                        placeholder: "Pilih Cabang",
                        type: "select",
                        options: [{ label: "Semua Cabang", value: "all" }, ...branches.map(b => ({ label: b.namaBranch, value: b.id.toString() }))],
                        loading: branchLoading,
                        onChange: (val: string) => setFilterValues({ branchId: val, areaId: "" })
                    },
                    {
                        label: "Area",
                        placeholder: filterValues.branchId ? "Semua Area" : "Pilih Cabang dulu",
                        value: filterValues.areaId,
                        type: "select",
                        disabled: !filterValues.branchId,
                        options: [{ label: "Semua Area", value: "all" }, ...filteredAreas.map(a => ({ label: a.namaArea, value: a.id.toString() }))],
                        onChange: (val: string) => setFilterValues({ areaId: val })
                    },
                    {
                        label: "Cari Pelanggan",
                        placeholder: "Nama atau ID Pelanggan...",
                        value: filterValues.search,
                        type: "text",
                        onChange: (val: string) => setFilterValues({ search: val })
                    }
                ]}
            >
            </CustomFilter>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-1">
                <CustomTable
                    data={paginatedRequests}
                    columns={columns as any}
                    loading={loading}
                    emptyMessage={!appliedFilters.branchId ? "Pilih Cabang terlebih dahulu." : "Tidak ada request pending."}
                    enableSelection={true}
                    selectedIds={selectedIds}
                    onMultiSelectionChange={(ids) => {
                        if (ids.length > 1) {
                            const lastSelected = ids[ids.length - 1];
                            setSelectedIds([lastSelected]);
                        } else {
                            setSelectedIds(ids);
                        }
                    }}
                    actionButtons={
                        selectedIds.length === 1 && (
                            <CustomButton
                                size="sm"
                                variant="primary"
                                className="h-8 shadow-md"
                                onClick={() => setIsApprovalModalOpen(true)}
                            >
                                <CheckCircle size={14} className="mr-2" />
                                Proses Item
                            </CustomButton>
                        )
                    }
                    pagination={{
                        currentPage: pagination.currentPage,
                        totalItems: filteredRequests.length,
                        pageSize: pagination.pageSize,
                        onPageChange: (page) => {
                            setPagination({ currentPage: page });
                            setSelectedIds([]);
                        },
                        onPageSizeChange: (size) => {
                            setPagination({ pageSize: size, currentPage: 1 });
                            setSelectedIds([]);
                        }
                    }}
                />
            </div>

            {/* Approval Modal (Combined Detail and Form) */}
            <ModalDetail
                isOpen={isApprovalModalOpen}
                onClose={() => setIsApprovalModalOpen(false)}
                title="Persetujuan Perubahan Status"
                maxWidth="md"
                showFooter={false}
            >
                <div className="space-y-6 py-2">
                    {activeRequest && (
                        <>
                            {/* Comparison Section */}
                            <div className="space-y-4">
                                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ID PELANGGAN</span>
                                            <span className="text-sm font-bold text-primary">{customers.find(c => c.id === activeRequest.customerId)?.idPelanggan || "-"}</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">NAMA PELANGGAN</span>
                                            <span className="text-sm font-bold text-slate-800">{customers.find(c => c.id === activeRequest.customerId)?.namaPelanggan || "-"}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1 max-h-[300px] overflow-y-auto pr-2">
                                    <ChangeItem label="Status Pelanggan" oldValue={getStatusLabel(activeRequest.currentStatus)} newValue={getStatusLabel(activeRequest.newStatus)} />
                                </div>

                                <div className="bg-amber-50 rounded p-3 text-xs text-amber-800 italic border border-amber-100">
                                    <div className="flex items-center justify-between mb-1 not-italic">
                                        <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Catatan Pemohon:</span>
                                        <span className="text-[10px] font-bold text-primary">Oleh: {activeRequest.requestedBy || "Sistem"}</span>
                                    </div>
                                    "{activeRequest.reason || activeRequest.requestNote || "Tidak ada catatan"}"
                                </div>
                            </div>

                            {/* Approval Form Section */}
                            <div className="pt-4 border-t border-slate-100 space-y-4">
                                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                    <CheckCircle size={14} className="text-primary" />
                                    Form Persetujuan
                                </h4>

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setApprovalData({ ...approvalData, status: "APPROVED" })}
                                        className={`flex items-center justify-center gap-2 h-12 rounded-lg border-2 transition-all font-bold text-sm ${approvalData.status === "APPROVED" ? "border-green-500 bg-green-50 text-green-700 shadow-sm" : "border-slate-100 text-slate-400 hover:border-slate-200"}`}
                                    >
                                        <CheckCircle size={18} />
                                        APPROVE
                                    </button>
                                    <button
                                        onClick={() => setApprovalData({ ...approvalData, status: "REJECTED" })}
                                        className={`flex items-center justify-center gap-2 h-12 rounded-lg border-2 transition-all font-bold text-sm ${approvalData.status === "REJECTED" ? "border-red-500 bg-red-50 text-red-700 shadow-sm" : "border-slate-100 text-slate-400 hover:border-slate-200"}`}
                                    >
                                        <XCircle size={18} />
                                        REJECT
                                    </button>
                                </div>

                                <CustomTextArea
                                    label="Catatan Approval / Alasan"
                                    placeholder="Berikan alasan persetujuan atau penolakan..."
                                    value={approvalData.notes}
                                    onChange={(e) => setApprovalData(prev => ({ ...prev, notes: e.target.value }))}
                                    rows={3}
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                                <CustomButton variant="ghost" onClick={() => setIsApprovalModalOpen(false)}>Batal</CustomButton>
                                <CustomButton variant="primary" onClick={handleBatchAction}>Simpan Keputusan</CustomButton>
                            </div>
                        </>
                    )}
                </div>
            </ModalDetail>

            {/* View Detail Modal Only */}
            <ModalDetail
                isOpen={!!showDetail}
                onClose={() => setShowDetail(null)}
                title="Detail Perubahan Status"
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
                            <ChangeItem label="Status Pelanggan" oldValue={getStatusLabel(showDetail.currentStatus)} newValue={getStatusLabel(showDetail.newStatus)} />
                        </div>

                        <div className="pt-4 mt-4 border-t border-slate-100">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Catatan Pemohon:</span>
                                <span className="text-[10px] font-bold text-primary">Oleh: {showDetail.requestedBy || "Sistem"}</span>
                            </div>
                            <div className="bg-amber-50 rounded p-3 text-xs text-amber-800 italic border border-amber-100">
                                "{showDetail.reason || showDetail.requestNote || "Tidak ada catatan"}"
                            </div>
                        </div>
                    </div>
                )}
            </ModalDetail>

            <ModalLoading isOpen={showLoading} message="Memproses data..." />

            <ModalMessage
                isOpen={showMessage.show}
                onClose={() => setShowMessage({ ...showMessage, show: false })}
                title={showMessage.title}
                message={showMessage.message}
                type={showMessage.type}
            />
        </div>
    );
};

export default CustomerStatusApprovalPage;
