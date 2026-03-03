import React, { useEffect, useMemo } from "react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { useCustomerStore } from "@/store/customerStore";
import { useBranchStore } from "@/store/branchStore";
import { useAreaStore } from "@/store/areaStore";
import { usePackageStore } from "@/store/packageStore";
import { useAddonStore } from "@/store/addonStore";
import { useTaxStore } from "@/store/taxStore";
import { useOpportunityStore } from "@/store/opportunityStore";
import { CustomFilter } from "@/components/ui/custom-filter";
import { CustomTable } from "@/components/ui/custom-table";
import { CustomSelect } from "@/components/ui/custom-select";
import type { Customer } from "@/types/customer";

const OpportunityListPage: React.FC = () => {
    const {
        customers,
        connections,
        loading: customerLoading,
        fetchCustomers,
        fetchConnections,
    } = useCustomerStore();

    const { branches, fetchBranches, loading: branchLoading } = useBranchStore();
    const { areas, fetchAreas } = useAreaStore();
    const { packages, fetchPackages } = usePackageStore();
    const { fetchAddons } = useAddonStore();
    const { taxes, fetchTaxes } = useTaxStore();

    // Use global store for persistence
    const {
        listFilterValues,
        appliedListFilters,
        setListFilterValues,
        setAppliedListFilters,
        resetListFilters
    } = useOpportunityStore();

    // Local pagination state (usually kept local)
    const [pagination, setPagination] = React.useState({
        currentPage: 1,
        pageSize: 10
    });

    const [sortConfig, setSortConfig] = React.useState<{ key: string; order: "asc" | "desc" }>({
        key: "idPelanggan",
        order: "asc"
    });

    useEffect(() => {
        fetchCustomers();
        fetchConnections();
        fetchBranches();
        fetchAreas();
        fetchPackages();
        fetchAddons();
        fetchTaxes();
    }, []);

    const handleSearch = () => {
        setAppliedListFilters({ ...listFilterValues });
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const handleReset = () => {
        resetListFilters();
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const handlePageChange = (page: number) => {
        setPagination(prev => ({ ...prev, currentPage: page }));
    };

    const handlePageSizeChange = (size: number) => {
        setPagination(prev => ({ ...prev, pageSize: size, currentPage: 1 }));
    };

    const handleSort = (key: string) => {
        setSortConfig(prev => ({
            key,
            order: prev.key === key && prev.order === "asc" ? "desc" : "asc"
        }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const getConnection = (customerId: number) => connections.find(c => c.pelangganId === customerId);

    const filteredCustomers = useMemo(() => {
        return customers.filter(c => {
            if (appliedListFilters.branchId === "") return false;
            if (appliedListFilters.branchId !== "all") {
                if (c.area?.branchId?.toString() !== appliedListFilters.branchId) return false;
            }
            if (appliedListFilters.areaId && appliedListFilters.areaId !== "all") {
                if (c.areaId.toString() !== appliedListFilters.areaId) return false;
            }
            if (appliedListFilters.status && appliedListFilters.status !== "all") {
                if (c.statusPelanggan !== appliedListFilters.status) return false;
            }
            if (appliedListFilters.paketId && appliedListFilters.paketId !== "all") {
                const conn = getConnection(c.id);
                if (!conn || conn.paketId.toString() !== appliedListFilters.paketId) return false;
            }
            const searchTerm = appliedListFilters.search.toLowerCase();
            return (
                c.namaPelanggan.toLowerCase().includes(searchTerm) ||
                c.idPelanggan.toLowerCase().includes(searchTerm) ||
                c.teleponPelanggan.includes(searchTerm) ||
                c.identitasPelanggan.includes(searchTerm)
            );
        });
    }, [customers, connections, appliedListFilters]);

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

    const handleExportExcel = async () => {
        if (!sortedCustomers.length) {
            alert('Tidak ada data untuk diexport.');
            return;
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Opportunity');

        const rows = sortedCustomers.map((row, index) => {
            const conn = getConnection(row.id);
            const koord = row.latitude && row.longitude ? `${row.latitude}, ${row.longitude}` : "N/A";
            const telepon = row.teleponPelanggan ? String(row.teleponPelanggan) : "-";
            const identitas = row.identitasPelanggan ? String(row.identitasPelanggan) : "-";
            const tglAktif = row.tanggalAktif ? new Date(row.tanggalAktif).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : "-";

            const customerAddons = (row as any).customerAddons || [];
            const addonNames = customerAddons.length > 0 ? customerAddons.map((ca: any) => ca.addon?.name).filter(Boolean).join(", ") : "-";

            let taxInfo = "Tidak";
            if (row.useTax) {
                const tax = taxes.find(t => t.id === row.taxId);
                taxInfo = tax ? `${tax.name} (${tax.value}%)` : "Ya";
            }

            const branch = branches.find(b => b.id === row.area?.branchId);

            return [
                index + 1,
                row.idPelanggan,
                row.namaPelanggan,
                identitas,
                telepon,
                row.alamatPelanggan || "-",
                koord,
                conn?.paket?.namaPaket || "-",
                addonNames,
                taxInfo,
                row.diskon || 0,
                tglAktif,
                conn?.pppUsername || "-",
                conn?.pppPassword || "-",
                row.odp?.namaOdp || "-",
                row.odpPortId || "-",
                branch?.namaBranch || "-",
                row.area?.namaArea || "-",
                row.statusPelanggan
            ];
        });

        worksheet.addTable({
            name: 'OpportunityTable',
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
                { name: 'No. KTP', filterButton: true },
                { name: 'Telepon', filterButton: true },
                { name: 'Alamat', filterButton: true },
                { name: 'Koordinat', filterButton: false },
                { name: 'Paket', filterButton: true },
                { name: 'Add On', filterButton: true },
                { name: 'PPN', filterButton: true },
                { name: 'Diskon', filterButton: true },
                { name: 'Tanggal Aktif', filterButton: true },
                { name: 'PPP User', filterButton: true },
                { name: 'PPP Pass', filterButton: true },
                { name: 'ODP', filterButton: true },
                { name: 'Port', filterButton: true },
                { name: 'Cabang', filterButton: true },
                { name: 'Area', filterButton: true },
                { name: 'Status', filterButton: true }
            ],
            rows: rows,
        });

        // Auto-fit columns
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
        saveAs(new Blob([buffer]), `Opportunity_${timestamp}.xlsx`);
    };

    const columns = [
        {
            header: "ID Pelanggan",
            sortable: true,
            sortKey: "idPelanggan",
            render: (row: Customer) => <span className="text-sm">{row.idPelanggan}</span>
        },
        {
            header: "Nama Pelanggan",
            sortable: true,
            sortKey: "namaPelanggan",
            render: (row: Customer) => <span className="text-sm">{row.namaPelanggan}</span>
        },
        {
            header: "No. KTP",
            render: (row: Customer) => <span className="text-sm">{row.identitasPelanggan || "-"}</span>
        },
        {
            header: "Telepon",
            render: (row: Customer) => <span className="text-sm">{row.teleponPelanggan || "-"}</span>
        },
        {
            header: "Alamat",
            render: (row: Customer) => <span className="text-sm">{row.alamatPelanggan || "-"}</span>
        },
        {
            header: "Koordinat",
            render: (row: Customer) => <span className="text-sm">{row.latitude && row.longitude ? `${row.latitude}, ${row.longitude}` : "-"}</span>
        },
        {
            header: "Paket",
            render: (row: Customer) => {
                const conn = getConnection(row.id);
                return <span className="text-sm">{conn?.paket?.namaPaket || "-"}</span>;
            }
        },
        {
            header: "Add On",
            render: (row: any) => {
                const customerAddons = row.customerAddons || [];
                if (customerAddons.length === 0) return <span className="text-sm">-</span>;
                const addonNames = customerAddons.map((ca: any) => ca.addon?.name).filter(Boolean);
                return <span className="text-sm">{addonNames.join(", ") || "-"}</span>;
            }
        },
        {
            header: "PPN",
            render: (row: Customer) => {
                if (!row.useTax) return <span className="text-sm">Tidak</span>;
                const tax = taxes.find(t => t.id === row.taxId);
                return <span className="text-sm">{tax ? `${tax.name} (${tax.value}%)` : "Ya"}</span>;
            }
        },
        {
            header: "Diskon",
            render: (row: Customer) => <span className="text-sm">{row.diskon ? row.diskon.toLocaleString('id-ID') : "0"}</span>
        },
        {
            header: "Tanggal Aktif",
            render: (row: Customer) => <span className="text-sm">{row.tanggalAktif ? new Date(row.tanggalAktif).toLocaleDateString('id-ID') : "-"}</span>
        },
        {
            header: "PPP User",
            render: (row: Customer) => {
                const conn = getConnection(row.id);
                return <span className="text-sm">{conn?.pppUsername || "-"}</span>;
            }
        },
        {
            header: "PPP Pass",
            render: (row: Customer) => {
                const conn = getConnection(row.id);
                return <span className="text-sm">{conn?.pppPassword || "-"}</span>;
            }
        },
        {
            header: "ODP",
            render: (row: Customer) => <span className="text-sm">{row.odp?.namaOdp || "-"}</span>
        },
        {
            header: "Port",
            render: (row: Customer) => <span className="text-sm">{row.odpPortId || "-"}</span>
        },
        {
            header: "Cabang",
            render: (row: Customer) => {
                const branch = branches.find(b => b.id === row.area?.branchId);
                return <span className="text-sm">{branch?.namaBranch || "-"}</span>;
            }
        },
        {
            header: "Area",
            render: (row: Customer) => <span className="text-sm">{row.area?.namaArea || "-"}</span>
        },
        {
            header: "Status",
            sortable: true,
            sortKey: "statusPelanggan",
            render: (row: Customer) => <span className="text-sm">{row.statusPelanggan}</span>
        }
    ];

    const filteredAreas = areas.filter(a =>
        listFilterValues.branchId && listFilterValues.branchId !== "all"
            ? a.branchId.toString() === listFilterValues.branchId
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
                        placeholder: "Pilih Cabang",
                        value: listFilterValues.branchId,
                        type: "select",
                        options: [{ label: "Semua Cabang", value: "all" }, ...branches.map(b => ({ label: b.namaBranch, value: b.id.toString() }))],
                        loading: branchLoading,
                        onChange: (val: string) => setListFilterValues({ branchId: val, areaId: "" })
                    },
                    {
                        label: "Area",
                        placeholder: listFilterValues.branchId ? "Semua Area" : "Pilih Cabang dulu",
                        value: listFilterValues.areaId,
                        type: "select",
                        disabled: !listFilterValues.branchId,
                        options: [{ label: "Semua Area", value: "all" }, ...filteredAreas.map(a => ({ label: a.namaArea, value: a.id.toString() }))],
                        onChange: (val: string) => setListFilterValues({ areaId: val })
                    }
                ]}
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <CustomSelect
                        label="Paket"
                        placeholder={listFilterValues.branchId ? "Pilih Paket" : "Pilih Cabang dulu"}
                        value={listFilterValues.paketId}
                        options={[{ label: "Semua Paket", value: "all" }, ...packages.map(p => ({ label: p.namaPaket, value: p.id.toString() }))]}
                        onChange={(val) => setListFilterValues({ paketId: val })}
                        className="h-10"
                        disabled={!listFilterValues.branchId}
                    />
                    <CustomSelect
                        label="Status"
                        placeholder={listFilterValues.branchId ? "Status" : "Pilih Cabang dulu"}
                        value={listFilterValues.status}
                        options={[{ label: "Semua Status", value: "all" }, { label: "Aktif", value: "AKTIF" }, { label: "Isolir", value: "ISOLIR" }, { label: "Non-Aktif", value: "NONAKTIF" }]}
                        onChange={(val) => setListFilterValues({ status: val })}
                        className="h-10"
                        disabled={!listFilterValues.branchId}
                    />
                    <div className="w-full space-y-1">
                        <label className="text-[11px] font-bold text-slate-600 uppercase tracking-tighter ml-1 block">Cari</label>
                        <input
                            type="text"
                            className="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-sm text-slate-700 outline-none focus:ring-1 focus:ring-slate-200 transition-all disabled:bg-slate-50"
                            placeholder={listFilterValues.branchId ? "Cari..." : "Pilih Cabang dulu"}
                            value={listFilterValues.search}
                            onChange={(e) => setListFilterValues({ search: e.target.value })}
                            disabled={!listFilterValues.branchId}
                        />
                    </div>
                </div>
            </CustomFilter>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-1">
                <CustomTable
                    data={paginatedCustomers}
                    columns={columns}
                    loading={customerLoading}
                    emptyMessage={!appliedListFilters.branchId ? "Pilih Cabang terlebih dahulu." : "Tidak ada data."}
                    pagination={{ ...pagination, totalItems: filteredCustomers.length, onPageChange: handlePageChange, onPageSizeChange: handlePageSizeChange }}
                    sorting={{ sortKey: sortConfig.key, sortOrder: sortConfig.order, onSort: handleSort }}
                    enableSelection={false}
                />
            </div>
        </div>
    );
};

export default OpportunityListPage;
