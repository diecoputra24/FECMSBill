import React, { useState, useEffect, useMemo } from "react";
import { useUpgradeRequestStore } from "@/store/upgradeRequestStore";
import type { UpgradeRequest } from "@/store/upgradeRequestStore";
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
    ArrowUpDown,
    TrendingUp,
    TrendingDown
} from "lucide-react";

import { format } from "date-fns";
import { id } from "date-fns/locale";

const UpgradeApprovalPage: React.FC = () => {
    const { requests, fetchRequests, approveRequest, rejectRequest, loading } = useUpgradeRequestStore();
    const { customers, fetchCustomers, fetchConnections } = useCustomerStore();
    const { packages, fetchPackages } = usePackageStore();

    const [selectedRequest, setSelectedRequest] = useState<UpgradeRequest | null>(null);
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

    const getPacketName = (paketId: number) => {
        const paket = packages.find(p => p.id === paketId);
        return paket?.namaPaket || "-";
    };

    const getPacketPrice = (paketId: number) => {
        const paket = packages.find(p => p.id === paketId);
        return Number(paket?.hargaPaket) || 0;
    };


    const handleAction = async () => {
        if (!selectedRequest || !confirmAction) return;

        setShowLoading(true);
        try {
            if (confirmAction === 'approve') {
                await approveRequest(selectedRequest.id, undefined, "Admin");
                // Refresh connections data so other pages see the update
                await fetchConnections(true);
                setShowMessage({
                    show: true,
                    title: "Berhasil!",
                    message: "Request upgrade berhasil di-approve dan telah disinkronkan ke MikroTik.",
                    type: "success"
                });
            } else {
                await rejectRequest(selectedRequest.id, undefined, "Admin");
                setShowMessage({
                    show: true,
                    title: "Ditolak",
                    message: "Request upgrade telah ditolak.",
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
                            header: "PAKET LAMA",
                            render: (row) => (
                                <div>
                                    <p className="font-bold text-slate-700">{getPacketName(row.currentPaketId)}</p>
                                    <p className="text-[10px] text-slate-400">Rp {getPacketPrice(row.currentPaketId).toLocaleString('id-ID')}</p>
                                </div>
                            )
                        },
                        {
                            header: "PAKET BARU",
                            render: (row) => {
                                const priceDiff = getPacketPrice(row.newPaketId) - getPacketPrice(row.currentPaketId);
                                const isUpgrade = priceDiff >= 0;
                                return (
                                    <div className="flex items-center gap-2">
                                        <div>
                                            <p className="font-bold text-slate-700">{getPacketName(row.newPaketId)}</p>
                                            <p className="text-[10px] text-slate-400">Rp {getPacketPrice(row.newPaketId).toLocaleString('id-ID')}</p>
                                        </div>
                                        <Badge variant={isUpgrade ? "success" : "warning"} className="text-[9px] flex items-center gap-1">
                                            {isUpgrade ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                            {isUpgrade ? "+" : ""}Rp {priceDiff.toLocaleString('id-ID')}
                                        </Badge>
                                    </div>
                                );
                            }
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
                    <ArrowUpDown size={14} className="text-slate-500" />
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
                                <span className="text-xs">
                                    {getPacketName(row.currentPaketId)} → {getPacketName(row.newPaketId)}
                                </span>
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
                variant={confirmAction === 'reject' ? 'danger' : 'primary'}
                title={confirmAction === 'approve' ? 'Konfirmasi Approve' : 'Konfirmasi Reject'}
                message={
                    confirmAction === 'approve'
                        ? `Apakah Anda yakin ingin menyetujui perubahan paket untuk "${getCustomerName(selectedRequest?.customerId || 0)}"? Perubahan akan langsung diterapkan ke MikroTik.`
                        : `Apakah Anda yakin ingin menolak request perubahan paket untuk "${getCustomerName(selectedRequest?.customerId || 0)}"?`
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

export default UpgradeApprovalPage;
