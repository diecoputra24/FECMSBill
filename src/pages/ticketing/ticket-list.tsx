import React, { useState, useEffect, useMemo } from "react";
import { useTicketStore } from "@/store/ticketStore";
import type { Ticket, TicketUpdate } from "@/store/ticketStore";
import { useBranchStore } from "@/store/branchStore";
import { CustomTable } from "@/components/ui/custom-table";
import { CustomFilter } from "@/components/ui/custom-filter";
import { CustomButton } from "@/components/ui/custom-button";
import { Badge } from "@/components/ui/badge";
import { ModalDetail } from "@/components/ui/modal-detail";
import { ModalMessage } from "@/components/ui/modal-message";
import { ModalLoading } from "@/components/ui/modal-loading";
import { CustomSelect } from "@/components/ui/custom-select";
import { CustomTextArea } from "@/components/ui/custom-input";
import {
    AlertTriangle,
    CheckCircle,
    Truck,
    X,
    Camera,
    User,
    Clock,
    FileText,
    ChevronLeft,
    ImagePlus,
    Send,
    RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { useAuthStore } from "@/store/authStore";
import { createPortal } from "react-dom";

interface TicketListPageProps {
    category: "INCIDENT" | "COMPLAINT";
}

const getStatusVariant = (status: string): any => {
    switch (status) {
        case "OPEN": return "warning";
        case "DISPATCHED": return "secondary";
        case "CLAIMED": return "secondary";
        case "IN_PROGRESS": return "secondary";
        case "RESOLVED": return "success";
        case "CLOSED": return "default";
        default: return "secondary";
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

const getPriorityVariant = (priority: string): any => {
    switch (priority) {
        case "CRITICAL": return "destructive";
        case "HIGH": return "warning";
        case "MEDIUM": return "secondary";
        case "LOW": return "default";
        default: return "secondary";
    }
};



// ==================== PHOTO LIGHTBOX ====================
const PhotoLightbox: React.FC<{ images: string[]; onClose: () => void }> = ({ images, onClose }) => {
    const [activeIdx, setActiveIdx] = useState(0);
    return createPortal(
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 max-w-3xl w-full">
                <button onClick={onClose} className="absolute -top-10 right-0 text-white/70 hover:text-white transition-colors">
                    <X size={24} />
                </button>
                <div className="bg-white rounded-xl overflow-hidden shadow-2xl">
                    <img
                        src={images[activeIdx]}
                        alt={`Foto ${activeIdx + 1}`}
                        className="w-full max-h-[70vh] object-contain bg-slate-50"
                    />
                    {images.length > 1 && (
                        <div className="flex gap-2 p-3 bg-white border-t border-slate-100 overflow-x-auto justify-center">
                            {images.map((img, i) => (
                                <button
                                    key={i}
                                    onClick={() => setActiveIdx(i)}
                                    className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${i === activeIdx ? 'border-primary shadow-md scale-105' : 'border-slate-200 opacity-60 hover:opacity-100'
                                        }`}
                                >
                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

// ==================== TIMELINE CARD ====================
const TimelineCard: React.FC<{
    update: TicketUpdate;
    isActive: boolean;
    isPast: boolean;
    isLast: boolean;
    onViewPhotos: (images: string[]) => void;
}> = ({ update, isActive, isPast, isLast, onViewPhotos }) => {
    let parsedImages: string[] = [];
    if (update.images) {
        try { parsedImages = JSON.parse(update.images); } catch { /* ignore */ }
    }

    const dotColor = isActive
        ? "bg-primary ring-4 ring-primary/20"
        : isPast
            ? "bg-slate-400"
            : "bg-slate-200";

    const lineColor = isPast || isActive ? "bg-slate-300" : "bg-slate-100";

    return (
        <div className="flex gap-4">
            {/* Dot + Line */}
            <div className="flex flex-col items-center flex-shrink-0 w-6">
                <div className={`w-3.5 h-3.5 rounded-full ${dotColor} transition-all duration-300 mt-1.5`} />
                {!isLast && <div className={`w-0.5 flex-1 ${lineColor} min-h-[20px]`} />}
            </div>

            {/* Card */}
            <div className="flex-1 mb-4 rounded-lg border border-slate-200 bg-slate-50 transition-all duration-200">
                <div className="p-3.5">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1">
                            {update.statusBefore && update.statusAfter && (
                                <div className="flex items-center gap-1.5 mb-1.5">
                                    <Badge variant={getStatusVariant(update.statusBefore)} className="text-[8px] uppercase font-bold px-1.5 py-0">
                                        {getStatusLabel(update.statusBefore)}
                                    </Badge>
                                    <span className="text-[10px] text-slate-300">→</span>
                                    <Badge variant={getStatusVariant(update.statusAfter)} className="text-[8px] uppercase font-bold px-1.5 py-0">
                                        {getStatusLabel(update.statusAfter)}
                                    </Badge>
                                </div>
                            )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap flex items-center gap-1">
                            <Clock size={10} />
                            {format(new Date(update.createdAt), "dd/MM/yy HH:mm", { locale: localeId })}
                        </span>
                    </div>

                    {/* Note */}
                    <p className="text-xs text-slate-700 leading-relaxed mb-2.5">{update.note}</p>

                    {/* Footer: Person + Photos */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                                <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center">
                                    <User size={10} className="text-slate-500" />
                                </div>
                                <span className="text-[11px] font-bold text-slate-600">{update.updatedBy}</span>
                            </div>
                            <Badge variant="secondary" className="text-[8px] font-bold uppercase px-1.5 py-0">
                                {update.updatedByRole}
                            </Badge>
                        </div>

                        {parsedImages.length > 0 && (
                            <button
                                onClick={() => onViewPhotos(parsedImages)}
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors group"
                            >
                                <Camera size={12} className="group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-bold">{parsedImages.length} Foto</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ==================== DETAIL MODAL ====================
const TicketDetailModal: React.FC<{
    ticket: Ticket | null;
    onClose: () => void;
    category: string;
    userRole: string;
    onAction: (action: string, ticket: Ticket) => void;
    onAddUpdate: (ticketId: number, note: string, images?: string) => Promise<void>;
}> = ({ ticket, onClose, userRole, onAction, onAddUpdate }) => {
    const [lightboxImages, setLightboxImages] = useState<string[] | null>(null);
    const [updateNote, setUpdateNote] = useState("");
    const [updateImages, setUpdateImages] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);

    if (!ticket) return null;

    const updates = ticket.updates ? [...ticket.updates].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ) : [];

    // Determine active update index (newest = first)
    const activeIdx = 0;

    const csDeadline = ticket.slaDeadlineCs;
    const techDeadline = ticket.slaDeadlineTech;

    return createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 md:p-6">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" />

            <div className="relative w-full max-w-5xl max-h-[92vh] bg-white rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 flex flex-col">
                {/* Header */}
                <div className="px-6 py-3.5 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <button onClick={onClose} className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
                            <ChevronLeft size={16} />
                        </button>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-mono font-black text-primary">#{ticket.ticketNumber}</span>
                                <Badge variant={getStatusVariant(ticket.status)} className="text-[8px] uppercase font-bold px-2 py-0">
                                    {getStatusLabel(ticket.status)}
                                </Badge>
                                <Badge variant={getPriorityVariant(ticket.priority)} className="text-[8px] uppercase font-bold px-2 py-0">
                                    {ticket.priority}
                                </Badge>
                                {ticket.isEscalated && <AlertTriangle size={12} className="text-red-500" />}
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    {/* LEFT: Ticket + Customer Info */}
                    <div className="md:w-[380px] lg:w-[420px] shrink-0 border-r border-slate-100 overflow-y-auto">
                        <div className="p-5 space-y-5">
                            {/* Customer Card */}
                            <div className="rounded-lg border border-slate-100 overflow-hidden">
                                <div className="bg-slate-50 px-4 py-2 border-b border-slate-100">
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Data Pelanggan</h4>
                                </div>
                                <div className="p-4 space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <span className="text-[9px] text-slate-400 uppercase tracking-wider block">ID Pelanggan</span>
                                            <span className="text-xs font-bold text-primary">{ticket.customer?.idPelanggan || "-"}</span>
                                        </div>
                                        <div>
                                            <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Nama</span>
                                            <span className="text-xs font-bold text-slate-700">{ticket.customer?.namaPelanggan || "-"}</span>
                                        </div>
                                        <div>
                                            <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Telepon</span>
                                            <span className="text-xs text-slate-600">{ticket.customer?.teleponPelanggan || "-"}</span>
                                        </div>
                                        <div>
                                            <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Area</span>
                                            <span className="text-xs text-slate-600">{ticket.customer?.area?.namaArea || "-"}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Alamat</span>
                                        <span className="text-xs text-slate-600 leading-relaxed">{ticket.customer?.alamatPelanggan || "-"}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Ticket Info Card */}
                            <div className="rounded-lg border border-slate-100 overflow-hidden">
                                <div className="bg-slate-50 px-4 py-2 border-b border-slate-100">
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Data Tiket</h4>
                                </div>
                                <div className="p-4 space-y-3">
                                    <div>
                                        <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Subjek</span>
                                        <span className="text-xs font-bold text-slate-700">{ticket.subject}</span>
                                    </div>
                                    <div>
                                        <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Deskripsi</span>
                                        <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Dibuat</span>
                                            <span className="text-xs text-slate-600">
                                                {format(new Date(ticket.createdAt), "dd MMM yyyy HH:mm", { locale: localeId })}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Dibuat Oleh</span>
                                            <span className="text-xs text-slate-600">{ticket.createdBy || "-"}</span>
                                        </div>
                                    </div>

                                    {/* SLA */}
                                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-50">
                                        <div>
                                            <span className="text-[9px] text-slate-400 uppercase tracking-wider block">SLA CS</span>
                                            {csDeadline ? (() => {
                                                const diffMs = new Date(csDeadline).getTime() - new Date().getTime();
                                                if (diffMs <= 0) return <span className="text-xs font-bold text-red-600">⚠ BREACH</span>;
                                                const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                                                return <span className="text-xs font-bold text-green-600">{days < 1 ? '<1 hari' : `${days} hari`}</span>;
                                            })() : <span className="text-xs text-slate-400">-</span>}
                                        </div>
                                        <div>
                                            <span className="text-[9px] text-slate-400 uppercase tracking-wider block">SLA Teknisi</span>
                                            {ticket.dispatchedTo && techDeadline ? (() => {
                                                const diffMs = new Date(techDeadline).getTime() - new Date().getTime();
                                                if (diffMs <= 0) return <span className="text-xs font-bold text-red-600">⚠ BREACH</span>;
                                                const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                                                return <span className="text-xs font-bold text-green-600">{days < 1 ? '<1 hari' : `${days} hari`}</span>;
                                            })() : <span className="text-xs text-slate-400">-</span>}
                                        </div>
                                    </div>

                                    {/* Handler */}
                                    {ticket.claimedByName && (
                                        <div className="pt-2 border-t border-slate-50">
                                            <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Ditangani Oleh</span>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <User size={12} className="text-primary" />
                                                </div>
                                                <span className="text-xs font-bold text-slate-700">{ticket.claimedByName}</span>
                                            </div>
                                        </div>
                                    )}

                                    {ticket.dispatchedTo && (
                                        <div>
                                            <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Didisposisi Ke</span>
                                            <Badge variant="secondary" className="text-[9px] font-bold uppercase mt-0.5">
                                                {ticket.dispatchedTo}
                                            </Badge>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Action buttons at bottom of left panel */}
                            {(() => {
                                const isTeknisi = userRole === 'TEKNISI';
                                const isCSOrAdmin = ['CS', 'ADMIN', 'SUPERADMIN'].includes(userRole);
                                const actions: { label: string; action: string; variant: 'primary' | 'outline'; icon: React.ReactNode }[] = [];

                                if (isCSOrAdmin) {
                                    if (ticket.status === 'OPEN') {
                                        actions.push({ label: 'Disposisi Tiket', action: 'dispatch', variant: 'primary', icon: <Truck size={14} className="mr-2" /> });
                                        actions.push({ label: 'Resolve Langsung', action: 'resolve', variant: 'outline', icon: <CheckCircle size={14} className="mr-2" /> });
                                    }
                                    if (ticket.status === 'RESOLVED') {
                                        actions.push({ label: 'Close Tiket', action: 'close', variant: 'outline', icon: <X size={14} className="mr-2" /> });
                                    }
                                }
                                if (isTeknisi) {
                                    if (ticket.status === 'DISPATCHED' && !ticket.claimedBy) {
                                        actions.push({ label: 'Ambil Tiket', action: 'claim', variant: 'primary', icon: <User size={14} className="mr-2" /> });
                                    }
                                    if (ticket.status === 'CLAIMED' || ticket.status === 'IN_PROGRESS') {
                                        actions.push({ label: 'Resolve Tiket', action: 'resolve', variant: 'primary', icon: <CheckCircle size={14} className="mr-2" /> });
                                    }
                                }
                                // Change category for CS/Admin
                                if (isCSOrAdmin && ticket.status !== 'CLOSED') {
                                    const targetCategory = ticket.category === 'COMPLAINT' ? 'INCIDENT' : 'COMPLAINT';
                                    const targetLabel = targetCategory === 'INCIDENT' ? 'Incident' : 'Complaint';
                                    actions.push({ label: `Ubah ke ${targetLabel}`, action: 'changeCategory', variant: 'outline', icon: <RefreshCw size={14} className="mr-2" /> });
                                }

                                if (actions.length === 0) return null;
                                return (
                                    <div className="space-y-2 pt-2">
                                        {actions.map((act) => (
                                            <CustomButton
                                                key={act.action}
                                                variant={act.variant}
                                                className="w-full h-9 text-xs font-bold"
                                                onClick={() => onAction(act.action, ticket)}
                                            >
                                                {act.icon}
                                                {act.label}
                                            </CustomButton>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>

                    {/* RIGHT: Timeline Rundown */}
                    <div className="flex-1 overflow-y-auto bg-slate-50/30">
                        <div className="p-5">
                            {/* Add Update Form */}
                            {(() => {
                                const isTeknisiRole = userRole === 'TEKNISI';
                                const isCSAdmin = ['CS', 'ADMIN', 'SUPERADMIN'].includes(userRole);
                                const canUpdate = ticket.status !== 'CLOSED' && (
                                    isCSAdmin ||
                                    (isTeknisiRole && ['DISPATCHED', 'CLAIMED', 'IN_PROGRESS'].includes(ticket.status))
                                );
                                if (!canUpdate) return null;
                                return (
                                    <div className="mb-5 rounded-lg border border-slate-200 bg-white p-4">
                                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-3">Tambah Update</h4>
                                        <textarea
                                            className="w-full h-20 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none placeholder:text-slate-400"
                                            placeholder="Tulis catatan update..."
                                            value={updateNote}
                                            onChange={(e) => setUpdateNote(e.target.value)}
                                        />
                                        {/* Image previews */}
                                        {updateImages.length > 0 && (
                                            <div className="flex gap-2 mt-2 flex-wrap">
                                                {updateImages.map((img, i) => (
                                                    <div key={i} className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-200">
                                                        <img src={img} alt="" className="w-full h-full object-cover" />
                                                        <button
                                                            onClick={() => setUpdateImages(prev => prev.filter((_, idx) => idx !== i))}
                                                            className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white rounded-bl-md flex items-center justify-center"
                                                        >
                                                            <X size={8} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between mt-3">
                                            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer">
                                                <ImagePlus size={14} />
                                                <span className="text-[10px] font-bold">Foto</span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    multiple
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const files = Array.from(e.target.files || []);
                                                        files.forEach(file => {
                                                            const reader = new FileReader();
                                                            reader.onload = (ev) => {
                                                                const img = new Image();
                                                                img.onload = () => {
                                                                    const canvas = document.createElement('canvas');
                                                                    const maxW = 800;
                                                                    const scale = Math.min(1, maxW / img.width);
                                                                    canvas.width = img.width * scale;
                                                                    canvas.height = img.height * scale;
                                                                    const ctx = canvas.getContext('2d')!;
                                                                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                                                                    const compressed = canvas.toDataURL('image/jpeg', 0.7);
                                                                    setUpdateImages(prev => [...prev, compressed]);
                                                                };
                                                                img.src = ev.target?.result as string;
                                                            };
                                                            reader.readAsDataURL(file);
                                                        });
                                                        e.target.value = '';
                                                    }}
                                                />
                                            </label>
                                            <button
                                                disabled={!updateNote.trim() || submitting}
                                                onClick={async () => {
                                                    if (!updateNote.trim()) return;
                                                    setSubmitting(true);
                                                    try {
                                                        await onAddUpdate(
                                                            ticket.id,
                                                            updateNote,
                                                            updateImages.length > 0 ? JSON.stringify(updateImages) : undefined
                                                        );
                                                        setUpdateNote("");
                                                        setUpdateImages([]);
                                                    } finally {
                                                        setSubmitting(false);
                                                    }
                                                }}
                                                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-[10px] font-bold transition-colors ${!updateNote.trim() || submitting
                                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                    : 'bg-primary text-white hover:bg-primary/90'
                                                    }`}
                                            >
                                                <Send size={12} />
                                                {submitting ? 'Mengirim...' : 'Kirim'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })()}

                            <div className="flex items-center gap-2 mb-5">
                                <FileText size={14} className="text-slate-500" />
                                <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Riwayat Tiket</h4>
                                <span className="text-[10px] text-slate-400 font-medium ml-auto">{updates.length} update</span>
                            </div>

                            {updates.length > 0 ? (
                                <div className="space-y-0">
                                    {updates.map((u, idx) => (
                                        <TimelineCard
                                            key={u.id}
                                            update={u}
                                            isActive={idx === activeIdx}
                                            isPast={idx < activeIdx}
                                            isLast={idx === updates.length - 1}
                                            onViewPhotos={(imgs) => setLightboxImages(imgs)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 text-slate-300">
                                    <Clock size={32} className="mb-3 opacity-50" />
                                    <span className="text-sm font-medium">Belum ada riwayat update</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {lightboxImages && (
                <PhotoLightbox images={lightboxImages} onClose={() => setLightboxImages(null)} />
            )}
        </div >,
        document.body
    );
};

// ==================== MAIN PAGE ====================
const TicketListPage: React.FC<TicketListPageProps> = ({ category }) => {
    const { user } = useAuthStore();
    const {
        tickets,
        loading,
        fetchTickets,
        fetchTicket,
        incidentList,
        complaintList,
        setFilterValues,
        setAppliedFilters,
        setPagination,
        resetFilters,
        dispatchTicket,
        claimTicket,
        addUpdate,
        resolveTicket,
        resolveDirectly,
        closeTicket,
        changeCategory,
    } = useTicketStore();

    const { branches, fetchBranches, loading: branchLoading } = useBranchStore();

    const listState = category === 'INCIDENT' ? incidentList : complaintList;
    const { filterValues, appliedFilters, pagination } = listState;

    // Modal states
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [showDispatchModal, setShowDispatchModal] = useState<Ticket | null>(null);
    const [showResolveModal, setShowResolveModal] = useState<Ticket | null>(null);
    const [showCloseModal, setShowCloseModal] = useState<Ticket | null>(null);
    const [showLoading, setShowLoading] = useState(false);
    const [showMessage, setShowMessage] = useState({ show: false, title: "", message: "", type: "success" as any });

    const [dispatchData, setDispatchData] = useState({ priority: "MEDIUM", note: "", dispatchTarget: "TEKNISI" });
    const [resolveNote, setResolveNote] = useState("");
    const [closeNote, setCloseNote] = useState("");

    useEffect(() => {
        fetchTickets(category, true);
        fetchBranches();
    }, [category]);

    const handleSearch = () => {
        setAppliedFilters(category, { ...filterValues });
        setPagination(category, { currentPage: 1 });
    };

    const handleReset = () => {
        resetFilters(category);
    };

    const categoryTickets = useMemo(() => {
        return tickets.filter(t => {
            if (t.category !== category) return false;
            if (appliedFilters.status && appliedFilters.status !== "all") {
                if (t.status !== appliedFilters.status) return false;
            }
            if (appliedFilters.priority && appliedFilters.priority !== "all") {
                if (t.priority !== appliedFilters.priority) return false;
            }
            if (appliedFilters.branchId && appliedFilters.branchId !== "all" && appliedFilters.branchId !== "") {
                if (t.customer?.area?.branchId?.toString() !== appliedFilters.branchId) return false;
            }
            if (appliedFilters.search) {
                const s = appliedFilters.search.toLowerCase();
                const matchTicket = t.ticketNumber.toLowerCase().includes(s);
                const matchCustomer = t.customer?.namaPelanggan?.toLowerCase().includes(s) ||
                    t.customer?.idPelanggan?.toLowerCase().includes(s);
                const matchSubject = t.subject.toLowerCase().includes(s);
                if (!matchTicket && !matchCustomer && !matchSubject) return false;
            }
            return true;
        });
    }, [tickets, category, appliedFilters]);

    const paginatedTickets = categoryTickets.slice(
        (pagination.currentPage - 1) * pagination.pageSize,
        pagination.currentPage * pagination.pageSize
    );

    // Row click → fetch full detail (with updates) then show modal
    const handleRowClick = async (ticket: Ticket) => {
        setShowLoading(true);
        try {
            await fetchTicket(ticket.id);
            // After fetch, currentTicket will be updated in the store
            // We need to get it from the store after the await
            const fullTicket = useTicketStore.getState().currentTicket;
            setSelectedTicket(fullTicket || ticket);
        } catch {
            setSelectedTicket(ticket);
        } finally {
            setShowLoading(false);
        }
    };

    const handleAction = async (action: string, ticket: Ticket) => {
        if (action === 'claim') {
            setSelectedTicket(null);
            setShowLoading(true);
            try {
                await claimTicket(ticket.id);
                setShowMessage({ show: true, title: "Berhasil", message: `Anda berhasil meng-claim tiket #${ticket.ticketNumber}.`, type: "success" });
            } catch (error: any) {
                setShowMessage({ show: true, title: "Gagal", message: error.response?.data?.message || error.message, type: "error" });
            } finally { setShowLoading(false); }
            return;
        }
        if (action === 'changeCategory') {
            setSelectedTicket(null);
            setShowLoading(true);
            try {
                const newCategory = ticket.category === 'COMPLAINT' ? 'INCIDENT' : 'COMPLAINT';
                const label = newCategory === 'INCIDENT' ? 'Incident' : 'Complaint';
                await changeCategory(ticket.id, newCategory);
                setShowMessage({ show: true, title: "Berhasil", message: `Tiket #${ticket.ticketNumber} berhasil diubah menjadi ${label}.`, type: "success" });
            } catch (error: any) {
                setShowMessage({ show: true, title: "Gagal", message: error.response?.data?.message || error.message, type: "error" });
            } finally { setShowLoading(false); }
            return;
        }
        setSelectedTicket(null);
        if (action === 'dispatch') setShowDispatchModal(ticket);
        if (action === 'resolve') setShowResolveModal(ticket);
        if (action === 'close') setShowCloseModal(ticket);
    };

    const handleDispatch = async () => {
        if (!showDispatchModal) return;
        setShowLoading(true);
        setShowDispatchModal(null);
        try {
            await dispatchTicket(showDispatchModal.id, dispatchData);
            setShowMessage({ show: true, title: "Berhasil", message: `Tiket berhasil di-disposisi ke ${dispatchData.dispatchTarget}.`, type: "success" });
            setDispatchData({ priority: "MEDIUM", note: "", dispatchTarget: "TEKNISI" });
        } catch (error: any) {
            setShowMessage({ show: true, title: "Gagal", message: error.response?.data?.message || error.message, type: "error" });
        } finally { setShowLoading(false); }
    };

    const handleResolveDirect = async () => {
        if (!showResolveModal) return;
        setShowLoading(true);
        setShowResolveModal(null);
        try {
            if (showResolveModal.status === 'OPEN') {
                await resolveDirectly(showResolveModal.id, { note: resolveNote });
            } else {
                await resolveTicket(showResolveModal.id, { note: resolveNote });
            }
            setShowMessage({ show: true, title: "Berhasil", message: "Tiket berhasil di-resolve.", type: "success" });
            setResolveNote("");
        } catch (error: any) {
            setShowMessage({ show: true, title: "Gagal", message: error.response?.data?.message || error.message, type: "error" });
        } finally { setShowLoading(false); }
    };

    const handleClose = async () => {
        if (!showCloseModal) return;
        setShowLoading(true);
        setShowCloseModal(null);
        try {
            await closeTicket(showCloseModal.id, { note: closeNote });
            setShowMessage({ show: true, title: "Berhasil", message: "Tiket berhasil di-close.", type: "success" });
            setCloseNote("");
        } catch (error: any) {
            setShowMessage({ show: true, title: "Gagal", message: error.response?.data?.message || error.message, type: "error" });
        } finally { setShowLoading(false); }
    };

    // Clean table columns — 1 data per cell, no action buttons
    const columns = [
        {
            header: "NO. TIKET",
            render: (row: Ticket) => (
                <span className="text-xs font-mono font-bold text-primary">{row.ticketNumber}</span>
            )
        },
        {
            header: "TANGGAL",
            render: (row: Ticket) => (
                <span className="text-xs text-slate-500">{format(new Date(row.createdAt), "dd/MM/yy HH:mm", { locale: localeId })}</span>
            )
        },
        {
            header: "ID PELANGGAN",
            render: (row: Ticket) => (
                <span className="text-xs font-mono text-slate-600">{row.customer?.idPelanggan || "-"}</span>
            )
        },
        {
            header: "NAMA PELANGGAN",
            render: (row: Ticket) => (
                <span className="text-xs font-semibold text-slate-700">{row.customer?.namaPelanggan || "-"}</span>
            )
        },
        {
            header: "SUBJEK",
            render: (row: Ticket) => (
                <span className="text-xs text-slate-600 max-w-[200px] truncate block" title={row.subject}>{row.subject}</span>
            )
        },
        {
            header: "PRIORITAS",
            render: (row: Ticket) => (
                <Badge variant={getPriorityVariant(row.priority)} className="text-[9px] uppercase font-bold px-2 py-0.5">{row.priority}</Badge>
            )
        },
        {
            header: "STATUS",
            render: (row: Ticket) => (
                <Badge variant={getStatusVariant(row.status)} className="text-[9px] uppercase font-bold px-2 py-0.5">{getStatusLabel(row.status)}</Badge>
            )
        },
        {
            header: "SLA",
            render: (row: Ticket) => {
                const deadline = row.slaDeadlineTech || row.slaDeadlineCs;
                if (!deadline) return <span className="text-[10px] text-slate-400">-</span>;
                const now = new Date();
                const dl = new Date(deadline);
                const diffMs = dl.getTime() - now.getTime();
                const breached = diffMs <= 0;
                if (breached) {
                    const overHours = Math.abs(Math.floor(diffMs / (1000 * 60 * 60)));
                    return <span className="text-[10px] font-bold text-red-600">⚠ +{overHours}j</span>;
                }
                const hoursLeft = Math.floor(diffMs / (1000 * 60 * 60));
                const daysLeft = Math.floor(hoursLeft / 24);
                const remainHours = hoursLeft % 24;
                const label = daysLeft > 0 ? `${daysLeft}h ${remainHours}j` : `${hoursLeft}j`;
                return <span className={`text-[10px] font-bold ${hoursLeft < 12 ? 'text-amber-600' : 'text-green-600'}`}>{label}</span>;
            }
        },
        {
            header: "DITANGANI OLEH",
            render: (row: Ticket) => {
                if (row.claimedByName) {
                    return (
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs text-slate-700 font-medium">{row.claimedByName}</span>
                            <Badge variant="secondary" className="text-[8px] font-bold uppercase px-1.5 py-0">TEKNISI</Badge>
                        </div>
                    );
                }
                if (row.dispatchedTo) {
                    return (
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs text-slate-400 italic">Menunggu</span>
                            <Badge variant="secondary" className="text-[8px] font-bold uppercase px-1.5 py-0">{row.dispatchedTo}</Badge>
                        </div>
                    );
                }
                if (row.createdBy) {
                    return (
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs text-slate-700 font-medium">{row.createdBy}</span>
                            <Badge variant="secondary" className="text-[8px] font-bold uppercase px-1.5 py-0">CS</Badge>
                        </div>
                    );
                }
                return <span className="text-xs text-slate-400">-</span>;
            }
        },
    ];

    const categoryLabel = category === 'INCIDENT' ? 'Incident' : 'Complaint';

    return (
        <div className="space-y-4 pb-20">
            <CustomFilter
                onSearch={handleSearch}
                onReset={handleReset}
                loading={loading}
                filters={[
                    {
                        label: "Cabang",
                        placeholder: "Semua Cabang",
                        value: filterValues.branchId,
                        type: "select",
                        options: [{ label: "Semua Cabang", value: "all" }, ...branches.map(b => ({ label: b.namaBranch, value: b.id.toString() }))],
                        loading: branchLoading,
                        onChange: (val: string) => setFilterValues(category, { branchId: val })
                    },
                    {
                        label: "Status",
                        placeholder: "Semua Status",
                        value: filterValues.status,
                        type: "select",
                        options: [
                            { label: "Semua Status", value: "all" },
                            { label: "Open", value: "OPEN" },
                            { label: "Disposisi", value: "DISPATCHED" },
                            { label: "Di-Claim", value: "CLAIMED" },
                            { label: "Dikerjakan", value: "IN_PROGRESS" },
                            { label: "Selesai", value: "RESOLVED" },
                            { label: "Closed", value: "CLOSED" },
                        ],
                        onChange: (val: string) => setFilterValues(category, { status: val })
                    },
                    {
                        label: "Prioritas",
                        placeholder: "Semua Prioritas",
                        value: filterValues.priority,
                        type: "select",
                        options: [
                            { label: "Semua Prioritas", value: "all" },
                            { label: "Critical", value: "CRITICAL" },
                            { label: "High", value: "HIGH" },
                            { label: "Medium", value: "MEDIUM" },
                            { label: "Low", value: "LOW" },
                        ],
                        onChange: (val: string) => setFilterValues(category, { priority: val })
                    },
                    {
                        label: "Cari",
                        placeholder: "No. Tiket, Pelanggan, Subjek...",
                        value: filterValues.search,
                        type: "text",
                        onChange: (val: string) => setFilterValues(category, { search: val })
                    }
                ]}
            />

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-1">
                <CustomTable
                    data={paginatedTickets}
                    columns={columns}
                    loading={loading}
                    onRowClick={handleRowClick}
                    emptyMessage={`Tidak ada tiket ${categoryLabel}.`}
                    pagination={{
                        currentPage: pagination.currentPage,
                        totalItems: categoryTickets.length,
                        pageSize: pagination.pageSize,
                        onPageChange: (page) => setPagination(category, { currentPage: page }),
                        onPageSizeChange: (size) => setPagination(category, { pageSize: size, currentPage: 1 })
                    }}
                />
            </div>

            {/* Detail Modal with Timeline */}
            <TicketDetailModal
                ticket={selectedTicket}
                onClose={() => setSelectedTicket(null)}
                category={category}
                userRole={user?.role || ''}
                onAction={handleAction}
                onAddUpdate={async (ticketId, note, images) => {
                    await addUpdate(ticketId, { note, images });
                    // Refresh ticket detail to show new update
                    await fetchTicket(ticketId);
                    const refreshed = useTicketStore.getState().currentTicket;
                    if (refreshed) setSelectedTicket(refreshed);
                }}
            />

            {/* Dispatch Modal */}
            <ModalDetail
                isOpen={!!showDispatchModal}
                onClose={() => setShowDispatchModal(null)}
                title="Disposisi Tiket"
                maxWidth="md"
                showFooter={false}
            >
                <div className="space-y-4 py-2">
                    {showDispatchModal && (
                        <>
                            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                                <span className="text-[10px] font-bold text-slate-400 uppercase block">NO. TIKET</span>
                                <span className="text-sm font-bold text-primary">{showDispatchModal.ticketNumber}</span>
                                <span className="text-xs text-slate-600 block mt-1">{showDispatchModal.subject}</span>
                            </div>

                            <CustomSelect
                                label="Disposisi Ke"
                                value={dispatchData.dispatchTarget}
                                onChange={(val) => setDispatchData(prev => ({ ...prev, dispatchTarget: val }))}
                                options={[
                                    { label: "🔧 Teknisi Lapangan", value: "TEKNISI" },
                                    { label: "🖥️ NOC (Network Operation Center)", value: "NOC" },
                                ]}
                            />

                            <CustomSelect
                                label="Prioritas Disposisi"
                                value={dispatchData.priority}
                                onChange={(val) => setDispatchData(prev => ({ ...prev, priority: val }))}
                                options={[
                                    { label: "Critical", value: "CRITICAL" },
                                    { label: "High", value: "HIGH" },
                                    { label: "Medium", value: "MEDIUM" },
                                    { label: "Low", value: "LOW" },
                                ]}
                            />



                            <CustomTextArea
                                label="Catatan Disposisi"
                                placeholder="Instruksi untuk teknisi..."
                                value={dispatchData.note}
                                onChange={(e) => setDispatchData(prev => ({ ...prev, note: e.target.value }))}
                                rows={3}
                            />

                            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                                <CustomButton variant="ghost" onClick={() => setShowDispatchModal(null)}>Batal</CustomButton>
                                <CustomButton variant="primary" onClick={handleDispatch}>
                                    <Truck size={14} className="mr-2" />
                                    Kirim ke {dispatchData.dispatchTarget}
                                </CustomButton>
                            </div>
                        </>
                    )}
                </div>
            </ModalDetail>

            {/* Resolve Direct Modal */}
            <ModalDetail
                isOpen={!!showResolveModal}
                onClose={() => setShowResolveModal(null)}
                title="Resolve Tiket Langsung"
                maxWidth="sm"
                showFooter={false}
            >
                <div className="space-y-4 py-2">
                    <CustomTextArea
                        label="Catatan Penyelesaian"
                        placeholder="Jelaskan bagaimana tiket diselesaikan..."
                        value={resolveNote}
                        onChange={(e) => setResolveNote(e.target.value)}
                        rows={3}
                    />
                    <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                        <CustomButton variant="ghost" onClick={() => setShowResolveModal(null)}>Batal</CustomButton>
                        <CustomButton variant="primary" onClick={handleResolveDirect} disabled={!resolveNote.trim()}>
                            <CheckCircle size={14} className="mr-2" />
                            Resolve
                        </CustomButton>
                    </div>
                </div>
            </ModalDetail>

            {/* Close Modal */}
            <ModalDetail
                isOpen={!!showCloseModal}
                onClose={() => setShowCloseModal(null)}
                title="Close Tiket"
                maxWidth="sm"
                showFooter={false}
            >
                <div className="space-y-4 py-2">
                    <CustomTextArea
                        label="Catatan Penutupan (Opsional)"
                        placeholder="Catatan penutupan..."
                        value={closeNote}
                        onChange={(e) => setCloseNote(e.target.value)}
                        rows={2}
                    />
                    <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                        <CustomButton variant="ghost" onClick={() => setShowCloseModal(null)}>Batal</CustomButton>
                        <CustomButton variant="primary" onClick={handleClose}>
                            <X size={14} className="mr-2" />
                            Close Tiket
                        </CustomButton>
                    </div>
                </div>
            </ModalDetail>

            <ModalLoading isOpen={showLoading} message="Memproses..." />
            <ModalMessage
                isOpen={showMessage.show}
                onClose={() => setShowMessage(prev => ({ ...prev, show: false }))}
                {...showMessage}
            />
        </div>
    );
};

export default TicketListPage;
