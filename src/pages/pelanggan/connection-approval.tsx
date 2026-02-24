import React, { useState, useEffect, useMemo } from "react";
import { useConnectionChangeRequestStore } from "@/store/connectionChangeRequestStore";
import type { ConnectionChangeRequest } from "@/store/connectionChangeRequestStore";
import { useCustomerStore } from "@/store/customerStore";
import { usePackageStore } from "@/store/packageStore";
import { CustomTable } from "@/components/ui/custom-table";
import { Badge } from "@/components/ui/badge";
import { CustomButton } from "@/components/ui/custom-button";
import { ModalConfirm } from "@/components/ui/modal-confirm";
import { ModalMessage } from "@/components/ui/modal-message";
import { ModalLoading } from "@/components/ui/modal-loading";
import {
    CheckCircle,
    XCircle,
    Clock,
    Activity,
    ArrowRight,
    User as UserIcon,
    Lock
} from "lucide-react";

import { format } from "date-fns";
import { id } from "date-fns/locale";

const ConnectionApprovalPage: React.FC = () => {
    const { requests, fetchRequests, approveRequest, rejectRequest, loading } = useConnectionChangeRequestStore();
    const { customers, fetchCustomers, fetchConnections } = useCustomerStore();
    const { packages, fetchPackages } = usePackageStore();

    const [selectedRequest, setSelectedRequest] = useState<ConnectionChangeRequest | null>(null);
    const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | null>(null);
    const [showLoading, setShowLoading] = useState(false);
    const [showMessage, setShowMessage] = useState({ show: false, title: "", message: "", type: "success" as any });

    useEffect(() => {
        fetchRequests(true);
        fetchCustomers();
        fetchPackages();
    }, []);

    const getCustomerName = (customerId: number) => {
        const customer = customers.find(c => c.id === customerId);
        return customer?.namaPelanggan || "-";
    };

    const getCustomerId = (customerId: number) => {
        const customer = customers.find(c => c.id === customerId);
        return customer?.idPelanggan || "-";
    };

    const getPacketName = (paketId?: number) => {
        if (!paketId) return "-";
        const paket = packages.find(p => p.id === paketId);
        return paket?.namaPaket || "-";
    };

    const handleAction = async () => {
        if (!selectedRequest || !confirmAction) return;

        setShowLoading(true);
        try {
            if (confirmAction === 'approve') {
                await approveRequest(selectedRequest.id, undefined, "Admin");
                await fetchConnections(true);
                setShowMessage({
                    show: true,
                    title: "Berhasil!",
                    message: "Request perubahan koneksi berhasil disetujui dan disinkronkan ke MikroTik.",
                    type: "success"
                });
            } else {
                await rejectRequest(selectedRequest.id, undefined, "Admin");
                setShowMessage({
                    show: true,
                    title: "Ditolak",
                    message: "Request perubahan koneksi telah ditolak.",
                    type: "success"
                });
            }
        } catch (error: any) {
            setShowMessage({
                show: true,
                title: "Gagal",
                message: error.response?.data?.message || error.message,
                type: "error"
            });
        } finally {
            setShowLoading(false);
            setSelectedRequest(null);
            setConfirmAction(null);
        }
    };

    const pendingRequests = useMemo(() => requests.filter(r => r.status === 'PENDING'), [requests]);
    const historyRequests = useMemo(() => requests.filter(r => r.status !== 'PENDING'), [requests]);

    return (
        <div className="space-y-6 pb-20">
            {/* Pending Requests */}
            <div className="bg-white rounded-lg border border-slate-100 overflow-hidden">
                <div className="bg-amber-50 px-5 py-2 border-b border-amber-100 flex items-center gap-2">
                    <Clock size={14} className="text-amber-600" />
                    <h4 className="font-bold text-amber-700 text-[12px] uppercase tracking-wider">
                        Menunggu Persetujuan Koneksi ({pendingRequests.length})
                    </h4>
                </div>
                <CustomTable
                    data={pendingRequests}
                    loading={loading}
                    emptyMessage="Tidak ada request perubahan koneksi yang menunggu persetujuan"
                    columns={[
                        {
                            header: "TANGGAL",
                            render: (row) => format(new Date(row.createdAt), "dd MMM yyyy HH:mm", { locale: id })
                        },
                        {
                            header: "PELANGGAN",
                            render: (row) => (
                                <div>
                                    <p className="font-bold text-slate-700">{getCustomerName(row.customerId)}</p>
                                    <p className="font-mono text-primary font-bold text-[10px]">{getCustomerId(row.customerId)}</p>
                                </div>
                            )
                        },
                        {
                            header: "PERUBAHAN PPP",
                            render: (row) => (
                                <div className="space-y-1">
                                    {row.currentPppUsername !== row.newPppUsername && (
                                        <div className="flex items-center gap-1 text-[11px]">
                                            <UserIcon size={10} className="text-slate-400" />
                                            <span className="text-slate-400 line-through">{row.currentPppUsername}</span>
                                            <ArrowRight size={10} className="text-primary" />
                                            <span className="font-bold text-primary">{row.newPppUsername}</span>
                                        </div>
                                    )}
                                    {row.currentPppPassword !== row.newPppPassword && (
                                        <div className="flex items-center gap-1 text-[11px]">
                                            <Lock size={10} className="text-slate-400" />
                                            <span className="text-slate-400 line-through">********</span>
                                            <ArrowRight size={10} className="text-primary" />
                                            <span className="font-bold text-primary">********</span>
                                        </div>
                                    )}
                                    {row.currentPppUsername === row.newPppUsername && row.currentPppPassword === row.newPppPassword && (
                                        <span className="text-[11px] text-slate-500 font-bold italic">Koneksi Tetap</span>
                                    )}
                                </div>
                            )
                        },
                        {
                            header: "MODE & PAKET",
                            render: (row) => (
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1">
                                        <Badge variant="outline" className="text-[9px] uppercase">{row.newSecretMode}</Badge>
                                        <Badge variant="secondary" className="text-[9px] uppercase">{row.newPppService}</Badge>
                                    </div>
                                    <p className="text-[11px] font-bold text-slate-600">{getPacketName(row.newPaketId)}</p>
                                </div>
                            )
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
                    <Activity size={14} className="text-slate-500" />
                    <h4 className="font-bold text-slate-600 text-[12px] uppercase tracking-wider"> Riwayat Request Koneksi </h4>
                </div>
                <CustomTable
                    data={historyRequests}
                    loading={loading}
                    emptyMessage="Belum ada riwayat"
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
                            header: "STATUS",
                            render: (row) => (
                                <div className="flex items-center gap-1.5">
                                    {row.status === 'APPROVED' ? (
                                        <Badge variant="success" className="text-[10px] uppercase font-bold">Approved</Badge>
                                    ) : (
                                        <Badge variant="destructive" className="text-[10px] uppercase font-bold">Rejected</Badge>
                                    )}
                                </div>
                            )
                        },
                        {
                            header: "PROCESSED BY",
                            render: (row) => <span className="text-xs text-slate-500 font-bold">{row.approvedBy || "-"}</span>
                        },
                    ]}
                />
            </div>

            <ModalConfirm
                isOpen={!!confirmAction && !!selectedRequest}
                onClose={() => { setConfirmAction(null); setSelectedRequest(null); }}
                onConfirm={handleAction}
                variant={confirmAction === 'reject' ? 'danger' : 'primary'}
                title={confirmAction === 'approve' ? 'Konfirmasi Approve' : 'Konfirmasi Reject'}
                message={
                    confirmAction === 'approve'
                        ? `Setujui perubahan koneksi untuk "${getCustomerName(selectedRequest?.customerId || 0)}"?`
                        : `Tolak request perubahan koneksi untuk "${getCustomerName(selectedRequest?.customerId || 0)}"?`
                }
                confirmLabel={confirmAction === 'approve' ? 'Ya, Approve' : 'Ya, Reject'}
                cancelLabel="Batal"
            />

            <ModalLoading isOpen={showLoading} message="Memproses..." />
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

export default ConnectionApprovalPage;
