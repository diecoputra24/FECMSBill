import React from 'react';
import { createPortal } from 'react-dom';
import { Loader2 } from 'lucide-react';

interface ModalLoadingProps {
    isOpen: boolean;
    message?: string;
}

export const ModalLoading: React.FC<ModalLoadingProps> = ({ isOpen, message = "Memuat..." }) => {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] animate-in fade-in duration-300" />

            {/* Modal Content */}
            <div className="relative bg-white rounded-xl shadow-2xl p-8 flex flex-col items-center gap-4 animate-in zoom-in-95 duration-300 min-w-[200px]">
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                    <Loader2 size={48} className="text-primary animate-spin relative z-10" />
                </div>
                <p className="text-slate-600 font-medium text-sm animate-pulse">{message}</p>
            </div>
        </div>,
        document.body
    );
};
