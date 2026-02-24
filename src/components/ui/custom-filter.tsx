import React from "react";
import { createPortal } from "react-dom";
import { Search, Printer, X, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { CustomButton } from "./custom-button";
import { CustomSelect } from "./custom-select";
import { CustomDatePicker } from "./custom-datepicker";
import { CustomDateRangePicker } from "./custom-daterange-picker";

export interface FilterItem {
    label: string;
    placeholder: string;
    value: string; // Used for text or startDate
    endDate?: string; // Used for daterange
    type?: "select" | "text" | "custom" | "date" | "daterange";
    options?: { label: string; value: string }[];
    onChange: (value: string) => void;
    onEndDateChange?: (value: string) => void;
    render?: () => React.ReactNode;
    disabled?: boolean;
    loading?: boolean;
    error?: boolean;
}

interface CustomFilterProps {
    title?: string;
    filters: FilterItem[];
    onSearch: () => void;
    onPrint?: () => void;
    onReset?: () => void;
    className?: string;
    children?: React.ReactNode;
    loading?: boolean;
}

export const CustomFilter: React.FC<CustomFilterProps> = ({
    title,
    filters,
    onSearch,
    onPrint,
    onReset,
    className,
    children,
    loading = false
}) => {
    const [isExpanded, setIsExpanded] = React.useState(true);
    const [isFullyOpen, setIsFullyOpen] = React.useState(true);
    const [portalTarget, setPortalTarget] = React.useState<HTMLElement | null>(null);

    React.useEffect(() => {
        setPortalTarget(document.getElementById('page-header-actions'));
    }, []);

    // Sync isFullyOpen with isExpanded with a delay for animations
    React.useEffect(() => {
        if (isExpanded) {
            const timer = setTimeout(() => setIsFullyOpen(true), 300);
            return () => clearTimeout(timer);
        } else {
            setIsFullyOpen(false);
        }
    }, [isExpanded]);

    // Support all filters passed
    const displayFilters = filters;

    const toggleButton = (
        <div
            className="flex items-center gap-2 text-primary transition-all hover:opacity-80 cursor-pointer select-none"
            onClick={() => setIsExpanded(!isExpanded)}
        >
            <Filter size={16} strokeWidth={2.5} />
            <span className="font-bold text-[10px] uppercase tracking-wider">Filter</span>
        </div>
    );

    return (
        <div className={cn("w-full mb-6 border-b border-slate-100 pb-2 relative", className)}>
            {/* 1. Portal the Toggle to the Layout Header Actions area */}
            {portalTarget && createPortal(toggleButton, portalTarget)}

            {title && (
                <div className="flex items-center mb-1">
                    <h2 className="text-lg font-bold text-slate-700">{title}</h2>
                </div>
            )}

            <div
                className={cn(
                    "grid transition-all duration-300 ease-in-out",
                    isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 pointer-events-none"
                )}
            >
                <div className={cn(
                    "transition-all duration-300",
                    isFullyOpen ? "overflow-visible" : "overflow-hidden"
                )}>
                    <div className="flex flex-col md:flex-row items-start gap-8 pt-4">
                        {/* Left Side: Filters & Children */}
                        <div className="flex-1 w-full md:w-[70%] max-w-4xl space-y-4">
                            {/* Primary Filters Grid */}
                            <div className={cn(
                                "grid grid-cols-1 md:grid-cols-2 gap-4",
                                displayFilters.length >= 3 && "lg:grid-cols-3"
                            )}>
                                {displayFilters.map((filter, index) => (
                                    <div key={index} className="w-full space-y-1">
                                        <label className="text-[11px] font-bold text-slate-600 uppercase tracking-tighter ml-1 block">
                                            {filter.label}
                                        </label>
                                        <div className="relative group">
                                            {filter.type === "custom" && filter.render ? (
                                                filter.render()
                                            ) : filter.type === "date" ? (
                                                <CustomDatePicker
                                                    value={filter.value}
                                                    onChange={filter.onChange}
                                                    placeholder={filter.placeholder}
                                                    className="h-10"
                                                />
                                            ) : filter.type === "daterange" ? (
                                                <CustomDateRangePicker
                                                    startDate={filter.value}
                                                    endDate={filter.endDate}
                                                    onChange={(start, end) => {
                                                        filter.onChange(start);
                                                        if (filter.onEndDateChange) filter.onEndDateChange(end);
                                                    }}
                                                    placeholder={filter.placeholder}
                                                    className="h-10"
                                                />
                                            ) : filter.type === "select" ? (
                                                <CustomSelect
                                                    options={filter.options || []}
                                                    value={filter.value}
                                                    onChange={filter.onChange}
                                                    placeholder={filter.placeholder}
                                                    className="h-10"
                                                    disabled={filter.disabled}
                                                    loading={filter.loading}
                                                    error={filter.error}
                                                />
                                            ) : (
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={filter.value}
                                                        onChange={(e) => filter.onChange(e.target.value)}
                                                        placeholder={filter.placeholder}
                                                        disabled={filter.disabled}
                                                        className={cn(
                                                            "w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/40 transition-all placeholder:text-slate-300 placeholder:font-normal",
                                                            filter.disabled && "opacity-50 cursor-not-allowed bg-slate-50"
                                                        )}
                                                    />
                                                    {filter.loading && (
                                                        <div className="absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden bg-primary pointer-events-none">
                                                            <div className="bg-white animate-progress-material-1" />
                                                            <div className="bg-white animate-progress-material-2" />
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Secondary Filters (Children) */}
                            {children && (
                                <div className="w-full">
                                    {children}
                                </div>
                            )}
                        </div>

                        {/* Right Side: Buttons */}
                        <div className="flex gap-3 pt-[22px]">
                            <CustomButton
                                onClick={onSearch}
                                size="icon"
                                className="h-10 w-16 bg-primary hover:opacity-90 border-primary/10"
                                title="Cari"
                                disabled={loading}
                            >
                                <Search size={18} strokeWidth={2.5} />
                            </CustomButton>
                            {onPrint && (
                                <CustomButton
                                    onClick={onPrint}
                                    size="icon"
                                    className="h-10 w-16 bg-slate-400 hover:bg-slate-500 border-slate-500/10"
                                    title="Print"
                                    disabled={loading}
                                >
                                    <Printer size={18} strokeWidth={2.5} />
                                </CustomButton>
                            )}
                            {onReset && (
                                <CustomButton
                                    onClick={onReset}
                                    size="icon"
                                    className="h-10 w-16 bg-slate-300 hover:bg-slate-400 border-slate-400/10"
                                    title="Reset"
                                    disabled={loading}
                                >
                                    <X size={18} strokeWidth={2.5} />
                                </CustomButton>
                            )}
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};
