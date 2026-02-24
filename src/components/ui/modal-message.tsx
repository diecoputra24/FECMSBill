import React from "react";
import { createPortal } from "react-dom";
import { CustomButton } from "./custom-button";
import { cn } from "@/lib/utils";

interface ModalMessageProps {
    isOpen: boolean;
    onClose: () => void;
    type: "success" | "error";
    title: string;
    message: string;
}

export const ModalMessage: React.FC<ModalMessageProps> = ({
    isOpen,
    onClose,
    type,
    title,
    message,
}) => {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/40 animate-in fade-in duration-200"
            />
            <div className="relative w-full max-w-[240px] bg-white rounded-md shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
                <div className="p-6 text-center">
                    <h3 className={cn(
                        "text-base font-bold mb-2 uppercase tracking-wide",
                        type === "success" ? "text-green-500" : "text-red-500"
                    )}>
                        {title}
                    </h3>
                    <p className="text-[13px] text-slate-600 mb-6 leading-relaxed">{message}</p>
                    <div className="flex justify-center">
                        <CustomButton
                            type="button"
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "h-8 px-8 text-[10px] font-bold border transition-all",
                                type === "success"
                                    ? "border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300"
                                    : "border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                            )}
                            onClick={onClose}
                        >
                            OK
                        </CustomButton>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
