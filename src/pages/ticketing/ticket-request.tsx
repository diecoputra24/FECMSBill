import React, { useState, useEffect, useRef, useCallback } from "react";
import { useCustomerStore } from "@/store/customerStore";
import { useBranchStore } from "@/store/branchStore";
import { useTicketStore } from "@/store/ticketStore";
import { CustomSelect } from "@/components/ui/custom-select";
import { CustomButton } from "@/components/ui/custom-button";
import { CustomTextArea } from "@/components/ui/custom-input";
import { CustomTable } from "@/components/ui/custom-table";
import { Badge } from "@/components/ui/badge";
import {
    Search,
    ChevronDown,
    RefreshCw,
    Loader2,
    Send,
    Upload,
    X,
    ImageIcon,
} from "lucide-react";
import { ModalMessage } from "@/components/ui/modal-message";
import { ModalLoading } from "@/components/ui/modal-loading";
import { ModalConfirm } from "@/components/ui/modal-confirm";
import { cn } from "@/lib/utils";

interface TicketRequestPageProps {
    category: "INCIDENT" | "COMPLAINT";
}

const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 300 * 1024; // 300KB per image

const TicketRequestPage: React.FC<TicketRequestPageProps> = ({ category }) => {
    const { customers, fetchCustomers } = useCustomerStore();
    const { branches, fetchBranches } = useBranchStore();
    const { createTicket, incidentForm, complaintForm, setFormValues, resetForm } = useTicketStore();

    // Determine which form state to use
    const formState = category === 'INCIDENT' ? incidentForm : complaintForm;
    const { subject, description, images, selectedCustomer, searchResults, filterValues } = formState;

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(false);
    const [showMessage, setShowMessage] = useState({ show: false, title: "", message: "", type: "success" as any });
    const [showLoading, setShowLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const searchOptions = [
        { value: "idPelanggan", label: "IdPel" },
        { value: "namaPelanggan", label: "NamaPel" },
        { value: "teleponPelanggan", label: "Telepon" },
    ];

    useEffect(() => {
        fetchCustomers();
        fetchBranches();
    }, []);

    // Helper updates
    const updateForm = (values: any) => setFormValues(category, values);

    // ==================== IMAGE RESIZE ====================
    const resizeImage = useCallback(async (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let { width, height } = img;
                    const maxDim = 1200;
                    if (width > maxDim || height > maxDim) {
                        const ratio = Math.min(maxDim / width, maxDim / height);
                        width = Math.round(width * ratio);
                        height = Math.round(height * ratio);
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) { reject('Canvas context error'); return; }
                    ctx.drawImage(img, 0, 0, width, height);

                    let quality = 0.85;
                    let result = canvas.toDataURL('image/jpeg', quality);
                    while (result.length > MAX_IMAGE_SIZE * 1.37 && quality > 0.1) {
                        quality -= 0.1;
                        result = canvas.toDataURL('image/jpeg', quality);
                    }
                    if (result.length > MAX_IMAGE_SIZE * 1.37) {
                        const scaleFactor = 0.5;
                        canvas.width = Math.round(width * scaleFactor);
                        canvas.height = Math.round(height * scaleFactor);
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        result = canvas.toDataURL('image/jpeg', 0.6);
                    }
                    resolve(result);
                };
                img.onerror = () => reject('Failed to load image');
                img.src = e.target?.result as string;
            };
            reader.onerror = () => reject('Failed to read file');
            reader.readAsDataURL(file);
        });
    }, []);

    const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        if (images.length >= MAX_IMAGES) {
            setShowMessage({ show: true, title: "Batas Foto", message: `Maksimal ${MAX_IMAGES} foto per tiket.`, type: "error" });
            return;
        }

        setIsResizing(true);
        try {
            const newImages: string[] = [];
            for (let i = 0; i < files.length && images.length + newImages.length < MAX_IMAGES; i++) {
                const file = files[i];
                if (!file.type.startsWith('image/')) continue;
                const resized = await resizeImage(file);
                newImages.push(resized);
            }
            updateForm({ images: [...images, ...newImages] });
        } catch (err) {
            setShowMessage({ show: true, title: "Gagal", message: "Gagal memproses gambar. Coba file lain.", type: "error" });
        } finally {
            setIsResizing(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }, [images, resizeImage, category]);

    const removeImage = (index: number) => {
        updateForm({ images: images.filter((_: any, i: number) => i !== index) });
    };

    // ==================== SEARCH ====================
    const handleSearch = () => {
        const results = customers.filter(c => {
            if (filterValues.branchId && filterValues.branchId !== "all") {
                if (c.area?.branchId.toString() !== filterValues.branchId) return false;
            }
            const searchValue = filterValues.searchValue.toLowerCase();
            if (!searchValue) return false;
            if (filterValues.searchType === "idPelanggan") return c.idPelanggan.toLowerCase() === searchValue;
            if (filterValues.searchType === "namaPelanggan") return c.namaPelanggan.toLowerCase().includes(searchValue);
            if (filterValues.searchType === "teleponPelanggan") return c.teleponPelanggan.includes(searchValue);
            return false;
        });

        if (results.length === 1) {
            updateForm({ selectedCustomer: results[0], searchResults: [] });
        } else if (results.length > 1) {
            updateForm({ searchResults: results, selectedCustomer: null });
        } else {
            updateForm({ searchResults: [], selectedCustomer: null });
        }
    };

    const handleSelectFromResults = (customer: typeof customers[0]) => {
        updateForm({ selectedCustomer: customer, searchResults: [] });
    };

    const canSubmit = selectedCustomer && subject.trim() && description.trim();

    const handleSubmit = async () => {
        if (!selectedCustomer || !canSubmit) return;

        setLoading(true);
        setShowLoading(true);
        try {
            const newTicket = await createTicket({
                category,
                customerId: selectedCustomer.id,
                subject,
                description,
                source: "INTERNAL",
            }, images.length > 0 ? JSON.stringify(images) : undefined);

            setShowMessage({
                show: true,
                title: "Tiket Berhasil Dibuat!",
                message: `Tiket ${category === 'INCIDENT' ? 'Incident' : 'Complaint'} #${newTicket.ticketNumber} untuk pelanggan ${selectedCustomer.namaPelanggan} berhasil dibuat.`,
                type: "success"
            });

            // Reset form in store
            resetForm(category);
        } catch (error: any) {
            setShowMessage({
                show: true,
                title: "Gagal",
                message: error.response?.data?.message || error.message,
                type: "error"
            });
        } finally {
            setLoading(false);
            setShowLoading(false);
        }
    };

    const categoryLabel = category === 'INCIDENT' ? 'Incident' : 'Complaint';

    return (
        <div className="space-y-4 pb-20">
            {/* Search Section */}
            <div className="max-w-4xl">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="w-full md:w-64 space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter ml-1">Cabang</label>
                        <CustomSelect
                            placeholder="Pilih Regional"
                            value={filterValues.branchId}
                            options={[
                                { label: "Semua Cabang", value: "all" },
                                ...branches.map(b => ({ label: b.namaBranch, value: b.id.toString() }))
                            ]}
                            onChange={(val) => updateForm({ filterValues: { ...filterValues, branchId: val } })}
                        />
                    </div>

                    <div className="flex-1 w-full space-y-1.5 relative z-20">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter ml-1">Cari Pelanggan</label>
                        <div className="flex gap-0 group relative">
                            <div className="w-[95px] flex-none relative">
                                <button
                                    type="button"
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="w-full h-10 bg-white border border-slate-200 border-r-0 rounded-l-lg px-2 text-[10px] font-black text-slate-600 outline-none hover:bg-slate-50 transition-all flex items-center justify-between"
                                >
                                    {searchOptions.find(o => o.value === filterValues.searchType)?.label}
                                    <ChevronDown size={14} className={cn("transition-transform duration-200", isDropdownOpen ? "rotate-180" : "")} />
                                </button>

                                {isDropdownOpen && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                                        <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 overflow-hidden py-0 animate-in fade-in zoom-in-95 duration-100 flex flex-col">
                                            {searchOptions.map((option) => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => {
                                                        updateForm({ filterValues: { ...filterValues, searchType: option.value } });
                                                        setIsDropdownOpen(false);
                                                    }}
                                                    className={cn(
                                                        "w-full text-left px-3 py-2 text-[11px] font-bold transition-colors",
                                                        filterValues.searchType === option.value ? "bg-primary text-white" : "text-slate-700 hover:bg-slate-50"
                                                    )}
                                                >
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    className="w-full h-10 bg-white border border-slate-200 border-r-0 px-4 text-sm text-slate-700 outline-none focus:ring-1 focus:ring-slate-300 focus:border-slate-300 transition-all placeholder:text-slate-300"
                                    placeholder="Kata Kunci..."
                                    value={filterValues.searchValue}
                                    onChange={(e) => updateForm({ filterValues: { ...filterValues, searchValue: e.target.value } })}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                            </div>
                            <button
                                onClick={handleSearch}
                                className="w-12 h-10 bg-primary text-white rounded-r-lg flex items-center justify-center hover:bg-primary/90 transition-colors shadow-sm"
                            >
                                <Search size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search Results */}
            {searchResults.length > 1 && !selectedCustomer && (
                <div className="bg-white rounded-lg border border-slate-100 overflow-hidden">
                    <div className="bg-amber-50 px-5 py-2 border-b border-amber-100">
                        <h4 className="font-bold text-amber-700 text-[12px] uppercase tracking-wider">
                            Ditemukan {searchResults.length} Pelanggan - Pilih salah satu
                        </h4>
                    </div>
                    <CustomTable
                        data={searchResults}
                        onRowClick={handleSelectFromResults}
                        columns={[
                            { header: "ID PELANGGAN", render: (row) => <span className="font-mono font-bold text-primary">{row.idPelanggan}</span> },
                            { header: "NAMA PELANGGAN", render: (row) => <span className="font-bold">{row.namaPelanggan}</span> },
                            { header: "TELEPON", render: (row) => row.teleponPelanggan || "-" },
                            { header: "CABANG", render: (row) => branches.find(b => b.id === row.area?.branchId)?.namaBranch || "-" },
                            { header: "AREA", render: (row) => row.area?.namaArea || "-" },
                        ]}
                    />
                </div>
            )}

            {/* Ticket Form */}
            {selectedCustomer ? (
                <div className="rounded-lg overflow-hidden bg-white border border-slate-100">
                    {/* Customer Info Header */}
                    <div className="bg-slate-50 px-5 py-1.5 border-b border-slate-100 flex justify-between items-center">
                        <h4 className="font-bold text-slate-700 text-[12px] uppercase tracking-wider">
                            Form Request {categoryLabel}
                        </h4>
                        <div className="flex gap-2">
                            <div onClick={() => fetchCustomers(true)} className="w-6 h-6 rounded-sm bg-primary text-white flex items-center justify-center shadow-sm cursor-pointer hover:bg-primary/90">
                                <RefreshCw size={12} />
                            </div>
                            <Badge variant={selectedCustomer.statusPelanggan === 'AKTIF' ? 'success' : 'destructive'} className="font-bold text-[9px] uppercase h-6 px-2 rounded-sm flex items-center gap-1">
                                <div className="w-1 h-1 bg-white rounded-full animate-pulse" />
                                {selectedCustomer.statusPelanggan}
                            </Badge>
                        </div>
                    </div>

                    <div className="p-6">
                        {/* Customer Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-4 gap-x-8 mb-6">
                            <div>
                                <span className="text-[10px] text-slate-500 uppercase tracking-widest">ID Pelanggan</span>
                                <p className="text-sm font-bold text-primary">{selectedCustomer.idPelanggan}</p>
                            </div>
                            <div>
                                <span className="text-[10px] text-slate-500 uppercase tracking-widest">Nama</span>
                                <p className="text-sm font-bold text-slate-700">{selectedCustomer.namaPelanggan}</p>
                            </div>
                            <div>
                                <span className="text-[10px] text-slate-500 uppercase tracking-widest">Telepon</span>
                                <p className="text-sm text-slate-700">{selectedCustomer.teleponPelanggan}</p>
                            </div>
                            <div>
                                <span className="text-[10px] text-slate-500 uppercase tracking-widest">Alamat</span>
                                <p className="text-sm text-slate-700 truncate" title={selectedCustomer.alamatPelanggan}>{selectedCustomer.alamatPelanggan || "-"}</p>
                            </div>
                        </div>

                        <div className="border-t border-slate-100 pt-6 space-y-5">
                            {/* Subject */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Subjek / Judul Tiket *</label>
                                <input
                                    type="text"
                                    className="w-full h-10 bg-white border border-slate-200 rounded-lg px-4 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    placeholder={category === 'INCIDENT' ? 'Contoh: Internet mati total...' : 'Contoh: Tagihan tidak sesuai...'}
                                    value={subject}
                                    onChange={(e) => updateForm({ subject: e.target.value })}
                                />
                            </div>

                            {/* Description */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Deskripsi Kendala / Alasan *</label>
                                <CustomTextArea
                                    placeholder="Jelaskan kendala, alasan, atau detail permasalahan..."
                                    value={description}
                                    onChange={(e) => updateForm({ description: e.target.value })}
                                    rows={4}
                                />
                            </div>

                            {/* Photo Upload */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                                    Foto Pendukung (Opsional, maks {MAX_IMAGES} foto)
                                </label>

                                {/* Image Preview Grid */}
                                {images.length > 0 && (
                                    <div className="flex gap-3 flex-wrap">
                                        {images.map((img: string, idx: number) => (
                                            <div key={idx} className="relative w-24 h-24 rounded-lg border-2 border-slate-200 overflow-hidden group">
                                                <img src={img} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                                                <button
                                                    onClick={() => removeImage(idx)}
                                                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                                >
                                                    <X size={10} />
                                                </button>
                                                <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-[8px] text-center py-0.5">
                                                    Foto {idx + 1}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Upload Button */}
                                {images.length < MAX_IMAGES && (
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className={cn(
                                            "border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-all",
                                            isResizing
                                                ? "border-primary/50 bg-primary/5"
                                                : "border-slate-200 hover:border-primary/40 hover:bg-primary/5"
                                        )}
                                    >
                                        {isResizing ? (
                                            <>
                                                <Loader2 size={24} className="text-primary animate-spin mb-2" />
                                                <span className="text-xs text-primary font-bold">Memproses gambar...</span>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                                                    <Upload size={18} className="text-slate-400" />
                                                </div>
                                                <span className="text-xs font-semibold text-slate-600">Klik untuk upload foto</span>
                                                <span className="text-[10px] text-slate-400 mt-1">JPG, PNG • Maks {MAX_IMAGES} foto</span>
                                            </>
                                        )}
                                    </div>
                                )}

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    onChange={handleImageUpload}
                                />

                                {images.length > 0 && (
                                    <div className="flex items-center gap-2">
                                        <ImageIcon size={12} className="text-green-600" />
                                        <span className="text-[10px] font-bold text-green-700">{images.length} foto terlampir</span>
                                    </div>
                                )}
                            </div>

                            {/* Submit */}
                            <div className="pt-4 border-t border-slate-100 flex justify-end">
                                <CustomButton
                                    onClick={() => setShowConfirm(true)}
                                    disabled={!canSubmit || loading}
                                    className="h-11 px-6 rounded-lg font-bold shadow-md"
                                >
                                    {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : <Send size={16} className="mr-2" />}
                                    Buat Tiket {categoryLabel}
                                </CustomButton>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="min-h-[400px]" />
            )}

            <ModalLoading isOpen={showLoading} message={`Sedang membuat tiket ${categoryLabel}...`} />

            <ModalMessage
                isOpen={showMessage.show}
                onClose={() => setShowMessage({ ...showMessage, show: false })}
                title={showMessage.title}
                message={showMessage.message}
                type={showMessage.type}
            />

            <ModalConfirm
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={() => {
                    setShowConfirm(false);
                    handleSubmit();
                }}
                title={`Konfirmasi Tiket ${categoryLabel}`}
                message={`Buat tiket ${categoryLabel} untuk pelanggan "${selectedCustomer?.namaPelanggan}"?\n\nSubjek: ${subject}${images.length > 0 ? `\nFoto: ${images.length} terlampir` : ''}`}
                confirmLabel="Ya, Buat Tiket"
                cancelLabel="Batal"
            />
        </div>
    );
};

export default TicketRequestPage;
