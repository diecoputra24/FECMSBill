import * as React from "react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { Calendar as CalendarIcon, X } from "lucide-react"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface CustomDateRangePickerProps {
    label?: string;
    startDate?: string;
    endDate?: string;
    onChange: (start: string, end: string) => void;
    placeholder?: string;
    className?: string;
}

export function CustomDateRangePicker({
    label,
    startDate,
    endDate,
    onChange,
    placeholder = "Pilih rentang tanggal",
    className,
}: CustomDateRangePickerProps) {
    const date: DateRange | undefined = React.useMemo(() => {
        return {
            from: startDate ? new Date(startDate) : undefined,
            to: endDate ? new Date(endDate) : undefined,
        }
    }, [startDate, endDate]);

    const handleSelect = (range: DateRange | undefined) => {
        if (range?.from && range?.to) {
            onChange(range.from.toISOString(), range.to.toISOString());
        } else if (range?.from) {
            // If only start date is selected, we can either wait or set end date to empty
            onChange(range.from.toISOString(), "");
        } else {
            onChange("", "");
        }
    };

    const clearRange = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange("", "");
    };

    return (
        <div className="w-full space-y-1.5 text-left">
            {label && (
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-tighter ml-1 block">
                    {label}
                </label>
            )}
            <Popover>
                <PopoverTrigger asChild>
                    <button
                        type="button"
                        className={cn(
                            "flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold ring-offset-background placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/40 transition-all shadow-sm text-left items-center justify-between group",
                            !startDate && "text-slate-300 font-normal",
                            className
                        )}
                    >
                        <div className="flex items-center gap-2 truncate">
                            <CalendarIcon className="h-4 w-4 text-slate-400 shrink-0" />
                            <span className="truncate">
                                {date?.from ? (
                                    date.to ? (
                                        <>
                                            {format(date.from, "dd MMM yyyy", { locale: id })} - {format(date.to, "dd MMM yyyy", { locale: id })}
                                        </>
                                    ) : (
                                        format(date.from, "dd MMM yyyy", { locale: id })
                                    )
                                ) : (
                                    <span>{placeholder}</span>
                                )}
                            </span>
                        </div>
                        {startDate && (
                            <X
                                className="h-3.5 w-3.5 text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                onClick={clearRange}
                            />
                        )}
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0 rounded-xl bg-white shadow-2xl border border-slate-100" align="start">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={handleSelect}
                        numberOfMonths={1}
                        className="rounded-md"
                        classNames={{
                            range_start: "bg-primary text-primary-foreground rounded-none font-bold",
                            range_end: "bg-primary text-primary-foreground rounded-none font-bold",
                            range_middle: "bg-primary text-primary-foreground font-bold rounded-none",
                            day: cn(
                                "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-slate-100 rounded-md transition-all"
                            ),
                            selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                        }}
                    />
                </PopoverContent>
            </Popover>
        </div>
    )
}
