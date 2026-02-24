import React, { useState, useEffect, useMemo } from "react";
import { useCustomerStatusRequestStore } from "@/store/customerStatusRequestStore";
import type { CustomerStatusRequest } from "@/store/customerStatusRequestStore";
import { useCustomerStore } from "@/store/customerStore";
import { CustomTable } from "@/components/ui/custom-table";
import { CustomButton } from "@/components/ui/custom-button";
import { ModalConfirm } from "@/components/ui/modal-confirm";
import { ModalMessage } from "@/components/ui/modal-message";
import { ModalLoading } from "@/components/ui/modal-loading";
import {
    CheckCircle,
    XCircle,
    Clock,
    UserMinus,
    UserX,
    UserCheck,
    ArrowRight
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const CustomerStatusApprovalPage: React.FC = () => {
    const { requests, fetchRequests, approveRequest, rejectRequest, loading } = useCustomerStatusRequestStore();
    const { customers, fetchCustomers, fetchConnections } = useCustomerStore();

    const [selectedRequest, setSelectedRequest] = useState<CustomerStatusRequest | null>(null);
    const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | null>(null);
    const [showLoading, setShowLoading] = useState(false);
    const [showMessage, setShowMessage] = useState({ show: false, title: "", message: "", type: "success" as any });

    useEffect(() => {
        fetchRequests(true);
        fetchCustomers();
    }, []);

    const getCustomerName = (customerId: number) => {
        const customer = customers.find(c => c.id === customerId);
        return customer?.namaPelanggan || "-";
    };

    const getCustomerId = (customerId: number) => {
        const customer = customers.find(c => c.id === customerId);
        return customer?.idPelanggan || "-";
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'AKTIF': return 'Aktif';
            case 'NONAKTIF': return 'Nonaktif Sementara';
            case 'BERHENTI': return 'Berhenti Berlangganan';
            default: return status;
        }
    };

    const getStatusIcon = (status: string) => {
        if (status === 'AKTIF') return <UserCheck size={14} className="text-green-500" />;
        if (status === 'NONAKTIF') return <UserX size={14} className="text-amber-500" />;
        if (status === 'BERHENTI') return <UserMinus size={14} className="text-red-500" />;
        return null;
    };

    const getStatusColor = (status: string) => {
        if (status === 'AKTIF') return 'text-green-600';
        if (status === 'NONAKTIF') return 'text-amber-600';
        if (status === 'BERHENTI') return 'text-red-600';
        return 'text-slate-600';
    };

    const handleAction = async () => {
        if (!selectedRequest || !confirmAction) return;

        setShowLoading(true);
        try {
            if (confirmAction === 'approve') {
                await approveRequest(selectedRequest.id, undefined, "Admin");
                await fetchConnections(true);
                await fetchCustomers(true);
                setShowMessage({
                    show: true,
                    title: "Berhasil!",
                    message: `Request perubahan status berhasil di-approve. Status pelanggan telah diubah dan PPP Secret telah ${selectedRequest.newStatus === 'AKTIF' ? 'diaktifkan' : 'dinonaktifkan'}.`,
                    type: "success"
                });
            } else {
                await rejectRequest(selectedRequest.id, undefined, "Admin");
                setShowMessage({
                    show: true,
                    title: "Ditolak",
                    message: "Request perubahan status telah ditolak.",
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
                            header: "PERUBAHAN STATUS",
                            render: (row) => (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-500">{getStatusLabel(row.currentStatus)}</span>
                                    <ArrowRight size={12} className="text-slate-300" />
                                    <div className="flex items-center gap-1">
                                        {getStatusIcon(row.newStatus)}
                                        <span className={`text-xs font-bold ${getStatusColor(row.newStatus)}`}>
                                            {getStatusLabel(row.newStatus)}
                                        </span>
                                    </div>
                                </div>
                            )
                        },
                        {
                            header: "ALASAN",
                            render: (row) => <span className="text-xs text-slate-500">{row.reason || "-"}</span>
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
                    <UserMinus size={14} className="text-slate-500" />
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
                                <div className="flex items-center gap-2">
                                    <span className="text-xs">{getStatusLabel(row.currentStatus)}</span>
                                    <ArrowRight size={12} className="text-slate-300" />
                                    <span className="text-xs font-bold">{getStatusLabel(row.newStatus)}</span>
                                </div>
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

            {/* Confirm Modal */}
            <ModalConfirm
                isOpen={!!confirmAction && !!selectedRequest}
                onClose={() => {
                    setConfirmAction(null);
                    setSelectedRequest(null);
                }}
                onConfirm={handleAction}
                variant={confirmAction === 'reject' ? 'danger' : selectedRequest?.newStatus === 'BERHENTI' ? 'danger' : 'primary'}
                title={confirmAction === 'approve' ? 'Konfirmasi Approve' : 'Konfirmasi Reject'}
                message={
                    confirmAction === 'approve'
                        ? `Apakah Anda yakin ingin menyetujui perubahan status untuk "${getCustomerName(selectedRequest?.customerId || 0)}" menjadi "${getStatusLabel(selectedRequest?.newStatus || '')}"? PPP Secret akan ${selectedRequest?.newStatus === 'AKTIF' ? 'diaktifkan' : 'dinonaktifkan'} di MikroTik.`
                        : `Apakah Anda yakin ingin menolak request perubahan status untuk "${getCustomerName(selectedRequest?.customerId || 0)}"?`
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

export default CustomerStatusApprovalPage;
