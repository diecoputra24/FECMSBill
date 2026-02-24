import React from "react";
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { CustomSelect } from "./custom-select";
import { CustomButton } from "./custom-button";
import { ChevronLeft, ChevronRight, ArrowUp, ArrowDown } from "lucide-react";

interface Column<T> {
    header: string;
    className?: string;
    render: (item: T, index: number) => React.ReactNode;
    sortKey?: string;
    sortable?: boolean;
}

interface CustomTableProps<T> {
    columns: Column<T>[];
    data: T[];
    loading?: boolean;
    loadingMessage?: string;
    emptyMessage?: string;
    error?: boolean;
    errorMessage?: string;
    className?: string;
    // Pagination props
    pagination?: {
        currentPage: number;
        pageSize: number;
        totalItems: number;
        onPageChange: (page: number) => void;
        onPageSizeChange: (size: number) => void;
    };
    sorting?: {
        sortKey: string;
        sortOrder: "asc" | "desc";
        onSort: (key: string) => void;
    };
    onRowClick?: (item: T) => void;
    // Selection props
    enableSelection?: boolean;
    selectedId?: string | number | null;
    selectedIds?: (string | number)[];
    onSelectionChange?: (id: string | number | null) => void;
    onMultiSelectionChange?: (ids: (string | number)[]) => void;
    actionButtons?: React.ReactNode;
}

