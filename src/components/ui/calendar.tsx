import * as React from "react"
import {
    ChevronDownIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
} from "lucide-react"
import { DayButton, DayPicker, getDefaultClassNames } from "react-day-picker"
import { id } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"

function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    captionLayout = "label",
    buttonVariant = "ghost",
    formatters,
    components,
    ...props
}: React.ComponentProps<typeof DayPicker> & {
    buttonVariant?: React.ComponentProps<typeof Button>["variant"]
}) {
    const defaultClassNames = getDefaultClassNames()

    return (
        <DayPicker
            locale={id}
            showOutsideDays={showOutsideDays}
            className={cn(
                "bg-background group/calendar p-2 [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent w-full",
                String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
                String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
                className
            )}
            captionLayout={captionLayout}
            formatters={{
                formatMonthDropdown: (date: Date) =>
                    date.toLocaleString("id-ID", { month: "short" }),
                ...formatters,
            }}
            classNames={{
                root: cn("w-full", defaultClassNames.root),
                months: cn(
                    "relative flex flex-col gap-3 w-full",
                    defaultClassNames.months
                ),
                month: cn("flex w-full flex-col gap-3", defaultClassNames.month),
                nav: cn(
                    "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1",
                    defaultClassNames.nav
                ),
                button_previous: cn(
                    buttonVariants({ variant: buttonVariant }),
                    "h-7 w-7 select-none p-0 aria-disabled:opacity-50",
                    defaultClassNames.button_previous
                ),
                button_next: cn(
                    buttonVariants({ variant: buttonVariant }),
                    "h-7 w-7 select-none p-0 aria-disabled:opacity-50",
                    defaultClassNames.button_next
                ),
                month_caption: cn(
                    "flex h-7 w-full items-center justify-center px-8",
                    defaultClassNames.month_caption
                ),
                dropdowns: cn(
                    "flex h-7 w-full items-center justify-center gap-1.5 text-sm font-medium",
                    defaultClassNames.dropdowns
                ),
                dropdown_root: cn(
                    "has-focus:border-ring border-input shadow-xs has-focus:ring-ring/50 has-focus:ring-[3px] relative rounded-md border",
                    defaultClassNames.dropdown_root
                ),
                dropdown: cn(
                    "bg-popover absolute inset-0 opacity-0",
                    defaultClassNames.dropdown
                ),
                caption_label: cn(
                    "select-none font-bold text-[13px] text-slate-900 capitalize",
                    captionLayout === "label"
                        ? ""
                        : "[&>svg]:text-muted-foreground flex h-7 items-center gap-1 rounded-md pl-2 pr-1 text-sm [&>svg]:size-3.5",
                    defaultClassNames.caption_label
                ),
                table: "w-full border-collapse",
                weekdays: cn("flex w-full justify-between", defaultClassNames.weekdays),
                weekday: cn(
                    "text-slate-400 flex-1 select-none rounded-md text-[10px] font-bold uppercase text-center",
                    defaultClassNames.weekday
                ),
                week: cn("mt-1 flex w-full", defaultClassNames.week),
                week_number_header: cn(
                    "w-7 select-none",
                    defaultClassNames.week_number_header
                ),
                week_number: cn(
                    "text-muted-foreground select-none text-[0.75rem]",
                    defaultClassNames.week_number
                ),
                day: cn(
                    "group/day relative flex-1 aspect-square select-none p-0 text-center",
                    defaultClassNames.day
                ),
                range_start: cn(
                    "bg-primary text-primary-foreground rounded-none",
                    defaultClassNames.range_start
                ),
                range_middle: cn("bg-primary text-primary-foreground rounded-none", defaultClassNames.range_middle),
                range_end: cn("bg-primary text-primary-foreground rounded-none", defaultClassNames.range_end),
                today: cn(
                    "bg-slate-100 text-slate-900 rounded-md data-[selected=true]:rounded-none",
                    defaultClassNames.today
                ),
                outside: cn(
                    "text-slate-400 opacity-50 aria-selected:text-slate-400",
                    defaultClassNames.outside
                ),
                disabled: cn(
                    "text-slate-200 opacity-50",
                    defaultClassNames.disabled
                ),
                hidden: cn("invisible", defaultClassNames.hidden),
                ...classNames,
            }}
            components={{
                Root: ({ className, rootRef, ...props }) => {
                    return (
                        <div
                            data-slot="calendar"
                            ref={rootRef}
                            className={cn(className)}
                            {...props}
                        />
                    )
                },
                Chevron: ({ className, orientation, ...props }) => {
                    if (orientation === "left") {
                        return (
                            <ChevronLeftIcon className={cn("size-3.5", className)} {...props} />
                        )
                    }

                    if (orientation === "right") {
                        return (
                            <ChevronRightIcon
                                className={cn("size-3.5", className)}
                                {...props}
                            />
                        )
                    }

                    return (
                        <ChevronDownIcon className={cn("size-3.5", className)} {...props} />
                    )
                },
                DayButton: CalendarDayButton,
                WeekNumber: ({ children, ...props }) => {
                    return (
                        <td {...props}>
                            <div className="flex size-7 items-center justify-center text-center">
                                {children}
                            </div>
                        </td>
                    )
                },
                ...components,
            }}
            {...props}
        />
    )
}

function CalendarDayButton({
    className,
    day,
    modifiers,
    ...props
}: React.ComponentProps<typeof DayButton>) {
    const defaultClassNames = getDefaultClassNames()

    const ref = React.useRef<HTMLButtonElement>(null)
    React.useEffect(() => {
        if (modifiers.focused) ref.current?.focus()
    }, [modifiers.focused])

    return (
        <Button
            ref={ref}
            variant="ghost"
            size="icon"
            data-day={day.date.toLocaleDateString()}
            data-selected-single={
                modifiers.selected &&
                !modifiers.range_start &&
                !modifiers.range_end &&
                !modifiers.range_middle
            }
            data-day-button=""
            data-range-start={modifiers.range_start}
            data-range-end={modifiers.range_end}
            data-range-middle={modifiers.range_middle}
            className={cn(
                "data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-primary data-[range-middle=true]:text-primary-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 flex aspect-square h-auto w-full min-w-7 flex-col gap-1 font-normal leading-none data-[range-end=true]:rounded-none data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-none group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] [&>span]:text-xs [&>span]:opacity-70",
                defaultClassNames.day,
                className
            )}
            {...props}
        />
    )
}

export { Calendar, CalendarDayButton }
