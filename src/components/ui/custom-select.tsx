import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Option {
    label: string;
    value: string;
}

interface CustomSelectProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    label?: string;
    required?: boolean;
    loading?: boolean;
    error?: boolean;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
    options,
    value,
    onChange,
    placeholder = "Pilih...",
    className,
    disabled = false,
    label,
    required = false,
    loading = false,
    error = false,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const selectedOption = options.find((opt) => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (val: string) => {
        onChange(val);
        setIsOpen(false);
    };

    return (
        <div className="w-full space-y-1.5 transition-all duration-300">
            {label && (
                <label className="text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider block">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <div ref={containerRef} className={cn("relative w-full h-10", className)}>
                <div
                    onClick={() => !disabled && !loading && !error && setIsOpen(!isOpen)}
                    className={cn(
                        "flex items-center justify-between w-full h-full px-4 bg-white border border-slate-200 rounded-lg cursor-pointer transition-all duration-200 relative overflow-hidden",
                        isOpen ? "ring-1 ring-slate-200 border-slate-300" : "hover:border-slate-300",
                        (disabled || loading || error) && "opacity-50 cursor-not-allowed bg-slate-50",
                        error && "border-red-200"
                    )}
                >
                    <span className={cn(
                        "text-xs font-bold truncate uppercase tracking-tight",
                        error ? "text-red-500" : selectedOption ? "text-slate-700" : "text-slate-400 font-normal"
                    )}>
                        {error ? "SERVER NO RESPONSE" : selectedOption ? selectedOption.label : placeholder}
                    </span>
                    <ChevronDown className={cn(
                        "h-3.5 w-3.5 text-slate-400 transition-transform duration-200",
                        isOpen && "rotate-180"
                    )} />

                    {/* Material Loading Bar INSIDE the border for perfect clipping */}
                    {loading && (
                        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary pointer-events-none z-10 overflow-hidden">
                            <div className="bg-white animate-progress-material-1 h-full" />
                            <div className="bg-white animate-progress-material-2 h-full" />
                        </div>
                    )}
                </div>

                {isOpen && (
                    <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-md z-[250] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                        <div className="max-h-60 overflow-y-auto py-1">
                            {options.length > 0 ? (
                                options.map((opt) => (
                                    <div
                                        key={opt.value}
                                        onClick={() => handleSelect(opt.value)}
                                        className={cn(
                                            "flex items-center px-4 py-2 text-xs font-bold cursor-pointer transition-all uppercase tracking-tight",
                                            value === opt.value
                                                ? "bg-primary text-white"
                                                : "text-slate-600 hover:bg-slate-50"
                                        )}
                                    >
                                        <span className="truncate">{opt.label}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="px-4 py-2 text-[11px] text-slate-400 italic font-medium">Tidak ada pilihan</div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};