export function CustomTable<T>({
    columns,
    data,
    loading = false,
    loadingMessage = "Memuat data...",
    emptyMessage = "Belum ada data.",
    error = false,
    errorMessage = "Gagal memuat data dari server.",
    className,
    pagination,
    sorting,
    onRowClick,
    enableSelection = false,
    selectedId,
    selectedIds,
    onSelectionChange,
    onMultiSelectionChange,
    actionButtons
}: CustomTableProps<T>) {
    const totalPages = pagination ? Math.ceil(pagination.totalItems / pagination.pageSize) : 0;
    const startItem = pagination ? (pagination.currentPage - 1) * pagination.pageSize + 1 : 0;
    const endItem = pagination ? Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems) : 0;

    const selectionColumn: Column<T> = {
        header: "SELECT_ALL",
        className: "w-[40px] pl-4 text-center py-0",
        render: (item) => {
            const itemId = (item as any).id || (item as any)['.id'] || (item as any).uuid;
            const isSelected = selectedIds
                ? selectedIds.includes(itemId)
                : selectedId !== null && selectedId !== undefined && String(selectedId) === String(itemId);

            const handleChange = () => {
                if (selectedIds && onMultiSelectionChange) {
                    if (isSelected) {
                        onMultiSelectionChange(selectedIds.filter(id => id !== itemId));
                    } else {
                        onMultiSelectionChange([...selectedIds, itemId]);
                    }
                } else {
                    onSelectionChange?.(isSelected ? null : itemId);
                }
            };

            return (
                <div className="flex justify-center items-center h-full w-full">
                    <input
                        type="checkbox"
                        className="h-4 w-4 rounded-[4px] border-slate-400 text-primary focus:ring-primary accent-primary cursor-pointer transition-all hover:border-primary"
                        checked={isSelected}
                        onChange={handleChange}
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            );
        }
    };

    const tableColumns = enableSelection ? [selectionColumn, ...columns] : columns;

    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between px-1 h-8">
                <div className="text-[13px] font-bold text-primary tracking-tight flex items-center gap-1">
                    {pagination?.totalItems || data.length} Results
                </div>
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-200">
                    {actionButtons}
                </div>
            </div>

            <div className={cn("w-full overflow-x-auto rounded-lg border border-slate-200 table-thin-scroll", className)}>
                <Table>
                    <TableHeader className="bg-slate-100">
                        <TableRow className="bg-slate-100/80 hover:bg-slate-100/80">
                            {tableColumns.map((column, index) => (
                                <TableHead
                                    key={index}
                                    className={cn(
                                        "py-1.5 h-auto text-slate-600 font-extrabold text-[13px] uppercase tracking-wider transition-colors whitespace-nowrap",
                                        column.sortable && "cursor-pointer hover:bg-slate-200/50 select-none",
                                        index === 0 && "pl-4", // Always pl-4 for first column (checkbox or regular)
                                        !enableSelection && index === 0 && "pl-8", // Extra padding if strictly first regular col
                                        enableSelection && index === 0 && "pl-6", // Specific padding for checkbox
                                        index === tableColumns.length - 1 && "pr-8 text-right",
                                        column.className
                                    )}
                                    onClick={() => column.sortable && sorting?.onSort(column.sortKey || "")}
                                >
                                    <div className={cn(
                                        "flex items-center justify-between gap-2 w-full",
                                        index === tableColumns.length - 1 && "justify-end",
                                        index === 0 && "justify-center"
                                    )}>
                                        {column.header === "SELECT_ALL" ? (
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded-[4px] border-slate-400 text-primary focus:ring-primary accent-primary cursor-pointer transition-all hover:border-primary bg-white"
                                                checked={data.length > 0 && selectedIds?.length === data.length}
                                                onChange={(e) => {
                                                    if (onMultiSelectionChange) {
                                                        if (e.target.checked) {
                                                            const allIds = data.map((item: any) => item.id || item['.id'] || item.uuid);
                                                            onMultiSelectionChange(allIds);
                                                        } else {
                                                            onMultiSelectionChange([]);
                                                        }
                                                    }
                                                }}
                                            />
                                        ) : (
                                            <span>{column.header}</span>
                                        )}
                                        {column.sortable && (
                                            <div className="flex flex-col -space-y-1 opacity-30 group-hover:opacity-100 transition-opacity shrink-0">
                                                <ArrowUp
                                                    size={10}
                                                    strokeWidth={4}
                                                    className={cn(
                                                        sorting?.sortKey === column.sortKey && sorting?.sortOrder === "asc"
                                                            ? "text-primary opacity-100"
                                                            : "text-slate-400"
                                                    )}
                                                />
                                                <ArrowDown
                                                    size={10}
                                                    strokeWidth={4}
                                                    className={cn(
                                                        sorting?.sortKey === column.sortKey && sorting?.sortOrder === "desc"
                                                            ? "text-primary opacity-100"
                                                            : "text-slate-400"
                                                    )}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && data.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={tableColumns.length}
                                    className="h-40 text-center text-slate-400 font-medium"
                                >
                                    <div className="flex flex-col items-center justify-center w-full px-20 gap-3">
                                        <div className="w-full max-w-md h-[5px] bg-primary/10 rounded-full overflow-hidden relative">
                                            <div className="bg-primary animate-progress-material-1" />
                                            <div className="bg-primary animate-progress-material-2" />
                                        </div>
                                        <span className="text-xs text-slate-400 animate-pulse">{loadingMessage}</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : error ? (
                            <TableRow>
                                <TableCell
                                    colSpan={tableColumns.length}
                                    className="h-40 text-center text-red-500 font-medium"
                                >
                                    {errorMessage}
                                </TableCell>
                            </TableRow>
                        ) : data.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={tableColumns.length}
                                    className="h-40 text-center text-slate-400 font-medium"
                                >
                                    {emptyMessage}
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((item, rowIndex) => (
                                <TableRow
                                    key={rowIndex}
                                    className={cn(
                                        "border-b border-slate-200 hover:bg-slate-50/50 transition-colors last:border-0",
                                        onRowClick && "cursor-pointer hover:bg-slate-100"
                                    )}
                                    onClick={() => onRowClick && onRowClick(item)}
                                >
                                    {tableColumns.map((column, colIndex) => (
                                        <TableCell
                                            key={colIndex}
                                            className={cn(
                                                "py-1.5 text-slate-600 font-semibold text-[13px] whitespace-nowrap",
                                                colIndex === 0 && "pl-4", // Base padding
                                                !enableSelection && colIndex === 0 && "pl-8", // Extra padding if no selection
                                                enableSelection && colIndex === 0 && "pl-6", // Checkbox padding
                                                colIndex === tableColumns.length - 1 && "pr-8 text-right",
                                                column.className
                                            )}
                                        >
                                            {column.render(item, rowIndex)}
                                        </TableCell>
                                    ))
                                    }
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination UI */}
            {
                pagination && pagination.totalItems > 0 && (
                    <div className="flex flex-col md:flex-row items-center justify-between px-2 gap-4">
                        <div className="flex items-center gap-2 order-2 md:order-1">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tampilkan</span>
                                <div className="w-16">
                                    <CustomSelect
                                        value={pagination.pageSize.toString()}
                                        onChange={(val) => pagination.onPageSizeChange(parseInt(val))}
                                        options={[
                                            { label: "10", value: "10" },
                                            { label: "25", value: "25" },
                                            { label: "50", value: "50" },
                                            { label: "100", value: "100" },
                                        ]}
                                        className="h-7 shadow-none"
                                    />
                                </div>
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100/50 px-3 py-1.5 rounded-lg border border-slate-100">
                                Menampilkan <span className="text-slate-800">{startItem}-{endItem}</span> dari <span className="text-slate-800">{pagination.totalItems}</span> data
                            </span>
                        </div>

                        <div className="flex items-center gap-1.5 order-1 md:order-2 bg-slate-100/30 p-1 rounded-xl border border-slate-100">
                            <CustomButton
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-lg"
                                disabled={pagination.currentPage === 1}
                                onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                            >
                                <ChevronLeft size={16} />
                            </CustomButton>

                            <div className="flex items-center px-4">
                                <span className="text-xs font-bold text-slate-700">
                                    Halaman <span className="text-primary">{pagination.currentPage}</span> dari {totalPages}
                                </span>
                            </div>

                            <CustomButton
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-lg"
                                disabled={pagination.currentPage === totalPages}
                                onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                            >
                                <ChevronRight size={16} />
                            </CustomButton>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
