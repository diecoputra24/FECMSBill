import React, { useState, useEffect, useMemo } from "react";
import { useUpgradeRequestStore } from "@/store/upgradeRequestStore";
import type { UpgradeRequest } from "@/store/upgradeRequestStore";
import { useCustomerStore } from "@/store/customerStore";
import { usePackageStore } from "@/store/packageStore";
import { useBranchStore } from "@/store/branchStore";
import { useAreaStore } from "@/store/areaStore";
import { CustomTable } from "@/components/ui/custom-table";
import { CustomFilter } from "@/components/ui/custom-filter";
import { CustomSelect } from "@/components/ui/custom-select";
import { CustomButton } from "@/components/ui/custom-button";
import { CustomTextArea } from "@/components/ui/custom-input";
import { ModalDetail } from "@/components/ui/modal-detail";
import { ModalMessage } from "@/components/ui/modal-message";
import { ModalLoading } from "@/components/ui/modal-loading";
import { Badge } from "@/components/ui/badge";
import {
    CheckCircle,
    TrendingUp,
    TrendingDown,
    ArrowRight,
    Eye,
    Package
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";

const UpgradeApprovalPage: React.FC = () => {
    const {
        requests,
        fetchRequests,
        approveRequest,
        rejectRequest,
        loading,
        filterValues,
        appliedFilters,
        pagination,
        selectedIds,
        setFilterValues,
        setAppliedFilters,
        setPagination,
        setSelectedIds,
        resetFilters
    } = useUpgradeRequestStore();

    const { customers, fetchCustomers, fetchConnections } = useCustomerStore();
    const { packages, fetchPackages } = usePackageStore();
    const { branches, fetchBranches, loading: branchLoading } = useBranchStore();
    const { areas, fetchAreas } = useAreaStore();

    // Modal state
    const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
    const [showDetail, setShowDetail] = useState<UpgradeRequest | null>(null);
    const [approvalData, setApprovalData] = useState({
        status: "APPROVED",
        notes: ""
    });

    const [showLoading, setShowLoading] = useState(false);
    const [showMessage, setShowMessage] = useState({ show: false, title: "", message: "", type: "success" as any });

    useEffect(() => {
        fetchRequests(true);
        fetchCustomers();
        fetchPackages();
        fetchBranches();
        fetchAreas();
    }, []);

    const handleSearch = () => {
        setAppliedFilters(filterValues);
        setPagination({ currentPage: 1 });
        setSelectedIds([]);
    };

    const handleReset = () => {
        resetFilters();
    };

    const handleProcessApproval = async () => {
        if (selectedIds.length !== 1) return;

        setShowLoading(true);
        setIsApprovalModalOpen(false);

        try {
            const idToProcess = selectedIds[0];
            const targetRequest = requests.find(r => r.id === idToProcess);
            if (!targetRequest) throw new Error("Request tidak ditemukan.");

            if (approvalData.status === "APPROVED") {
                await approveRequest(Number(idToProcess), approvalData.notes, "Admin");
                await fetchConnections(true);
            } else {
                await rejectRequest(Number(idToProcess), approvalData.notes, "Admin");
            }

            await fetchRequests(true);

            setShowMessage({
                show: true,
                title: "Berhasil",
                message: `Request perubahan paket berhasil di-${approvalData.status === "APPROVED" ? "approve" : "reject"}.`,
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

    const filteredRequests = useMemo(() => {
        return requests.filter(r => {
            if (r.status !== 'PENDING') return false;

            // Required Branch Selection
            if (!appliedFilters.branchId || appliedFilters.branchId === "") return false;

            const customer = customers.find(c => c.id === r.customerId);

            // Branch filter
            if (appliedFilters.branchId && appliedFilters.branchId !== "" && appliedFilters.branchId !== "all") {
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

    const getPacketName = (paketId: number) => packages.find(p => p.id === paketId)?.namaPaket || "-";
    const getPacketPrice = (paketId: number) => Number(packages.find(p => p.id === paketId)?.hargaPaket) || 0;

    const columns = [
        {
            header: "TANGGAL",
            render: (row: UpgradeRequest) => <span className="text-sm">{format(new Date(row.createdAt), "dd/MM/yy HH:mm", { locale: id })}</span>
        },
        {
            header: "ID PELANGGAN",
            render: (row: UpgradeRequest) => {
                const customer = customers.find(c => c.id === row.customerId);
                return <span className="text-sm font-mono text-primary font-bold">{customer?.idPelanggan || "-"}</span>;
            }
        },
        {
            header: "NAMA PELANGGAN",
            render: (row: UpgradeRequest) => {
                const customer = customers.find(c => c.id === row.customerId);
                return <span className="text-sm">{customer?.namaPelanggan || "-"}</span>;
            }
        },
        {
            header: "PERUBAHAN",
            render: (row: UpgradeRequest) => {
                const priceDiff = getPacketPrice(row.newPaketId) - getPacketPrice(row.currentPaketId);
                const isUpgrade = priceDiff >= 0;
                return (
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowDetail(row);
                        }}
                        className="flex justify-center"
                    >
                        <Badge variant="secondary" className="text-[10px] uppercase font-bold h-6 border-primary/20 bg-primary/5 text-primary cursor-pointer hover:bg-primary hover:text-white transition-all flex items-center gap-1.5 px-3">
                            <Package size={11} />
                            {isUpgrade ? "UPGRADE" : "DOWNGRADE"}
                            <span className="opacity-40 text-[9px]">|</span>
                            <Eye size={12} />
                        </Badge>
                    </div>
                );
            }
        },
        {
            header: "REQUESTED BY",
            render: (row: UpgradeRequest) => (
                <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-700">{row.requestedBy || "-"}</span>
                </div>
            )
        },
        {
            header: "CATATAN PEMOHON",
            render: (row: UpgradeRequest) => (
                <span className="text-xs font-medium text-amber-700 max-w-[180px] truncate block" title={row.requestNote}>
                    {row.requestNote || "-"}
                </span>
            )
        }
    ];

    const activeRequest = useMemo(() => {
        if (selectedIds.length === 1) {
            return requests.find(r => r.id === selectedIds[0]);
        }
        return null;
    }, [selectedIds, requests]);

    const activeCustomer = activeRequest ? customers.find(c => c.id === activeRequest.customerId) : null;
    const priceDiff = activeRequest ? (getPacketPrice(activeRequest.newPaketId) - getPacketPrice(activeRequest.currentPaketId)) : 0;

    const filteredAreas = areas.filter(a =>
        filterValues.branchId && filterValues.branchId !== "all" ? a.branchId.toString() === filterValues.branchId : true
    );

    return (
        <div className="space-y-4 pb-20">
            <CustomFilter
                onSearch={handleSearch}
                onReset={handleReset}
                loading={loading}
                filters={[
                    {
                        label: "Cabang",
                        placeholder: "Pilih Cabang",
                        value: filterValues.branchId,
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
                title="Persetujuan Perubahan Paket"
                maxWidth="md"
                showFooter={false}
            >
                <div className="space-y-6 py-2">
                    {activeRequest && (
                        <>
                            <div className="space-y-4">
                                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ID PELANGGAN</span>
                                            <span className="text-sm font-bold text-primary">{activeCustomer?.idPelanggan || "-"}</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">NAMA PELANGGAN</span>
                                            <span className="text-sm font-bold text-slate-800">{activeCustomer?.namaPelanggan || "-"}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-lg shadow-sm">
                                    <div className="flex-1 text-left">
                                        <p className="text-[10px] text-slate-400 uppercase font-black mb-1">Paket Lama</p>
                                        <p className="text-xs font-bold text-slate-600 line-through">{getPacketName(activeRequest.currentPaketId)}</p>
                                        <p className="text-[10px] text-slate-400">Rp {getPacketPrice(activeRequest.currentPaketId).toLocaleString('id-ID')}</p>
                                    </div>
                                    <ArrowRight className="mx-4 text-slate-300" size={16} />
                                    <div className="flex-1 text-right">
                                        <p className="text-[10px] text-primary uppercase font-black mb-1">Paket Baru</p>
                                        <p className="text-xs font-bold text-primary">{getPacketName(activeRequest.newPaketId)}</p>
                                        <p className="text-[10px] text-primary">Rp {getPacketPrice(activeRequest.newPaketId).toLocaleString('id-ID')}</p>
                                    </div>
                                </div>

                                <div className={cn(
                                    "p-3 rounded-lg border flex items-center justify-between",
                                    priceDiff >= 0 ? "bg-green-50 border-green-100" : "bg-amber-50 border-amber-100"
                                )}>
                                    <div className="flex items-center gap-2">
                                        {priceDiff >= 0 ? <TrendingUp size={16} className="text-green-600" /> : <TrendingDown size={16} className="text-amber-600" />}
                                        <span className="text-[11px] font-bold text-slate-600 uppercase">Tipe Perubahan:</span>
                                    </div>
                                    <span className={cn(
                                        "text-sm font-black",
                                        priceDiff >= 0 ? "text-green-600" : "text-amber-600"
                                    )}>
                                        {priceDiff >= 0 ? "UPGRADE" : "DOWNGRADE"} ({priceDiff >= 0 ? "+" : ""}Rp {priceDiff.toLocaleString('id-ID')})
                                    </span>
                                </div>

                                <div className="bg-amber-50 rounded p-3 text-xs text-amber-800 italic border border-amber-100">
                                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block not-italic mb-1">Catatan Pemohon:</span>
                                    "{activeRequest.requestNote || "Tidak ada catatan"}"
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 space-y-4">
                                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                    <CheckCircle size={14} className="text-primary" />
                                    Form Persetujuan
                                </h4>

                                <CustomSelect
                                    label="Keputusan"
                                    value={approvalData.status}
                                    onChange={(val) => setApprovalData(prev => ({ ...prev, status: val }))}
                                    options={[
                                        { label: "Approve (Setujui)", value: "APPROVED" },
                                        { label: "Reject (Tolak)", value: "REJECTED" }
                                    ]}
                                />

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
                                <CustomButton variant="primary" onClick={handleProcessApproval}>Simpan Keputusan</CustomButton>
                            </div>
                        </>
                    )}
                </div>
            </ModalDetail>

            {/* Detail Modal (View Only) */}
            <ModalDetail
                isOpen={!!showDetail}
                onClose={() => setShowDetail(null)}
                title="Detail Perubahan Paket"
                maxWidth="md"
                cancelLabel="Tutup"
            >
                {showDetail && (
                    <div className="space-y-4 text-left">
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
                            (getPacketPrice(showDetail.newPaketId) - getPacketPrice(showDetail.currentPaketId)) >= 0 ? "bg-green-50 border-green-100" : "bg-amber-50 border-amber-100"
                        )}>
                            <div className="flex items-center gap-2">
                                {(getPacketPrice(showDetail.newPaketId) - getPacketPrice(showDetail.currentPaketId)) >= 0 ? <TrendingUp size={16} className="text-green-600" /> : <TrendingDown size={16} className="text-amber-600" />}
                                <span className="text-[11px] font-bold text-slate-600 uppercase">Tipe Perubahan:</span>
                            </div>
                            <span className={cn(
                                "text-sm font-black",
                                (getPacketPrice(showDetail.newPaketId) - getPacketPrice(showDetail.currentPaketId)) >= 0 ? "text-green-600" : "text-amber-600"
                            )}>
                                {(getPacketPrice(showDetail.newPaketId) - getPacketPrice(showDetail.currentPaketId)) >= 0 ? "UPGRADE" : "DOWNGRADE"} ({(getPacketPrice(showDetail.newPaketId) - getPacketPrice(showDetail.currentPaketId)) >= 0 ? "+" : ""}Rp {Math.abs(getPacketPrice(showDetail.newPaketId) - getPacketPrice(showDetail.currentPaketId)).toLocaleString('id-ID')})
                            </span>
                        </div>

                        <div className="pt-4 mt-4 border-t border-slate-100">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Catatan Pemohon:</span>
                            <div className="bg-amber-50 rounded p-3 text-xs text-amber-800 italic border border-amber-100">
                                "{showDetail.requestNote || "Tidak ada catatan"}"
                            </div>
                        </div>
                    </div>
                )}
            </ModalDetail>

            <ModalLoading isOpen={showLoading} message="Sedang memproses..." />
            <ModalMessage
                isOpen={showMessage.show}
                onClose={() => setShowMessage(prev => ({ ...prev, show: false }))}
                {...showMessage}
            />
        </div>
    );
};

export default UpgradeApprovalPage;
