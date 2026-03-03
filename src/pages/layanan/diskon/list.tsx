import React, { useEffect, useMemo } from "react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { useCustomerStore } from "@/store/customerStore";
import { useBranchStore } from "@/store/branchStore";
import { useAreaStore } from "@/store/areaStore";
import { CustomFilter } from "@/components/ui/custom-filter";
import { CustomTable } from "@/components/ui/custom-table";
import type { Customer } from "@/types/customer";

const DiscountListPage: React.FC = () => {
    const {
        customers,
        loading: customerLoading,
        fetchCustomers,
    } = useCustomerStore();

    const { branches, fetchBranches, loading: branchLoading } = useBranchStore();
    const { areas, fetchAreas } = useAreaStore();

    const [filterValues, setFilterValues] = React.useState({ search: "", branchId: "", areaId: "" });
    const [appliedFilters, setAppliedFilters] = React.useState({ search: "", branchId: "", areaId: "" });
    const [pagination, setPagination] = React.useState({ currentPage: 1, pageSize: 10 });
    const [sortConfig, setSortConfig] = React.useState<{ key: string; order: "asc" | "desc" }>({ key: "idPelanggan", order: "asc" });

    useEffect(() => {
        fetchCustomers();
        fetchBranches();
        fetchAreas();
    }, []);

    const handleSearch = () => {
        setAppliedFilters({ ...filterValues });
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const handleReset = () => {
        setFilterValues({ search: "", branchId: "", areaId: "" });
        setAppliedFilters({ search: "", branchId: "", areaId: "" });
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const handleExportExcel = async () => {
        if (!sortedCustomers.length) {
            alert('Tidak ada data untuk diexport.');
            return;
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Data Diskon Pelanggan');

        const rows = sortedCustomers.map((row, index) => {
            const branch = branches.find(b => b.id === row.area?.branchId);
            return [
                index + 1,
                row.idPelanggan,
                row.namaPelanggan,
                row.teleponPelanggan || "-",
                row.area?.namaArea || "-",
                branch?.namaBranch || "-",
                row.diskon || 0
            ];
        });

        worksheet.addTable({
            name: 'DiscountTable',
            ref: 'A1',
            headerRow: true,
            totalsRow: false,
            style: {
                theme: 'TableStyleMedium2',
                showRowStripes: true,
            },
            columns: [
                { name: 'No', filterButton: true },
                { name: 'ID Pelanggan', filterButton: true },
                { name: 'Nama Pelanggan', filterButton: true },
                { name: 'Telepon', filterButton: true },
                { name: 'Area', filterButton: true },
                { name: 'Cabang', filterButton: true },
                { name: 'Diskon (Rp)', filterButton: true }
            ],
            rows: rows,
        });

        worksheet.columns.forEach(column => {
            if (column.values) {
                let maxLength = 0;
                column.values.forEach(v => {
                    const columnLength = v ? v.toString().length : 0;
                    if (columnLength > maxLength) {
                        maxLength = columnLength;
                    }
                });
                column.width = maxLength < 10 ? 10 : maxLength + 2;
            }
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const timestamp = new Date().toISOString().replace(/[:T]/g, '-').split('.')[0];
        saveAs(new Blob([buffer]), `Diskon_Pelanggan_${timestamp}.xlsx`);
    };

    const discountedCustomers = useMemo(() => {
        return customers.filter(c => Number(c.diskon) > 0);
    }, [customers]);

    const filteredCustomers = useMemo(() => {
        return discountedCustomers.filter(c => {
            if (appliedFilters.branchId && appliedFilters.branchId !== "all") {
                if (c.area?.branchId?.toString() !== appliedFilters.branchId) return false;
            }
            if (appliedFilters.areaId && appliedFilters.areaId !== "all") {
                if (c.areaId.toString() !== appliedFilters.areaId) return false;
            }

            const searchTerm = appliedFilters.search.toLowerCase();
            return (
                c.namaPelanggan.toLowerCase().includes(searchTerm) ||
                c.idPelanggan.toLowerCase().includes(searchTerm) ||
                c.teleponPelanggan.includes(searchTerm)
            );
        });
    }, [discountedCustomers, appliedFilters]);

    const sortedCustomers = useMemo(() => {
        return [...filteredCustomers].sort((a, b) => {
            const aVal = (a as any)[sortConfig.key] || "";
            const bVal = (b as any)[sortConfig.key] || "";
            const aStr = aVal.toString().toLowerCase();
            const bStr = bVal.toString().toLowerCase();
            if (sortConfig.order === "asc") return aStr.localeCompare(bStr);
            return bStr.localeCompare(aStr);
        });
    }, [filteredCustomers, sortConfig]);

    const paginatedCustomers = sortedCustomers.slice(
        (pagination.currentPage - 1) * pagination.pageSize,
        pagination.currentPage * pagination.pageSize
    );

    const columns = [
        {
            header: "ID Pelanggan",
            sortable: true,
            sortKey: "idPelanggan",
            render: (row: Customer) => <span className="text-sm font-bold text-primary">{row.idPelanggan}</span>
        },
        {
            header: "Nama Pelanggan",
            sortable: true,
            sortKey: "namaPelanggan",
            render: (row: Customer) => <span className="text-sm font-medium">{row.namaPelanggan}</span>
        },
        {
            header: "Telepon",
            render: (row: Customer) => <span className="text-sm">{row.teleponPelanggan || "-"}</span>
        },
        {
            header: "Area",
            render: (row: Customer) => <span className="text-sm">{row.area?.namaArea || "-"}</span>
        },
        {
            header: "Cabang",
            render: (row: Customer) => {
                const branch = branches.find(b => b.id === row.area?.branchId);
                return <span className="text-sm">{branch?.namaBranch || "-"}</span>;
            }
        },
        {
            header: "Besar Diskon",
            sortable: true,
            sortKey: "diskon",
            render: (row: Customer) => <span className="text-sm font-bold text-green-600">Rp {Number(row.diskon || 0).toLocaleString('id-ID')}</span>
        }
    ];

    const filteredAreas = areas.filter(a =>
        filterValues.branchId && filterValues.branchId !== "all"
            ? a.branchId.toString() === filterValues.branchId
            : true
    );

    return (
        <div className="space-y-4 pb-20">
            <CustomFilter
                onSearch={handleSearch}
                onReset={handleReset}
                onPrint={handleExportExcel}
                loading={customerLoading}
                filters={[
                    {
                        label: "Cabang",
                        placeholder: "Semua Cabang",
                        value: filterValues.branchId,
                        type: "select",
                        options: [{ label: "Semua Cabang", value: "all" }, ...branches.map(b => ({ label: b.namaBranch, value: b.id.toString() }))],
                        loading: branchLoading,
                        onChange: (val: string) => setFilterValues(prev => ({ ...prev, branchId: val, areaId: "" }))
                    },
                    {
                        label: "Area",
                        placeholder: filterValues.branchId ? "Semua Area" : "Pilih Cabang dulu",
                        value: filterValues.areaId,
                        type: "select",
                        disabled: !filterValues.branchId,
                        options: [{ label: "Semua Area", value: "all" }, ...filteredAreas.map(a => ({ label: a.namaArea, value: a.id.toString() }))],
                        onChange: (val: string) => setFilterValues(prev => ({ ...prev, areaId: val }))
                    },
                    {
                        label: "Cari",
                        placeholder: "Nama atau ID...",
                        value: filterValues.search,
                        type: "text",
                        onChange: (val: string) => setFilterValues(prev => ({ ...prev, search: val }))
                    }
                ]}
            />

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-1">
                <CustomTable
                    data={paginatedCustomers}
                    columns={columns}
                    loading={customerLoading}
                    emptyMessage="Tidak ada pelanggan dengan diskon aktif."
                    pagination={{
                        ...pagination,
                        totalItems: filteredCustomers.length,
                        onPageChange: (page) => setPagination(prev => ({ ...prev, currentPage: page })),
                        onPageSizeChange: (size) => setPagination({ currentPage: 1, pageSize: size })
                    }}
                    sorting={{
                        sortKey: sortConfig.key,
                        sortOrder: sortConfig.order,
                        onSort: (key) => setSortConfig(prev => ({ key, order: prev.key === key && prev.order === "asc" ? "desc" : "asc" }))
                    }}
                    enableSelection={false}
                />
            </div>
        </div>
    );
};

export default DiscountListPage;
