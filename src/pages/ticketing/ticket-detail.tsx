import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTicketStore } from "@/store/ticketStore";
import { useAuthStore } from "@/store/authStore";
import { CustomButton } from "@/components/ui/custom-button";
import { CustomTextArea } from "@/components/ui/custom-input";
import { Badge } from "@/components/ui/badge";
import { ModalMessage } from "@/components/ui/modal-message";
import { ModalLoading } from "@/components/ui/modal-loading";
import {
    ArrowLeft,
    AlertTriangle,
    CheckCircle,
    Clock,
    Send,
    Hand,
    MessageSquare,
    User,
    ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface TicketDetailPageProps {
    category: "INCIDENT" | "COMPLAINT";
}

const getStatusColor = (status: string) => {
    switch (status) {
        case "OPEN": return "bg-amber-500";
        case "DISPATCHED": return "bg-blue-500";
        case "CLAIMED": return "bg-indigo-500";
        case "IN_PROGRESS": return "bg-purple-500";
        case "RESOLVED": return "bg-green-500";
        case "CLOSED": return "bg-slate-400";
        default: return "bg-slate-400";
    }
};

const getStatusLabel = (status: string) => {
    switch (status) {
        case "OPEN": return "Open";
        case "DISPATCHED": return "Disposisi";
        case "CLAIMED": return "Di-Claim";
        case "IN_PROGRESS": return "Dikerjakan";
        case "RESOLVED": return "Selesai";
        case "CLOSED": return "Closed";
        default: return status;
    }
};

const getRoleColor = (role: string) => {
    switch (role) {
        case "CS": return "text-blue-600 bg-blue-50";
        case "ADMIN": return "text-purple-600 bg-purple-50";
        case "SUPERADMIN": return "text-red-600 bg-red-50";
        case "TEKNISI": return "text-amber-600 bg-amber-50";
        default: return "text-slate-600 bg-slate-50";
    }
};

const TicketDetailPage: React.FC<TicketDetailPageProps> = ({ category: _category }) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const {
        currentTicket,
        loading,
        fetchTicket,
        addUpdate,
        claimTicket,
        startWork,
        resolveTicket,
        closeTicket,
    } = useTicketStore();

    const [newNote, setNewNote] = useState("");
    const [isEscalation, setIsEscalation] = useState(false);
    const [showLoading, setShowLoading] = useState(false);
    const [showMessage, setShowMessage] = useState({ show: false, title: "", message: "", type: "success" as any });

    useEffect(() => {
        if (id) fetchTicket(Number(id));
    }, [id]);

    if (!currentTicket && !loading) {
        return (
            <div className="flex items-center justify-center h-[400px] text-slate-400">
                Tiket tidak ditemukan.
            </div>
        );
    }

    if (!currentTicket) {
        return <div className="flex items-center justify-center h-[400px] text-slate-400">Loading...</div>;
    }

    const ticket = currentTicket;
    const isTeknisi = user?.role === 'TEKNISI';
    const isCSOrAdmin = ['CS', 'ADMIN', 'SUPERADMIN'].includes(user?.role || '');

    // Determine if user can update
    const canUpdate = (() => {
        if (['RESOLVED', 'CLOSED'].includes(ticket.status)) return false;
        if (isCSOrAdmin && !['CLAIMED', 'IN_PROGRESS'].includes(ticket.status)) return true;
        if (isTeknisi && ['CLAIMED', 'IN_PROGRESS', 'DISPATCHED'].includes(ticket.status)) return true;
        return false;
    })();

    const handleAddNote = async () => {
        if (!newNote.trim()) return;
        setShowLoading(true);
        try {
            await addUpdate(ticket.id, { note: newNote, isEscalation });

            // Auto set to IN_PROGRESS if teknisi adds first update
            if (isTeknisi && ticket.status === 'CLAIMED') {
                await startWork(ticket.id);
            }

            setNewNote("");
            setIsEscalation(false);
            setShowMessage({ show: true, title: "Berhasil", message: "Update berhasil ditambahkan.", type: "success" });
        } catch (error: any) {
            setShowMessage({ show: true, title: "Gagal", message: error.response?.data?.message || error.message, type: "error" });
        } finally { setShowLoading(false); }
    };

    const handleClaim = async () => {
        setShowLoading(true);
        try {
            await claimTicket(ticket.id);
            await fetchTicket(ticket.id);
            setShowMessage({ show: true, title: "Berhasil", message: "Anda berhasil meng-claim tiket ini.", type: "success" });
        } catch (error: any) {
            setShowMessage({ show: true, title: "Gagal", message: error.response?.data?.message || error.message, type: "error" });
        } finally { setShowLoading(false); }
    };

    const handleResolve = async () => {
        if (!newNote.trim()) {
            setShowMessage({ show: true, title: "Perhatian", message: "Tambahkan catatan penyelesaian dulu.", type: "error" });
            return;
        }
        setShowLoading(true);
        try {
            await resolveTicket(ticket.id, { note: newNote });
            await fetchTicket(ticket.id);
            setNewNote("");
            setShowMessage({ show: true, title: "Berhasil", message: "Tiket berhasil di-resolve.", type: "success" });
        } catch (error: any) {
            setShowMessage({ show: true, title: "Gagal", message: error.response?.data?.message || error.message, type: "error" });
        } finally { setShowLoading(false); }
    };

    const handleClose = async () => {
        setShowLoading(true);
        try {
            await closeTicket(ticket.id, { note: newNote || "Tiket ditutup." });
            await fetchTicket(ticket.id);
            setNewNote("");
            setShowMessage({ show: true, title: "Berhasil", message: "Tiket berhasil di-close.", type: "success" });
        } catch (error: any) {
            setShowMessage({ show: true, title: "Gagal", message: error.response?.data?.message || error.message, type: "error" });
        } finally { setShowLoading(false); }
    };

    const slaDeadline = ticket.status === 'OPEN' ? ticket.slaDeadlineCs : ticket.slaDeadlineTech;
    const slaBreached = slaDeadline ? new Date() > new Date(slaDeadline) : false;

    return (
        <div className="space-y-4 pb-20 max-w-5xl">
            {/* Back Button */}
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-primary transition-colors"
            >
                <ArrowLeft size={16} /> Kembali ke List
            </button>

            {/* Ticket Header */}
            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                <div className="bg-gradient-to-r from-slate-50 to-white px-6 py-4 border-b border-slate-100">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <span className="text-lg font-bold text-slate-800">{ticket.ticketNumber}</span>
                                <div className={cn("w-2.5 h-2.5 rounded-full animate-pulse", getStatusColor(ticket.status))} />
                                <Badge variant={ticket.status === 'RESOLVED' ? 'success' : ticket.status === 'CLOSED' ? 'default' : 'warning'} className="text-[10px] uppercase font-bold">
                                    {getStatusLabel(ticket.status)}
                                </Badge>
                                {ticket.isEscalated && (
                                    <Badge variant="destructive" className="text-[10px] uppercase font-bold flex items-center gap-1">
                                        <AlertTriangle size={10} /> Eskalasi
                                    </Badge>
                                )}
                            </div>
                            <h2 className="text-base font-semibold text-slate-700">{ticket.subject}</h2>
                        </div>
                        <div className="text-right">
                            <Badge variant={ticket.priority === 'CRITICAL' ? 'destructive' : ticket.priority === 'HIGH' ? 'warning' : 'secondary'} className="text-xs uppercase font-bold px-3 py-1">
                                {ticket.priority}
                            </Badge>
                            {slaDeadline && (
                                <div className={cn("text-[10px] mt-2 font-bold flex items-center gap-1 justify-end", slaBreached ? "text-red-600" : "text-green-600")}>
                                    <Clock size={10} />
                                    SLA: {slaBreached ? '⚠ BREACH' : format(new Date(slaDeadline), "dd MMM yyyy HH:mm")}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                        <div>
                            <span className="text-[10px] text-slate-400 uppercase tracking-widest block">PELANGGAN</span>
                            <span className="text-sm font-bold text-primary">{ticket.customer?.idPelanggan || "-"}</span>
                            <span className="text-xs text-slate-600 block">{ticket.customer?.namaPelanggan || "-"}</span>
                        </div>
                        <div>
                            <span className="text-[10px] text-slate-400 uppercase tracking-widest block">CABANG / AREA</span>
                            <span className="text-xs text-slate-600">{ticket.customer?.area?.branch?.namaBranch || "-"} / {ticket.customer?.area?.namaArea || "-"}</span>
                        </div>
                        <div>
                            <span className="text-[10px] text-slate-400 uppercase tracking-widest block">DIBUAT OLEH</span>
                            <span className="text-xs text-slate-600">{ticket.createdBy || "-"} ({ticket.createdByRole || "-"})</span>
                            <span className="text-[10px] text-slate-400 block">{format(new Date(ticket.createdAt), "dd MMM yyyy HH:mm", { locale: localeId })}</span>
                        </div>
                        <div>
                            <span className="text-[10px] text-slate-400 uppercase tracking-widest block">TEKNISI</span>
                            <span className="text-xs text-slate-600">{ticket.claimedByName || "Belum di-claim"}</span>
                            {ticket.claimedAt && <span className="text-[10px] text-slate-400 block">Claim: {format(new Date(ticket.claimedAt), "dd MMM HH:mm")}</span>}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">DESKRIPSI</span>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{ticket.description}</p>
                    </div>
                </div>
            </div>

            {/* Action Buttons Bar */}
            <div className="flex gap-2 flex-wrap">
                {isTeknisi && ticket.status === 'DISPATCHED' && !ticket.claimedBy && (
                    <CustomButton variant="primary" onClick={handleClaim} className="h-9">
                        <Hand size={14} className="mr-2" /> Ambil Tiket Ini
                    </CustomButton>
                )}
                {isTeknisi && ['CLAIMED', 'IN_PROGRESS'].includes(ticket.status) && ticket.claimedBy === user?.id && (
                    <CustomButton variant="primary" onClick={handleResolve} className="h-9 bg-green-600 hover:bg-green-700">
                        <CheckCircle size={14} className="mr-2" /> Selesaikan Tiket
                    </CustomButton>
                )}
                {isCSOrAdmin && ticket.status === 'RESOLVED' && (
                    <CustomButton variant="primary" onClick={handleClose} className="h-9 bg-slate-600 hover:bg-slate-700">
                        <CheckCircle size={14} className="mr-2" /> Close Tiket
                    </CustomButton>
                )}
            </div>

            {/* Timeline / Updates */}
            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                <div className="bg-slate-50 px-5 py-2 border-b border-slate-100">
                    <h4 className="font-bold text-slate-700 text-[12px] uppercase tracking-wider flex items-center gap-2">
                        <MessageSquare size={14} /> Riwayat Update ({ticket.updates?.length || 0})
                    </h4>
                </div>

                <div className="p-5">
                    {/* Add Update Form */}
                    {canUpdate && (
                        <div className="mb-6 border border-slate-100 rounded-lg p-4 bg-slate-50/50">
                            <CustomTextArea
                                placeholder="Tambahkan catatan update... (kendala, progress, lokasi, dll)"
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                                rows={3}
                            />
                            <div className="flex items-center justify-between mt-3">
                                <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isEscalation}
                                        onChange={(e) => setIsEscalation(e.target.checked)}
                                        className="rounded border-slate-300"
                                    />
                                    <AlertTriangle size={12} className="text-red-500" />
                                    Tandai sebagai Eskalasi
                                </label>
                                <CustomButton size="sm" onClick={handleAddNote} disabled={!newNote.trim()}>
                                    <Send size={14} className="mr-2" /> Kirim Update
                                </CustomButton>
                            </div>
                        </div>
                    )}

                    {/* Timeline */}
                    <div className="space-y-0">
                        {(ticket.updates || []).map((update, idx) => (
                            <div key={update.id} className="flex gap-4 relative">
                                {/* Timeline Line */}
                                <div className="flex flex-col items-center">
                                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2",
                                        update.isEscalation ? "bg-red-50 border-red-200" : getRoleColor(update.updatedByRole)
                                    )}>
                                        <User size={14} />
                                    </div>
                                    {idx < (ticket.updates?.length || 0) - 1 && (
                                        <div className="w-0.5 flex-1 bg-slate-100 min-h-[20px]" />
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 pb-6">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-bold text-slate-700">{update.updatedBy}</span>
                                        <Badge variant="secondary" className="text-[9px] uppercase font-bold px-1.5 py-0">{update.updatedByRole}</Badge>
                                        {update.isEscalation && <Badge variant="destructive" className="text-[9px] uppercase font-bold px-1.5 py-0">Eskalasi</Badge>}
                                        {update.statusBefore !== update.statusAfter && update.statusAfter && (
                                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                                {update.statusBefore} <ChevronRight size={10} /> <span className="font-bold text-primary">{update.statusAfter}</span>
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-slate-400 block mb-2">{format(new Date(update.createdAt), "dd MMM yyyy HH:mm:ss", { locale: localeId })}</span>
                                    <p className="text-sm text-slate-600 whitespace-pre-wrap bg-white rounded-lg p-3 border border-slate-100">{update.note}</p>
                                    {update.images && (() => {
                                        try {
                                            const imgs = JSON.parse(update.images);
                                            return imgs.length > 0 ? (
                                                <div className="flex gap-2 mt-2 flex-wrap">
                                                    {imgs.map((img: string, i: number) => (
                                                        <div key={i} className="w-20 h-20 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                                                            <img src={img} alt="" className="w-full h-full object-cover" />
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : null;
                                        } catch { return null; }
                                    })()}
                                </div>
                            </div>
                        ))}

                        {(!ticket.updates || ticket.updates.length === 0) && (
                            <div className="text-center py-8 text-slate-400 text-sm">
                                Belum ada update pada tiket ini.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ModalLoading isOpen={showLoading} message="Memproses..." />
            <ModalMessage
                isOpen={showMessage.show}
                onClose={() => setShowMessage(prev => ({ ...prev, show: false }))}
                {...showMessage}
            />
        </div>
    );
};

export default TicketDetailPage;
