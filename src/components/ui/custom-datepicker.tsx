import { useState } from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface CustomDatePickerProps {
    label?: string;
    value?: string;
    onChange: (date: string) => void;
    placeholder?: string;
    className?: string;
    error?: string;
    required?: boolean;
}

export function CustomDatePicker({
    label,
    value,
    onChange,
    placeholder = "Pilih tanggal",
    className,
    error,
    required
}: CustomDatePickerProps) {
    const [open, setOpen] = useState(false);
    const dateValue = value ? new Date(value) : undefined;

    return (
        <div className="w-full space-y-1.5">
            {label && (
                <label className="text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <button
                        type="button"
                        className={cn(
                            "flex h-10 w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold ring-offset-background placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-sm text-left items-center justify-between",
                            !dateValue && "text-slate-400 font-normal",
                            error ? "border-red-500 ring-red-100" : "border-slate-200",
                            className
                        )}
                    >
                        <span className="truncate">
                            {dateValue ? format(dateValue, "dd/MM/yyyy") : placeholder}
                        </span>
                        <CalendarIcon className="h-4 w-4 text-slate-400 shrink-0 ml-2" />
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-[320px] p-0 rounded-xl bg-white shadow-2xl border border-slate-100" align="start">
                    <Calendar
                        mode="single"
                        selected={dateValue}
                        onSelect={(date: Date | undefined) => {
                            if (date) {
                                onChange(date.toISOString());
                                setOpen(false); // Close the popover after selection
                            }
                        }}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>
            {error && <p className="text-[11px] font-medium text-red-500 ml-1">{error}</p>}
        </div>
    )
}
