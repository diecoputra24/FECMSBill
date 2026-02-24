import React, { useState, useEffect, useMemo } from "react";
import { useCustomerChangeRequestStore } from "@/store/customerChangeRequestStore";
import type { CustomerChangeRequest } from "@/store/customerChangeRequestStore";
import { useCustomerStore } from "@/store/customerStore";
import { useAreaStore } from "@/store/areaStore";
import { useOdpStore } from "@/store/odpStore";
import { CustomTable } from "@/components/ui/custom-table";
import { Badge } from "@/components/ui/badge";
import { CustomButton } from "@/components/ui/custom-button";
import { ModalConfirm } from "@/components/ui/modal-confirm";
import { ModalMessage } from "@/components/ui/modal-message";
import { ModalLoading } from "@/components/ui/modal-loading";
import { ModalDetail } from "@/components/ui/modal-detail";
import {
    CheckCircle,
    XCircle,
    Clock,
    Edit3,
    ArrowRight,
    User,
    MapPin,
    Phone,
    FileText
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

// Change comparison component
const ChangeItem = ({ label, oldValue, newValue, icon: Icon }: { label: string; oldValue: string; newValue: string; icon?: React.ComponentType<{ size?: number; className?: string }> }) => {
    const hasChange = oldValue !== newValue;
    if (!hasChange) return null;

    return (
        <div className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0">
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
    const { requests, fetchRequests, approveRequest, rejectRequest, loading } = useCustomerChangeRequestStore();
    const { customers, fetchCustomers } = useCustomerStore();
    const { areas, fetchAreas } = useAreaStore();
    const { odps, fetchOdps } = useOdpStore();

    const [selectedRequest, setSelectedRequest] = useState<CustomerChangeRequest | null>(null);
    const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | null>(null);
    const [showLoading, setShowLoading] = useState(false);
    const [showMessage, setShowMessage] = useState({ show: false, title: "", message: "", type: "success" as any });
    const [showDetail, setShowDetail] = useState<CustomerChangeRequest | null>(null);

    useEffect(() => {
        fetchRequests(true);
        fetchCustomers();
        fetchAreas();
        fetchOdps();
    }, []);

    const getCustomerName = (customerId: number) => {
        const customer = customers.find(c => c.id === customerId);
        return customer?.namaPelanggan || "-";
    };

    const getCustomerId = (customerId: number) => {
        const customer = customers.find(c => c.id === customerId);
        return customer?.idPelanggan || "-";
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

    const handleAction = async () => {
        if (!selectedRequest || !confirmAction) return;

        setShowLoading(true);
        try {
            if (confirmAction === 'approve') {
                await approveRequest(selectedRequest.id, undefined, "Admin");
                await fetchCustomers(true);
                setShowMessage({
                    show: true,
                    title: "Berhasil!",
                    message: "Request perubahan data berhasil di-approve dan telah diterapkan.",
                    type: "success"
                });
            } else {
                await rejectRequest(selectedRequest.id, undefined, "Admin");
                setShowMessage({
                    show: true,
                    title: "Ditolak",
                    message: "Request perubahan data telah ditolak.",
                    type: "success"
                });
            }
        } catch (error: any) {
            setShowMessage({
                show: true,
                title: "Gagal",
                message: error.message || "Terjadi kesalahan",
                type: "error"
            });
        } finally {
            setShowLoading(false);
            setSelectedRequest(null);
            setConfirmAction(null);
        }
    };

    const pendingRequests = useMemo(() => {
        return requests.filter(r => r.status === 'PENDING');
    }, [requests]);

    const historyRequests = useMemo(() => {
        return requests.filter(r => r.status !== 'PENDING');
    }, [requests]);

    return (
        <div className="space-y-6 pb-20">
            {/* Pending Requests */}
            <div className="bg-white rounded-lg border border-slate-100 overflow-hidden">
                <div className="bg-amber-50 px-5 py-2 border-b border-amber-100 flex items-center gap-2">
                    <Clock size={14} className="text-amber-600" />
                    <h4 className="font-bold text-amber-700 text-[12px] uppercase tracking-wider">
                        Menunggu Persetujuan ({pendingRequests.length})
                    </h4>
                </div>
                <CustomTable
                    data={pendingRequests}
                    loading={loading}
                    emptyMessage="Tidak ada request yang menunggu persetujuan"
                    columns={[
                        {
                            header: "TANGGAL",
                            render: (row) => format(new Date(row.createdAt), "dd MMM yyyy HH:mm", { locale: id })
                        },
                        {
                            header: "ID PELANGGAN",
                            render: (row) => <span className="font-mono text-primary font-bold text-xs">{getCustomerId(row.customerId)}</span>
                        },
                        {
                            header: "NAMA PELANGGAN",
                            render: (row) => <span className="font-bold">{getCustomerName(row.customerId)}</span>
                        },
                        {
                            header: "PERUBAHAN",
                            render: (row) => (
                                <button
                                    onClick={() => setShowDetail(row)}
                                    className="flex items-center gap-2 group"
                                >
                                    <Badge variant="secondary" className="text-[9px] uppercase font-bold">
                                        <Edit3 size={10} className="mr-1" />
                                        {countChanges(row)} field
                                    </Badge>
                                    <span className="text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                        Lihat Detail
                                    </span>
                                </button>
                            )
                        },
                        {
                            header: "REQUESTED BY",
                            render: (row) => <span className="text-xs text-slate-500">{row.requestedBy || "-"}</span>
                        },
                        {
                            header: "AKSI",
                            render: (row) => (
                                <div className="flex gap-2">
                                    <CustomButton
                                        size="sm"
                                        variant="primary"
                                        className="h-7 px-3 text-[10px]"
                                        onClick={() => {
                                            setSelectedRequest(row);
                                            setConfirmAction('approve');
                                        }}
                                    >
                                        <CheckCircle size={12} className="mr-1" />
                                        Approve
                                    </CustomButton>
                                    <CustomButton
                                        size="sm"
                                        variant="danger"
                                        className="h-7 px-3 text-[10px]"
                                        onClick={() => {
                                            setSelectedRequest(row);
                                            setConfirmAction('reject');
                                        }}
                                    >
                                        <XCircle size={12} className="mr-1" />
                                        Reject
                                    </CustomButton>
                                </div>
                            )
                        },
                    ]}
                />
            </div>

            {/* History */}
            <div className="bg-white rounded-lg border border-slate-100 overflow-hidden">
                <div className="bg-slate-50 px-5 py-2 border-b border-slate-100 flex items-center gap-2">
                    <Edit3 size={14} className="text-slate-500" />
                    <h4 className="font-bold text-slate-600 text-[12px] uppercase tracking-wider">
                        Riwayat Request
                    </h4>
                </div>
                <CustomTable
                    data={historyRequests}
                    loading={loading}
                    emptyMessage="Belum ada riwayat request"
                    columns={[
                        {
                            header: "TANGGAL",
                            render: (row) => format(new Date(row.createdAt), "dd MMM yyyy HH:mm", { locale: id })
                        },
                        {
                            header: "ID PELANGGAN",
                            render: (row) => <span className="font-mono text-primary font-bold text-xs">{getCustomerId(row.customerId)}</span>
                        },
                        {
                            header: "NAMA PELANGGAN",
                            render: (row) => <span className="font-bold">{getCustomerName(row.customerId)}</span>
                        },
                        {
                            header: "PERUBAHAN",
                            render: (row) => (
                                <button
                                    onClick={() => setShowDetail(row)}
                                    className="flex items-center gap-2 group"
                                >
                                    <Badge variant="secondary" className="text-[9px] uppercase font-bold">
                                        <Edit3 size={10} className="mr-1" />
                                        {countChanges(row)} field
                                    </Badge>
                                </button>
                            )
                        },
                        {
                            header: "STATUS",
                            render: (row) => (
                                <div className="flex items-center gap-1.5">
                                    {row.status === 'APPROVED' ? (
                                        <>
                                            <CheckCircle size={16} className="text-green-500" />
                                            <span className="text-xs font-bold text-green-600">Approved</span>
                                        </>
                                    ) : (
                                        <>
                                            <XCircle size={16} className="text-red-500" />
                                            <span className="text-xs font-bold text-red-600">Rejected</span>
                                        </>
                                    )}
                                </div>
                            )
                        },
                        {
                            header: "APPROVED BY",
                            render: (row) => <span className="text-xs text-slate-500">{row.approvedBy || "-"}</span>
                        },
                    ]}
                />
            </div>

            {/* Detail Modal */}
            <ModalDetail
                isOpen={!!showDetail}
                onClose={() => setShowDetail(null)}
                title={`Detail Perubahan - ${showDetail ? getCustomerId(showDetail.customerId) : ''}`}
                maxWidth="lg"
                cancelLabel="Tutup"
            >
                {showDetail && (
                    <div className="space-y-4">
                        {/* Status */}
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Status:</span>
                            {showDetail.status === 'PENDING' ? (
                                <div className="flex items-center gap-1.5">
                                    <Clock size={16} className="text-amber-500" />
                                    <span className="text-xs font-bold text-amber-600">Pending</span>
                                </div>
                            ) : showDetail.status === 'APPROVED' ? (
                                <div className="flex items-center gap-1.5">
                                    <CheckCircle size={16} className="text-green-500" />
                                    <span className="text-xs font-bold text-green-600">Approved</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5">
                                    <XCircle size={16} className="text-red-500" />
                                    <span className="text-xs font-bold text-red-600">Rejected</span>
                                </div>
                            )}
                        </div>

                        {/* Customer Info */}
                        <div className="rounded-md border border-slate-200 overflow-hidden">
                            <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
                                <h4 className="font-bold text-slate-700 text-sm tracking-tight">Informasi Pelanggan</h4>
                            </div>
                            <div className="p-4 grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">ID Pelanggan</span>
                                    <p className="text-sm font-mono font-bold text-primary">{getCustomerId(showDetail.customerId)}</p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Nama Pelanggan</span>
                                    <p className="text-sm font-bold text-slate-800">{getCustomerName(showDetail.customerId)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Changes */}
                        <div className="rounded-md border border-slate-200 overflow-hidden">
                            <div className="bg-amber-50 px-4 py-2 border-b border-amber-100">
                                <h4 className="font-bold text-amber-700 text-sm tracking-tight flex items-center gap-2">
                                    <Edit3 size={14} />
                                    Perubahan Data ({countChanges(showDetail)} field)
                                </h4>
                            </div>
                            <div className="p-4 space-y-3">
                                <ChangeItem label="Nama Pelanggan" icon={User} oldValue={showDetail.currentNama} newValue={showDetail.newNama} />
                                <ChangeItem label="Alamat" icon={MapPin} oldValue={showDetail.currentAlamat} newValue={showDetail.newAlamat} />
                                <ChangeItem label="Telepon" icon={Phone} oldValue={showDetail.currentTelepon} newValue={showDetail.newTelepon} />
                                <ChangeItem label="NIK / Identitas" icon={FileText} oldValue={showDetail.currentIdentitas} newValue={showDetail.newIdentitas} />
                                <ChangeItem label="Area" oldValue={getAreaName(showDetail.currentAreaId)} newValue={getAreaName(showDetail.newAreaId)} />
                                <ChangeItem label="ODP" oldValue={getOdpName(showDetail.currentOdpId)} newValue={getOdpName(showDetail.newOdpId)} />
                                <ChangeItem label="Port ODP" oldValue={showDetail.currentOdpPortId?.toString() || "-"} newValue={showDetail.newOdpPortId?.toString() || "-"} />
                                <ChangeItem label="Latitude" oldValue={showDetail.currentLatitude?.toString() || "-"} newValue={showDetail.newLatitude?.toString() || "-"} />
                                <ChangeItem label="Longitude" oldValue={showDetail.currentLongitude?.toString() || "-"} newValue={showDetail.newLongitude?.toString() || "-"} />

                                {countChanges(showDetail) === 0 && (
                                    <p className="text-sm text-slate-400 text-center py-4">Tidak ada perubahan</p>
                                )}
                            </div>
                        </div>

                        {/* Request Info */}
                        <div className="rounded-md border border-slate-200 overflow-hidden">
                            <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
                                <h4 className="font-bold text-slate-700 text-sm tracking-tight">Informasi Request</h4>
                            </div>
                            <div className="p-4 grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Requested By</span>
                                    <p className="text-sm font-medium text-slate-800">{showDetail.requestedBy || "-"}</p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Approved By</span>
                                    <p className="text-sm font-medium text-slate-800">{showDetail.approvedBy || "-"}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </ModalDetail>

            {/* Confirm Modal */}
            <ModalConfirm
                isOpen={!!confirmAction && !!selectedRequest}
                onClose={() => {
                    setConfirmAction(null);
                    setSelectedRequest(null);
                }}
                onConfirm={handleAction}
                variant={confirmAction === 'reject' ? 'danger' : 'primary'}
                title={confirmAction === 'approve' ? 'Konfirmasi Approve' : 'Konfirmasi Reject'}
                message={
                    confirmAction === 'approve'
                        ? `Apakah Anda yakin ingin menyetujui perubahan data untuk "${getCustomerName(selectedRequest?.customerId || 0)}"? Perubahan akan langsung diterapkan.`
                        : `Apakah Anda yakin ingin menolak request perubahan data untuk "${getCustomerName(selectedRequest?.customerId || 0)}"?`
                }
                confirmLabel={confirmAction === 'approve' ? 'Ya, Approve' : 'Ya, Reject'}
                cancelLabel="Batal"
            />

            <ModalLoading isOpen={showLoading} message="Memproses request..." />

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

export default CustomerChangeApprovalPage;
