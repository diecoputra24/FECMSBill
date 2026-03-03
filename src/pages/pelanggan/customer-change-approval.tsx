import React, { useState, useEffect, useMemo } from "react";
import { useCustomerChangeRequestStore } from "@/store/customerChangeRequestStore";
import type { CustomerChangeRequest } from "@/store/customerChangeRequestStore";
import { useCustomerStore } from "@/store/customerStore";
import { useAreaStore } from "@/store/areaStore";
import { useBranchStore } from "@/store/branchStore";
import { useOdpStore } from "@/store/odpStore";
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
    Edit3,
    ArrowRight,
    User,
    MapPin,
    Phone,
    FileText,
    Eye
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

const CustomerChangeApprovalPage: React.FC = () => {
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
    } = useCustomerChangeRequestStore();

    const { customers, fetchCustomers } = useCustomerStore();
    const { branches, fetchBranches, loading: branchLoading } = useBranchStore();
    const { areas, fetchAreas } = useAreaStore();
    const { odps, fetchOdps } = useOdpStore();

    // Modal state
    const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
    const [showDetail, setShowDetail] = useState<CustomerChangeRequest | null>(null);
    const [approvalData, setApprovalData] = useState({
        status: "APPROVED",
        notes: ""
    });

    const [showLoading, setShowLoading] = useState(false);
    const [showMessage, setShowMessage] = useState({ show: false, title: "", message: "", type: "success" as any });

    useEffect(() => {
        fetchRequests(true);
        fetchCustomers(true);
        fetchBranches();
        fetchAreas();
        fetchOdps();
    }, []);

    const handleSearch = () => {
        setAppliedFilters({ ...filterValues });
        setPagination({ currentPage: 1 });
        setSelectedIds([]);
    };

    const handleReset = () => {
        resetFilters();
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

    const handleProcessApproval = async () => {
        if (selectedIds.length !== 1) return;

        setShowLoading(true);
        setIsApprovalModalOpen(false);

        try {
            const idToProcess = selectedIds[0];
            if (approvalData.status === "APPROVED") {
                await approveRequest(Number(idToProcess), approvalData.notes, "Admin");
            } else {
                await rejectRequest(Number(idToProcess), approvalData.notes, "Admin");
            }

            await fetchRequests(true);
            await fetchCustomers(true);

            setShowMessage({
                show: true,
                title: "Berhasil",
                message: `Request perubahan data berhasil di-${approvalData.status === "APPROVED" ? "approve" : "reject"}.`,
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
                return <span className="text-sm">{customer?.namaPelanggan || "-"}</span>;
            }
        },
        {
            header: "PERUBAHAN",
            render: (row: CustomerChangeRequest) => (
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
            render: (row: CustomerChangeRequest) => <span className="text-sm font-semibold text-slate-700">{row.requestedBy || "-"}</span>
        },
        {
            header: "CATATAN PEMOHON",
            render: (row: CustomerChangeRequest) => <span className="text-xs font-medium text-amber-700 max-w-[180px] truncate block" title={row.requestNote}>{row.requestNote || "-"}</span>
        }
    ];

    const filteredAreas = areas.filter(a =>
        filterValues.branchId && filterValues.branchId !== "all" ? a.branchId.toString() === filterValues.branchId : true
    );

    const activeRequest = useMemo(() => {
        if (selectedIds.length === 1) {
            return requests.find(r => r.id === selectedIds[0]);
        }
        return null;
    }, [selectedIds, requests]);

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
                    columns={columns}
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
                title="Persetujuan Perubahan Data"
                maxWidth="md"
                showFooter={false}
            >
                <div className="space-y-6 py-2">
                    {activeRequest && (
                        <>
                            {/* Comparison Section (Same as detail) */}
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
                                    <ChangeItem label="Nama Pelanggan" icon={User} oldValue={activeRequest.currentNama} newValue={activeRequest.newNama} />
                                    <ChangeItem label="Alamat" icon={MapPin} oldValue={activeRequest.currentAlamat} newValue={activeRequest.newAlamat} />
                                    <ChangeItem label="Telepon" icon={Phone} oldValue={activeRequest.currentTelepon} newValue={activeRequest.newTelepon} />
                                    <ChangeItem label="NIK / Identitas" icon={FileText} oldValue={activeRequest.currentIdentitas} newValue={activeRequest.newIdentitas} />
                                    <ChangeItem label="Area" oldValue={getAreaName(activeRequest.currentAreaId)} newValue={getAreaName(activeRequest.newAreaId)} />
                                    <ChangeItem label="ODP" oldValue={getOdpName(activeRequest.currentOdpId)} newValue={getOdpName(activeRequest.newOdpId)} />
                                    <ChangeItem label="Port ODP" oldValue={activeRequest.currentOdpPortId?.toString() || "-"} newValue={activeRequest.newOdpPortId?.toString() || "-"} />
                                    <ChangeItem label="Latitude" oldValue={activeRequest.currentLatitude?.toString() || "-"} newValue={activeRequest.newLatitude?.toString() || "-"} />
                                    <ChangeItem label="Longitude" oldValue={activeRequest.currentLongitude?.toString() || "-"} newValue={activeRequest.newLongitude?.toString() || "-"} />
                                </div>

                                <div className="bg-amber-50 rounded p-3 text-xs text-amber-800 italic border border-amber-100">
                                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block not-italic mb-1">Catatan Pemohon:</span>
                                    "{activeRequest.requestNote || "Tidak ada catatan"}"
                                </div>
                            </div>

                            {/* Approval Form Section */}
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

export default CustomerChangeApprovalPage;
