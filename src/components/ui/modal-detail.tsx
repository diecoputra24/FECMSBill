import React from "react";
import { createPortal } from "react-dom";
import { CustomButton } from "./custom-button";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface DetailItem {
    label: string;
    value: string | React.ReactNode;
    fullWidth?: boolean;
}

interface DetailSection {
    title?: string;
    items: DetailItem[];
}

interface ModalDetailProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    icon?: LucideIcon;
    items?: DetailItem[];
    sections?: DetailSection[]; // New support for grouped sections
    onConfirm?: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
    loading?: boolean;
    maxWidth?: "sm" | "md" | "lg" | "full";
    variant?: "primary" | "danger" | "success" | "warning";
    children?: React.ReactNode;
}

export const ModalDetail: React.FC<ModalDetailProps> = ({
    isOpen,
    onClose,
    title,
    items,
    sections,
    onConfirm,
    confirmLabel = "Konfirmasi",
    cancelLabel = "Kembali",
    loading = false,
    maxWidth = "md",
    variant = "primary",
    children,
}) => {
    if (!isOpen) return null;

    const maxWidthClass = {
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-lg",
        full: "max-w-[calc(100vw-32px)] flex flex-col",
    }[maxWidth];

    const variantColors = {
        primary: {
            iconBg: "bg-primary/10",
            iconText: "text-primary",
            cancelBorder: "border-slate-200 text-slate-600 hover:bg-slate-50",
        },
        danger: {
            iconBg: "bg-red-50",
            iconText: "text-red-500",
            cancelBorder: "border-slate-200 text-slate-600 hover:bg-slate-50",
        },
        success: {
            iconBg: "bg-green-50",
            iconText: "text-green-500",
            cancelBorder: "border-slate-200 text-slate-600 hover:bg-slate-50",
        },
        warning: {
            iconBg: "bg-amber-50",
            iconText: "text-amber-500",
            cancelBorder: "border-slate-200 text-slate-600 hover:bg-slate-50",
        },
    }[variant];

    // Normalize to sections
    const displaySections: DetailSection[] = sections || (items ? [{ items }] : []);

    return createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" />

            <div className={cn(
                "relative w-full bg-white rounded-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 flex flex-col max-h-[90vh]",
                maxWidthClass
            )}>
                {/* Header */}
                <div className="px-6 py-4 bg-white shrink-0">
                    <h3 className="text-lg font-bold text-slate-800 tracking-tight">{title}</h3>
                </div>

                {/* Content */}
                <div className={cn(
                    "p-6 space-y-8 overflow-y-auto bg-white",
                    maxWidth === "full" && "flex-1"
                )}>
                    {children}
                    {!children && displaySections.map((section, secIndex) => (
                        <div key={secIndex} className="rounded-md border border-slate-200 overflow-hidden">
                            {section.title && (
                                <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
                                    <h4 className="font-bold text-slate-700 text-sm tracking-tight">
                                        {section.title}
                                    </h4>
                                </div>
                            )}
                            <div className={cn(
                                "p-4 bg-white grid gap-6",
                                maxWidth === "full"
                                    ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                                    : "grid-cols-1 md:grid-cols-2"
                            )}>
                                {section.items.map((item, index) => (
                                    <div
                                        key={index}
                                        className={cn(
                                            "flex flex-col gap-1",
                                            item.fullWidth && "col-span-full"
                                        )}
                                    >
                                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                            {item.label}
                                        </span>
                                        <div className="text-sm font-medium text-slate-800 break-words leading-snug">
                                            {item.value || <span className="text-slate-300 italic font-normal text-xs">Tidak tersedia</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {displaySections.length === 0 && !children && (
                        <div className="text-center py-10 text-slate-400 italic">Data tidak tersedia</div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-slate-100 bg-white flex justify-end gap-2 shrink-0">
                    {cancelLabel && (
                        <CustomButton
                            type="button"
                            variant="outline"
                            className={cn("h-8 px-8 font-bold text-[10px]", variantColors.cancelBorder)}
                            onClick={onClose}
                            disabled={loading}
                            size="sm"
                        >
                            {cancelLabel}
                        </CustomButton>
                    )}
                    {confirmLabel && onConfirm && (
                        <CustomButton
                            type="button"
                            variant={variant === "danger" ? "danger" : "primary"}
                            className="h-8 px-8 font-bold shadow-sm text-[10px]"
                            disabled={loading}
                            onClick={onConfirm}
                            size="sm"
                        >
                            {loading ? "Memproses..." : confirmLabel}
                        </CustomButton>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};
