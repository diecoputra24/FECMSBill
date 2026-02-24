import React from "react";
import { createPortal } from "react-dom";
import { CustomButton } from "./custom-button";
import { cn } from "@/lib/utils";
import clsx from "clsx";

interface ModalConfirmProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: React.ReactNode;
    message: React.ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    loading?: boolean;
    variant?: "danger" | "primary";
}

export const ModalConfirm: React.FC<ModalConfirmProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = "OK",
    cancelLabel = "Batal",
    loading = false,
    variant = "primary",
}) => {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/40 animate-in fade-in duration-200"
            />
            <div className="relative w-full max-w-[400px] bg-white rounded-md shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
                <div className="p-6 text-center">
                    <h3 className={clsx(
                        "text-sm font-bold mb-2 uppercase tracking-wide",
                        variant === "danger" ? "text-red-500" : "text-primary"
                    )}>
                        {title}
                    </h3>
                    <div className="text-xs text-slate-600 mb-6">{message}</div>
                    <div className="flex justify-center gap-2">
                        <CustomButton
                            type="button"
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "h-8 px-8 text-[10px] font-bold border transition-all",
                                variant === "danger"
                                    ? "border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                                    : "border-primary/20 text-primary hover:bg-primary/5 hover:border-primary/40"
                            )}
                            onClick={onClose}
                            disabled={loading}
                        >
                            {cancelLabel}
                        </CustomButton>
                        <CustomButton
                            type="button"
                            variant={variant === "danger" ? "danger" : "primary"}
                            size="sm"
                            className="h-8 px-8 text-[10px] font-bold shadow-sm"
                            onClick={onConfirm}
                            disabled={loading}
                        >
                            {loading ? "..." : confirmLabel}
                        </CustomButton>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
