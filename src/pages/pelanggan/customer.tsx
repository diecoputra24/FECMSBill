import React, { useEffect, useState } from "react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { useNavigate } from "react-router-dom";

import { createPortal } from "react-dom";
import { useCustomerStore } from "@/store/customerStore";
import { useBranchStore } from "@/store/branchStore";
import { useAuthStore } from "@/store/authStore";
import { useAreaStore } from "@/store/areaStore";
import { usePackageStore } from "@/store/packageStore";
import { CustomButton } from "@/components/ui/custom-button";
import { useOdpStore } from "@/store/odpStore";
import { useAddonStore } from "@/store/addonStore";
import { CustomInput, CustomTextArea, CustomCurrencyInput } from "@/components/ui/custom-input";
import { CustomDatePicker } from "@/components/ui/custom-datepicker";
import { Save, Search, Loader2, X, ArrowUpDown } from "lucide-react";
import api from "@/lib/api";
import { CustomTable } from "@/components/ui/custom-table";
import { CustomFilter } from "@/components/ui/custom-filter";
import { CustomSelect } from "@/components/ui/custom-select";
import { CustomSwitch } from "@/components/ui/custom-input";
import { useTaxStore } from "@/store/taxStore";

import { Badge } from "@/components/ui/badge";
import type { Customer } from "@/types/customer";

import { ModalDetail } from "@/components/ui/modal-detail";
import { ModalConfirm } from "@/components/ui/modal-confirm";
import { ModalMessage } from "@/components/ui/modal-message";

import { cn } from "@/lib/utils";
import { MapPicker } from "@/components/ui/map-picker";

// Helper Components for Custom Modal Layout
const InfoCard = ({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) => (
    <div className={cn("rounded-md overflow-hidden flex flex-col h-full bg-white", className)}>
        <div className="bg-slate-200 px-4 py-2">
            <h4 className="font-bold text-slate-700 text-sm tracking-tight">{title}</h4>
        </div>
        <div className="p-4 grid grid-cols-2 gap-y-4 gap-x-4 content-start bg-white">
            {children}
        </div>
    </div>
);

const InfoRow = ({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) => (
    <div className={cn("flex flex-col gap-1", className)}>
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
        <div className="text-sm font-medium text-slate-800 break-words leading-snug">
            {value || <span className="text-slate-300 italic font-normal text-xs">-</span>}
        </div>
    </div>
);

// Helper to generate Port options (1-16 usually for ODP)
const PORT_OPTIONS = Array.from({ length: 16 }, (_, i) => ({ label: `Port ${i + 1}`, value: (i + 1).toString() }));

const CustomerPage: React.FC = () => {
    const {
        customers,
        connections,
        loading,
        fetchCustomers,
        fetchConnections,
        filterValues,
        appliedFilters,
        sortConfig,
        setFilterValues,
        setAppliedFilters,
        setSortConfig,
        resetFilters,
        deleteCustomer,
        updateCustomer,
        createFormData,
        setCreateFormData,
        resetCreateFormData
    } = useCustomerStore();

    const { branches, fetchBranches, loading: branchLoading } = useBranchStore();
    const { areas, fetchAreas } = useAreaStore();
    const { packages, fetchPackages } = usePackageStore();
    const { odps, fetchOdps } = useOdpStore();
    const { addons, fetchAddons } = useAddonStore();
    const { taxes, fetchTaxes } = useTaxStore();
    const navigate = useNavigate();
    const { user } = useAuthStore();


    // Filtering logic for Edit Form
    const formFilteredAreas = areas.filter(a => a.branchId.toString() === createFormData.branchId);
    const formFilteredOdps = odps.filter(o => o.areaId.toString() === createFormData.areaId);

    // Auto-set branch filter if user has branchId
    // DEPRECATED: User requested to NOT auto-select ("jangan langsung dipilih")
    /*
    useEffect(() => {
        if (user?.branchId) {
            const branchIdStr = user.branchId.toString();
            // setFilterValues({ branchId: branchIdStr }); // Don't set here to avoid loop if not needed, but good for UI sync
            // Force apply it
            setAppliedFilters({ ...appliedFilters, branchId: branchIdStr });
            setFilterValues({ branchId: branchIdStr });
        }
    }, [user?.branchId, setAppliedFilters, setFilterValues]); 
    */


    // Calculate price for form display
    const selectedPacket = packages.find(p => p.id.toString() === createFormData.paketId);
    const hargaPaket = Number(selectedPacket?.hargaPaket || 0);
    const totalAddonPrice = createFormData.addonIds.reduce((sum, id) => {
        const addon = addons.find(a => a.id.toString() === id);
        return sum + (addon ? Number(addon.price) : 0);
    }, 0);
    const diskonValue = Number(createFormData.diskon) || 0;
    const totalHarga = Math.max(0, hargaPaket + totalAddonPrice - diskonValue);

    // TAX Calculation for Form
    const selectedTaxRate = taxes.find(t => t.id.toString() === createFormData.taxId);
    const taxAmount = (createFormData.useTax && selectedTaxRate)
        ? Math.round(totalHarga * (Number(selectedTaxRate.value) / 100))
        : 0;
    const totalBayarWithTax = totalHarga + taxAmount;

    // Modal State
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);


    // Selection & Delete State
    const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
    const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [messageConfig, setMessageConfig] = useState<{ type: "success" | "error", title: string, message: string }>({
        type: "success", title: "", message: ""
    });

    // Secrets Search Modal State
    const [isSecretsModalOpen, setIsSecretsModalOpen] = useState(false);
    const [availableSecrets, setAvailableSecrets] = useState<any[]>([]);
    const [isAddressSyncing, setIsAddressSyncing] = useState(false);
    const [secretsLoading, setSecretsLoading] = useState(false);
    const [secretsError, setSecretsError] = useState<string | null>(null);

    // Fetch Available Secrets
    const fetchAvailableSecrets = async () => {
        if (!createFormData.paketId) {
            setSecretsError("Pilih paket terlebih dahulu");
            setIsSecretsModalOpen(true);
            return;
        }

        const selectedPackage = packages.find(p => p.id.toString() === createFormData.paketId);
        if (!selectedPackage) {
            setSecretsError("Paket tidak ditemukan. Silakan pilih paket kembali.");
            setIsSecretsModalOpen(true);
            return;
        }

        if (!selectedPackage.routerId) {
            setSecretsError("Paket tidak memiliki konfigurasi router. Silakan pilih paket lain atau hubungi administrator.");
            setIsSecretsModalOpen(true);
            return;
        }

        setSecretsLoading(true);
        setSecretsError(null);
        setIsSecretsModalOpen(true);

        try {
            const response = await api.get(`/connection/available-secrets/${selectedPackage.routerId}`, {
                params: { profile: selectedPackage.mikrotikProfile }
            });
            setAvailableSecrets(Array.isArray(response.data) ? response.data : []);
        } catch (err: any) {
            setSecretsError(err.response?.data?.message || err.message || "Gagal mengambil data secrets");
            setAvailableSecrets([]);
        } finally {
            setSecretsLoading(false);
        }
    };

    // Secret search filter
    const [secretsSearch, setSecretsSearch] = useState("");

    // Handle Secret Selection
    const handleSelectSecret = (secret: any) => {
        if (!secret) return;
        setCreateFormData({
            pppUsername: secret.name,
            pppPassword: secret.password || '', // Password dari MikroTik
            pppService: secret.service || 'pppoe'
        });
        setIsSecretsModalOpen(false);
        setSecretsSearch("");
    };

    // Filtered secrets based on search
    // Filtered secrets based on search - with extra safety
    const filteredSecrets = (availableSecrets || []).filter(s => {
        if (!s) return false;
        const name = String(s.name || "").toLowerCase();
        const profile = String(s.profile || "").toLowerCase();
        const search = String(secretsSearch || "").toLowerCase();
        return name.includes(search) || profile.includes(search);
    });

    useEffect(() => {
        fetchBranches();
        fetchAreas();
        fetchPackages();
        fetchOdps();
        fetchAddons();
        fetchTaxes();
    }, [fetchBranches, fetchAreas, fetchPackages, fetchOdps, fetchAddons, fetchTaxes]);

    // Only fetch customers/connections when branch is applied via search button or if already viewing a branch
    useEffect(() => {
        if (appliedFilters.branchId !== "") {
            fetchCustomers();
            fetchConnections();
        }
    }, [appliedFilters.branchId, fetchCustomers, fetchConnections]);

    // Helper to find connection details for a customer
    const getConnection = (customerId: number) => connections.find(c => c.pelangganId === customerId);

    const handleSearch = () => {
        setAppliedFilters({ ...filterValues });
    };

    const handleReset = () => {
        resetFilters();
        setSelectedCustomerId(null);
    };

    const handleSort = (key: string) => {
        setSortConfig({
            key: key as keyof Customer,
            order: sortConfig.key === key && sortConfig.order === "asc" ? "desc" : "asc"
        });
    };

    // Selection Handlers
    const handleSelectionChange = (id: string | number | null) => {
        setSelectedCustomerId(id ? Number(id) : null);
    };



    const handleEditSelected = () => {
        if (!selectedCustomerId) return;
        const customer = customers.find(c => c.id === selectedCustomerId);
        if (customer) {
            const conn = getConnection(customer.id);
            setCreateFormData({
                idPelanggan: customer.idPelanggan,
                namaPelanggan: customer.namaPelanggan,
                identitasPelanggan: customer.identitasPelanggan,
                teleponPelanggan: customer.teleponPelanggan,
                alamatPelanggan: customer.alamatPelanggan,
                branchId: customer.area?.branchId.toString() || "",
                areaId: customer.areaId.toString(),
                odpId: customer.odpId?.toString() || "",
                odpPortId: customer.odpPortId?.toString() || "",
                paketId: conn?.paketId.toString() || "",
                secretMode: conn?.secretMode || "NEW",
                pppUsername: conn?.pppUsername || "",
                pppPassword: conn?.pppPassword || "",
                pppService: conn?.pppService || "pppoe",
                tanggalAktif: customer.tanggalAktif ? new Date(customer.tanggalAktif).toISOString() : "",
                tanggalAkhir: customer.tanggalAkhir ? new Date(customer.tanggalAkhir).toISOString() : "",
                tanggalToleransi: customer.tanggalToleransi ? new Date(customer.tanggalToleransi).toISOString() : "",
                diskon: customer.diskon?.toString() || "0",
                useTax: customer.useTax,
                taxId: customer.taxId?.toString() || "",
                latitude: customer.latitude?.toString() || "",
                longitude: customer.longitude?.toString() || "",
                addonIds: [] // Addons not pre-populated in this version
            });
            setIsEditModalOpen(true);
        }
    };

    const handleCloseEdit = () => {
        setIsEditModalOpen(false);
        resetCreateFormData();
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCustomerId) return;
        try {
            await updateCustomer(selectedCustomerId, createFormData);
            setIsEditModalOpen(false);
            resetCreateFormData();
            setSelectedCustomerId(null);
            setMessageConfig({ type: 'success', title: 'Berhasil', message: 'Data pelanggan berhasil diperbarui.' });
            setIsMessageModalOpen(true);
        } catch (error: any) {
            setMessageConfig({
                type: 'error',
                title: 'Gagal',
                message: error.message || 'Gagal memperbarui pelanggan.'
            });
            setIsMessageModalOpen(true);
        }
    };

    const handleDeleteSelected = () => {
        const customer = customers.find(c => c.id === selectedCustomerId);
        if (customer) {
            setCustomerToDelete(customer);
            setIsDeleteModalOpen(true);
        }
    };

    const confirmDelete = async () => {
        if (customerToDelete) {
            try {
                await deleteCustomer(customerToDelete.id);
                setIsDeleteModalOpen(false);
                setCustomerToDelete(null);
                setSelectedCustomerId(null);
                setMessageConfig({ type: 'success', title: 'Berhasil', message: 'Pelanggan berhasil dihapus.' });
                setIsMessageModalOpen(true);
            } catch (err) {
                setMessageConfig({ type: 'error', title: 'Gagal', message: 'Gagal menghapus pelanggan.' });
                setIsMessageModalOpen(true);
            }
        }
    };

    // Pagination State
    const [pagination, setPagination] = useState({
        currentPage: 1,
        pageSize: 10,
        totalItems: customers.length
    });

    useEffect(() => {
        setPagination(prev => ({ ...prev, totalItems: customers.length }));
    }, [customers]);

    const handlePageSizeChange = (size: number) => {
        setPagination(prev => ({ ...prev, pageSize: size, currentPage: 1 }));
    };

    const handlePageChange = (page: number) => {
        setPagination(prev => ({ ...prev, currentPage: page }));
    };

    // Filter and Sort Logic
    const filteredCustomers = customers.filter(c => {
        // Must match branch if selected
        // If not SUPERADMIN and no branch selected, show nothing
        if (appliedFilters.branchId === "") return false;

        // If branch selected (not "all"), must match
        if (appliedFilters.branchId !== "" && appliedFilters.branchId !== "all" && c.area?.branchId?.toString() !== appliedFilters.branchId) {
            return false;
        }

        // Filter by Area
        if (appliedFilters.areaId && appliedFilters.areaId !== "all") {
            if (c.areaId.toString() !== appliedFilters.areaId) return false;
        }

        // Filter by Status
        if (appliedFilters.status && appliedFilters.status !== "all") {
            if (c.statusPelanggan !== appliedFilters.status) return false;
        }

        // Filter by Package (requires finding connection first)
        if (appliedFilters.paketId && appliedFilters.paketId !== "all") {
            const conn = getConnection(c.id);
            if (!conn || conn.paketId.toString() !== appliedFilters.paketId) return false;
        }

        const searchTerm = appliedFilters.search.toLowerCase();
        return (
            c.namaPelanggan.toLowerCase().includes(searchTerm) ||
            c.identitasPelanggan.includes(searchTerm) ||
            c.teleponPelanggan.includes(searchTerm)
        );
    });

    const sortedCustomers = [...filteredCustomers].sort((a, b) => {
        const aValue = a[sortConfig.key] as string | number || "";
        const bValue = b[sortConfig.key] as string | number || "";

        const aString = aValue.toString().toLowerCase();
        const bString = bValue.toString().toLowerCase();

        if (sortConfig.order === "asc") {
            return aString.localeCompare(bString);
        } else {
            return bString.localeCompare(aString);
        }
    });

    const paginatedCustomers = sortedCustomers.slice(
        (pagination.currentPage - 1) * pagination.pageSize,
        pagination.currentPage * pagination.pageSize
    );

    const columns = [
        {
            header: "ID Pelanggan",
            sortable: true,
            sortKey: "idPelanggan",
            render: (row: Customer) => (
                <div className="text-slate-600 whitespace-nowrap">
                    {row.idPelanggan}
                </div>
            )
        },
        {
            header: "Nama",
            sortable: true,
            sortKey: "namaPelanggan",
            render: (row: Customer) => (
                <div className="text-slate-900 whitespace-nowrap uppercase font-bold">{row.namaPelanggan}</div>
            )
        },
        {
            header: "Telepon",
            sortable: true,
            sortKey: "teleponPelanggan",
            render: (row: Customer) => (
                <div className="text-slate-600 whitespace-nowrap">{row.teleponPelanggan}</div>
            )
        },
        {
            header: "Paket",
            render: (row: Customer) => {
                const conn = getConnection(row.id);
                return <div className="text-slate-600 whitespace-nowrap">{conn?.paket?.namaPaket || "-"}</div>;
            }
        },
        {
            header: "Area",
            render: (row: Customer) => (
                <div className="text-slate-600 whitespace-nowrap">{row.area?.namaArea || "-"}</div>
            )
        },
        {
            header: "Alamat",
            sortable: true,
            sortKey: "alamatPelanggan",
            render: (row: Customer) => (
                <div className="text-slate-600 whitespace-nowrap" title={row.alamatPelanggan}>
                    {row.alamatPelanggan}
                </div>
            )
        },
        {
            header: "Koord",
            render: (row: Customer) => (
                <div className="text-slate-600 whitespace-nowrap">
                    {row.latitude && row.longitude ? (
                        <a
                            href={`https://www.google.com/maps?q=${row.latitude},${row.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline font-medium text-[11px]"
                        >
                            {row.latitude.toFixed(4)}, {row.longitude.toFixed(4)}
                        </a>
                    ) : (
                        <span className="text-slate-300 italic text-[11px]">N/A</span>
                    )}
                </div>
            )
        },
        {
            header: "Diskon",
            render: (row: Customer) => {
                const diskon = Number(row.diskon || 0);
                if (diskon <= 0) return <div className="text-slate-400 whitespace-nowrap">-</div>;

                return (
                    <span className="text-green-600 font-medium text-[11px] whitespace-nowrap">
                        -Rp {diskon.toLocaleString('id-ID')}
                    </span>
                );
            }
        },

        {
            header: "Aktif",
            sortable: true,
            sortKey: "tanggalAktif",
            render: (row: Customer) => (
                <div className="text-slate-600 whitespace-nowrap">
                    {row.tanggalAktif ? new Date(row.tanggalAktif).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : "-"}
                </div>
            )
        },
        {
            header: "Akhir",
            sortable: true,
            sortKey: "tanggalAkhir",
            render: (row: Customer) => (
                <div className="text-slate-600 whitespace-nowrap">
                    {row.tanggalAkhir ? new Date(row.tanggalAkhir).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : "-"}
                </div>
            )
        },
        {
            header: "Status",
            sortable: true,
            sortKey: "statusPelanggan",
            render: (row: Customer) => {
                const statusColors: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
                    "AKTIF": "success",
                    "ISOLIR": "warning",
                    "NONAKTIF": "destructive"
                };
                return (
                    <div className="whitespace-nowrap">
                        <Badge variant={statusColors[row.statusPelanggan] || "secondary"}>
                            {row.statusPelanggan}
                        </Badge>
                    </div>
                );
            }
        }
    ];

    // Filter areas based on selected branch in filterValues (for the dropdown options)
    const filteredAreas = areas.filter(a =>
        filterValues.branchId && filterValues.branchId !== "all"
            ? a.branchId.toString() === filterValues.branchId
            : true
    );

    const handleRowClick = (customer: Customer) => {
        setSelectedCustomer(customer);
        setIsDetailOpen(true);
    };

    const handleExportExcel = async () => {
        if (!sortedCustomers.length) {
            setMessageConfig({ type: 'error', title: 'Perhatian', message: 'Tidak ada data untuk diexport.' });
            setIsMessageModalOpen(true);
            return;
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Data Pelanggan');

        const rows = sortedCustomers.map((row, index) => {
            const conn = getConnection(row.id);
            const koord = row.latitude && row.longitude ? `${row.latitude}, ${row.longitude}` : "N/A";
            const telepon = row.teleponPelanggan ? String(row.teleponPelanggan) : "-";
            const identitas = row.identitasPelanggan ? String(row.identitasPelanggan) : "-";
            const tglAktif = row.tanggalAktif ? new Date(row.tanggalAktif).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : "-";
            const tglAkhir = row.tanggalAkhir ? new Date(row.tanggalAkhir).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : "-";

            return [
                index + 1,
                row.idPelanggan,
                identitas,
                row.namaPelanggan,
                telepon,
                conn?.paket?.namaPaket || "-",
                row.area?.namaArea || "-",
                row.alamatPelanggan || "-",
                koord,
                row.diskon || 0,
                tglAktif,
                tglAkhir,
                row.statusPelanggan
            ];
        });

        worksheet.addTable({
            name: 'DataPelanggan',
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
                { name: 'Identitas', filterButton: true },
                { name: 'Nama', filterButton: true },
                { name: 'Telepon', filterButton: true },
                { name: 'Paket', filterButton: true },
                { name: 'Area', filterButton: true },
                { name: 'Alamat', filterButton: true },
                { name: 'Koord', filterButton: false },
                { name: 'Diskon', filterButton: true },
                { name: 'Tgl Aktif', filterButton: true },
                { name: 'Tgl Akhir', filterButton: true },
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
        saveAs(new Blob([buffer]), `Data_Pelanggan_${timestamp}.xlsx`);
    };


    return (
        <div className="space-y-4 pb-10">
            <CustomFilter
                onSearch={handleSearch}
                onReset={handleReset}
                onPrint={handleExportExcel}
                loading={loading}
                filters={[
                    {
                        label: "Filter Cabang",
                        placeholder: "Pilih Cabang",
                        value: filterValues.branchId,
                        type: "select",
                        options: [
                            { label: "Semua Cabang", value: "all" },
                            ...branches.map(b => ({ label: b.namaBranch, value: b.id.toString() }))
                        ],
                        loading: branchLoading,
                        // User requested to keep it open ("selectnya terbuka")
                        disabled: false,

                        onChange: (val: string) => setFilterValues({ branchId: val, areaId: "" }) // Reset area on branch change
                    },
                    {
                        label: "Filter Area",
                        placeholder: filterValues.branchId ? "Semua Area" : "Pilih Cabang dulu",
                        value: filterValues.areaId,
                        type: "select",
                        disabled: !filterValues.branchId,
                        options: [
                            { label: "Semua Area", value: "all" },
                            ...filteredAreas.map(a => ({ label: a.namaArea, value: a.id.toString() }))
                        ],
                        onChange: (val: string) => setFilterValues({ areaId: val })
                    }
                ]}
            >
                {/* Secondary Filters Grid - Bottom 3 Columns */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <CustomSelect
                        label="Filter Paket"
                        placeholder={filterValues.branchId ? "Pilih Paket" : "Pilih Cabang dulu"}
                        value={filterValues.paketId}
                        options={[
                            { label: "Semua Paket", value: "all" },
                            ...packages.map(p => ({ label: p.namaPaket, value: p.id.toString() }))
                        ]}
                        onChange={(val) => setFilterValues({ paketId: val })}
                        className="h-10"
                        disabled={!filterValues.branchId}
                    />

                    <CustomSelect
                        label="Status"
                        placeholder={filterValues.branchId ? "Status" : "Pilih Cabang dulu"}
                        value={filterValues.status}
                        options={[
                            { label: "Semua Status", value: "all" },
                            { label: "Aktif", value: "AKTIF" },
                            { label: "Isolir", value: "ISOLIR" },
                            { label: "Non-Aktif", value: "NONAKTIF" },
                        ]}
                        onChange={(val) => setFilterValues({ status: val })}
                        className="h-10"
                        disabled={!filterValues.branchId}
                    />

                    <div className="w-full space-y-1">
                        <label className="text-[11px] font-bold text-slate-600 uppercase tracking-tighter ml-1 block">
                            Cari Pelanggan
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                className="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/40 transition-all placeholder:text-slate-300 placeholder:font-normal disabled:bg-slate-50 disabled:cursor-not-allowed"
                                placeholder={filterValues.branchId ? "Nama, ID, atau No. Telepon..." : "Pilih Cabang dulu"}
                                value={filterValues.search}
                                onChange={(e) => setFilterValues({ search: e.target.value })}
                                disabled={!filterValues.branchId}
                            />
                        </div>
                    </div>
                </div>
            </CustomFilter>

            <CustomTable
                data={paginatedCustomers}
                columns={columns}
                loading={loading}
                emptyMessage={
                    !appliedFilters.branchId || appliedFilters.branchId === ""
                        ? "Silakan pilih Cabang terlebih dahulu untuk melihat data pelanggan."
                        : "Tidak ada data pelanggan ditemukan matching filter yang dipilih."
                }
                pagination={{
                    ...pagination,
                    totalItems: filteredCustomers.length,
                    onPageChange: handlePageChange,
                    onPageSizeChange: handlePageSizeChange
                }}
                sorting={{
                    sortKey: sortConfig.key,
                    sortOrder: sortConfig.order,
                    onSort: handleSort
                }}
                onRowClick={handleRowClick}
                enableSelection={true}
                selectedId={selectedCustomerId}
                onSelectionChange={handleSelectionChange}
                actionButtons={selectedCustomerId ? (
                    <>
                        {(user?.role === 'ADMIN' || user?.role === 'SUPERADMIN' || user?.role === 'FINANCE' || user?.permissions?.includes('customer.change')) && (
                            <CustomButton
                                variant="secondary"
                                size="sm"
                                className="h-8 shadow-sm bg-white border-slate-200 text-slate-600 hover:text-primary hover:bg-slate-50"
                                onClick={handleEditSelected}
                            >
                                Edit
                            </CustomButton>
                        )}
                        {(user?.role === 'ADMIN' || user?.role === 'SUPERADMIN' || user?.permissions?.includes('customer.delete')) && (
                            <CustomButton
                                variant="danger"
                                size="sm"
                                className="h-8 shadow-sm"
                                onClick={handleDeleteSelected}
                            >
                                Hapus
                            </CustomButton>
                        )}
                    </>
                ) : null}
            />

            {isEditModalOpen && createPortal(
                <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={handleCloseEdit} />
                    <div className="relative w-full max-w-5xl bg-white rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between shrink-0">
                            <h3 className="text-lg font-bold text-slate-800">Edit Pelanggan</h3>
                            <CustomButton size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600" onClick={handleCloseEdit}>
                                <span className="sr-only">Close</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </CustomButton>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 bg-white">
                            <form id="edit-customer-form" onSubmit={handleUpdate} className="space-y-8">
                                {/* Section 1: Data Pribadi */}
                                <div className="space-y-6">
                                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-2">Data Pribadi Pelanggan</h3>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <CustomInput label="ID Pelanggan" value={createFormData.idPelanggan} disabled className="bg-slate-100 text-slate-500" />
                                        <CustomInput label="Nama Lengkap" required value={createFormData.namaPelanggan} onChange={(e) => setCreateFormData({ namaPelanggan: e.target.value.toUpperCase() })} />
                                        <CustomInput label="Nomor KTP / Identitas" required value={createFormData.identitasPelanggan} onChange={(e) => setCreateFormData({ identitasPelanggan: e.target.value })} />
                                        <CustomInput label="Nomor Telepon / WA" required value={createFormData.teleponPelanggan} onChange={(e) => setCreateFormData({ teleponPelanggan: e.target.value })} />
                                        {/* Lokasi & Alamat - 2 Column Layout */}
                                        <div className="md:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {/* Kolom Kiri: Koordinat + Peta */}
                                            <div className="space-y-3">
                                                {/* <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                                                    Lokasi Pemasangan
                                                </label> */}

                                                {/* Lat/Lng Inputs */}
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Latitude</label>
                                                        <input
                                                            type="text"
                                                            value={createFormData.latitude}
                                                            onChange={(e) => setCreateFormData({ latitude: e.target.value })}
                                                            placeholder="-6.123456"
                                                            className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Longitude</label>
                                                        <input
                                                            type="text"
                                                            value={createFormData.longitude}
                                                            onChange={(e) => setCreateFormData({ longitude: e.target.value })}
                                                            placeholder="106.123456"
                                                            className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Map Picker - One Frame Interactive */}
                                                <div className="h-[240px] rounded-xl overflow-hidden border border-slate-200">
                                                    <MapPicker
                                                        lat={createFormData.latitude}
                                                        lng={createFormData.longitude}
                                                        autoAddress={createFormData.autoAddress}
                                                        onSyncChange={setIsAddressSyncing}
                                                        onLocationSelect={(lat, lng, address) => {
                                                            const updates: any = { latitude: lat, longitude: lng };
                                                            if (createFormData.autoAddress && address) {
                                                                updates.alamatPelanggan = address;
                                                            }
                                                            setCreateFormData(updates);
                                                        }}
                                                    />

                                                </div>

                                                {/* Google Maps Link */}
                                                {createFormData.latitude && createFormData.longitude && (
                                                    <a
                                                        href={`https://www.google.com/maps?q=${createFormData.latitude},${createFormData.longitude}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 text-[11px] font-semibold text-primary hover:underline"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                                                        Buka di Google Maps
                                                    </a >
                                                )}
                                            </div >

                                            {/* Kolom Kanan: Alamat */}
                                            < div className="space-y-1" >
                                                <div className="flex items-center justify-between mb-1">
                                                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                                                        Alamat Pemasangan <span className="text-red-500">*</span>
                                                    </label>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] text-slate-400">Auto dari Peta</span>
                                                        <CustomSwitch
                                                            checked={createFormData.autoAddress}
                                                            onChange={(checked) => setCreateFormData({ autoAddress: checked })}
                                                        />
                                                    </div>
                                                </div>
                                                <textarea
                                                    value={isAddressSyncing ? "Syncing address..." : createFormData.alamatPelanggan}
                                                    onChange={(e) => setCreateFormData({ alamatPelanggan: e.target.value })}
                                                    placeholder={createFormData.autoAddress ? "Alamat akan terisi otomatis dari peta..." : "Alamat lengkap pemasangan..."}
                                                    disabled={createFormData.autoAddress || isAddressSyncing}
                                                    className={`w-full min-h-[200px] px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all resize-none ${createFormData.autoAddress || isAddressSyncing ? "bg-slate-50 text-slate-500 italic" : ""}`}
                                                />

                                                {
                                                    createFormData.autoAddress && (
                                                        <p className="text-[10px] text-amber-600 italic">
                                                            ✓ Alamat akan diisi otomatis saat Anda memilih lokasi di peta.
                                                        </p>
                                                    )
                                                }
                                            </div >
                                        </div >
                                    </div >
                                </div >

                                {/* Section 2: Data Teknis */}
                                < div className="space-y-6" >
                                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-2">Data Teknis & Lokasi</h3>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <CustomSelect label="Cabang" required value={createFormData.branchId} onChange={(val) => setCreateFormData({ branchId: val, areaId: "", odpId: "", odpPortId: "" })} options={branches.map(b => ({ label: b.namaBranch, value: b.id.toString() }))} />
                                        <CustomSelect label="Area" required value={createFormData.areaId} onChange={(val) => setCreateFormData({ areaId: val, odpId: "", odpPortId: "" })} options={formFilteredAreas.map(a => ({ label: a.namaArea, value: a.id.toString() }))} placeholder={createFormData.branchId ? "Pilih Area" : "Pilih Cabang Dahulu"} disabled={!createFormData.branchId} />
                                        <CustomSelect label="ODP" value={createFormData.odpId} onChange={(val) => setCreateFormData({ odpId: val, odpPortId: "" })} options={formFilteredOdps.map(o => ({ label: o.namaOdp, value: o.id.toString() }))} placeholder={createFormData.areaId ? "Pilih ODP (Opsional)" : "Pilih Area Dahulu"} disabled={!createFormData.areaId} />
                                        <CustomSelect label="Port ODP" value={createFormData.odpPortId} onChange={(val) => setCreateFormData({ odpPortId: val })} options={PORT_OPTIONS} placeholder="Pilih Port (Opsional)" />
                                    </div>
                                </div >

                                {/* Section 3: Layanan */}
                                < div className="space-y-6" >
                                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-2">Layanan & Akun PPPoE</h3>

                                    {/* Paket Selection */}
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                        <CustomSelect label="Paket Layanan" required value={createFormData.paketId} onChange={(val) => setCreateFormData({ paketId: val, pppUsername: '', pppPassword: '', pppService: 'pppoe' })} options={packages.map(p => ({ label: `${p.router?.namaRouter || '-'} - ${p.namaPaket}`, value: p.id.toString() }))} />

                                        {/* Secret Mode Selection */}
                                        <div className="space-y-1">
                                            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-tighter ml-1 block">
                                                Mode Secret PPPoE
                                            </label>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    className={`flex-1 px-3 py-2 text-xs font-semibold rounded-lg border transition-all ${createFormData.secretMode === 'NEW'
                                                        ? 'bg-primary text-white border-primary shadow-sm'
                                                        : 'bg-white text-slate-600 border-slate-200 hover:border-primary/50'
                                                        }`}
                                                    onClick={() => setCreateFormData({ secretMode: 'NEW', pppUsername: '', pppPassword: '' })}
                                                >
                                                    Buat Baru
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`flex-1 px-3 py-2 text-xs font-semibold rounded-lg border transition-all ${createFormData.secretMode === 'EXISTING'
                                                        ? 'bg-primary text-white border-primary shadow-sm'
                                                        : 'bg-white text-slate-600 border-slate-200 hover:border-primary/50'
                                                        }`}
                                                    onClick={() => setCreateFormData({ secretMode: 'EXISTING', pppUsername: '', pppPassword: '' })}
                                                >
                                                    Pakai Existing
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`flex-1 px-3 py-2 text-xs font-semibold rounded-lg border transition-all ${createFormData.secretMode === 'NONE'
                                                        ? 'bg-slate-500 text-white border-slate-500 shadow-sm'
                                                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                                                        }`}
                                                    onClick={() => setCreateFormData({ secretMode: 'NONE', pppUsername: '', pppPassword: '', pppService: '' })}
                                                >
                                                    Tanpa Secret
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* PPP Fields - Only show if not NONE */}
                                    {
                                        createFormData.secretMode !== 'NONE' && (
                                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
                                                {createFormData.secretMode === 'EXISTING' ? (
                                                    <>
                                                        <div className="space-y-1">
                                                            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-tighter ml-1 block">
                                                                Username PPPoE <span className="text-red-500">*</span>
                                                            </label>
                                                            <div className="flex gap-2">
                                                                <input
                                                                    type="text"
                                                                    className="flex-1 h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm font-medium text-slate-500 outline-none cursor-not-allowed"
                                                                    value={createFormData.pppUsername}
                                                                    onChange={(e) => setCreateFormData({ pppUsername: e.target.value })}
                                                                    placeholder="Pilih username via search..."
                                                                    required
                                                                    readOnly
                                                                />
                                                                <button
                                                                    type="button"
                                                                    className="h-10 px-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-1"
                                                                    title="Cari secret yang tersedia di MikroTik"
                                                                    onClick={fetchAvailableSecrets}
                                                                >
                                                                    <Search size={16} />
                                                                </button>
                                                            </div>
                                                            <p className="text-[10px] text-slate-400 ml-1">Klik tombol search untuk memilih dari daftar secret yang tersedia</p>
                                                        </div>
                                                        <CustomInput
                                                            label="Password PPPoE"
                                                            required
                                                            value={createFormData.pppPassword}
                                                            onChange={(e) => setCreateFormData({ pppPassword: e.target.value })}
                                                            placeholder="Password akan terisi otomatis"
                                                            disabled={createFormData.secretMode === 'EXISTING'}
                                                        />
                                                        <CustomSelect
                                                            label="Service"
                                                            value={createFormData.pppService}
                                                            onChange={(val) => setCreateFormData({ pppService: val })}
                                                            disabled={createFormData.secretMode === 'EXISTING'}
                                                            options={[
                                                                { label: 'PPPoE', value: 'pppoe' },
                                                                { label: 'Any', value: 'any' },
                                                                { label: 'L2TP', value: 'l2tp' },
                                                                { label: 'PPTP', value: 'pptp' },
                                                                { label: 'OVPN', value: 'ovpn' },
                                                            ]}
                                                        />
                                                    </>
                                                ) : (
                                                    <>
                                                        <CustomInput label="Username PPPoE" required value={createFormData.pppUsername} onChange={(e) => setCreateFormData({ pppUsername: e.target.value })} placeholder="Masukkan username baru" />
                                                        <CustomInput label="Password PPPoE" required value={createFormData.pppPassword} onChange={(e) => setCreateFormData({ pppPassword: e.target.value })} placeholder="Masukkan password" />
                                                        <CustomSelect
                                                            label="Service"
                                                            value={createFormData.pppService}
                                                            onChange={(val) => setCreateFormData({ pppService: val })}
                                                            options={[
                                                                { label: 'PPPoE', value: 'pppoe' },
                                                                { label: 'Any', value: 'any' },
                                                                { label: 'L2TP', value: 'l2tp' },
                                                                { label: 'PPTP', value: 'pptp' },
                                                                { label: 'OVPN', value: 'ovpn' },
                                                            ]}
                                                        />
                                                    </>
                                                )}
                                            </div>
                                        )
                                    }

                                    {/* Info for NONE mode */}
                                    {
                                        createFormData.secretMode === 'NONE' && (
                                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                                <p className="text-sm text-amber-700 font-medium">
                                                    ⚠️ Mode Tanpa Secret: Pelanggan ini tidak akan memiliki akun PPPoE di MikroTik.
                                                    Cocok untuk pelanggan yang menggunakan koneksi lain (static IP, DHCP, dll).
                                                </p>
                                            </div>
                                        )
                                    }
                                </div >

                                {/* Section 4: PPN & Pajak */}
                                < div className="space-y-6" >
                                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-2">PPN & Pajak</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-6 rounded-xl border border-slate-100">
                                        <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-700">Gunakan PPN</span>
                                                <span className="text-[10px] text-slate-500 tracking-tight uppercase font-semibold">Aktifkan pajak</span>
                                            </div>
                                            <CustomSwitch
                                                checked={createFormData.useTax}
                                                onChange={(checked) => setCreateFormData({ useTax: checked, taxId: checked ? createFormData.taxId : "" })}
                                            />
                                        </div>
                                        {createFormData.useTax && (
                                            <CustomSelect
                                                label="Pilih Aturan PPN"
                                                required={createFormData.useTax}
                                                value={createFormData.taxId}
                                                onChange={(val) => setCreateFormData({ taxId: val })}
                                                options={taxes.filter(t => t.isActive).map(t => ({ label: `${t.name} (${t.value}%)`, value: t.id.toString() }))}
                                                placeholder="Pilih Aturan Pajak"
                                            />
                                        )}
                                    </div>
                                </div >

                                {/* Section 5: Diskon & Ringkasan */}
                                < div className="space-y-6" >
                                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-2">Ringkasan Biaya</h3>
                                    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                                        <CustomInput label="Subtotal" value={`Rp ${(hargaPaket + totalAddonPrice).toLocaleString('id-ID')}`} disabled className="bg-slate-100 text-slate-600 font-bold" />
                                        <CustomCurrencyInput label="Diskon (Rp)" value={createFormData.diskon} onValueChange={(val) => setCreateFormData({ diskon: val })} />
                                        <CustomInput label="PPN" value={createFormData.useTax ? `Rp ${taxAmount.toLocaleString('id-ID')}` : "Rp 0"} disabled className="bg-slate-100 text-slate-600 font-bold" />
                                        <CustomInput label="Total Bayar" value={`Rp ${totalBayarWithTax.toLocaleString('id-ID')}`} disabled className="bg-primary/5 text-primary font-black border-primary/20" />
                                    </div>
                                </div >

                                {/* Section 5: Tanggal */}
                                < div className="space-y-6" >
                                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-2">Informasi Penagihan</h3>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <CustomDatePicker label="Tanggal Aktif" value={createFormData.tanggalAktif} onChange={(val) => setCreateFormData({ tanggalAktif: val })} />
                                        <CustomDatePicker label="Tanggal Akhir / Jatuh Tempo" value={createFormData.tanggalAkhir} onChange={(val) => setCreateFormData({ tanggalAkhir: val, tanggalToleransi: val })} />
                                    </div>
                                </div >
                            </form >
                        </div >
                        <div className="px-6 py-4 border-t border-slate-100 bg-white flex justify-end gap-2 shrink-0">
                            <CustomButton variant="secondary" onClick={handleCloseEdit} size="sm" className="h-8 px-4 font-semibold text-xs border-slate-200 bg-white text-slate-600 hover:bg-slate-50">Batal</CustomButton>
                            <CustomButton type="submit" form="edit-customer-form" variant="primary" size="sm" className="h-8 px-4 font-bold text-xs shadow-sm" disabled={loading}>
                                <Save size={14} className="mr-2" /> Simpan Perubahan
                            </CustomButton>
                        </div>
                    </div >
                </div >,
                document.body
            )}

            <ModalDetail
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                title={`Detail Pelanggan - ${selectedCustomer?.namaPelanggan || ""}`}
                onConfirm={() => setIsDetailOpen(false)}
                confirmLabel="Tutup"
                cancelLabel=""
                maxWidth="full"
            >
                {selectedCustomer && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Kolom 1: Data Pribadi */}
                        <div className="space-y-6">
                            <InfoCard title="Data Pribadi Pelanggan">
                                <InfoRow label="ID Pelanggan" value={<span className="font-mono font-bold text-slate-700">{selectedCustomer.idPelanggan}</span>} />
                                <InfoRow label="Nama Lengkap" value={selectedCustomer.namaPelanggan} />
                                <InfoRow label="Identitas (KTP)" value={selectedCustomer.identitasPelanggan} />
                                <InfoRow label="No. Telepon" value={selectedCustomer.teleponPelanggan} />
                                <InfoRow label="Status" value={
                                    <Badge variant={
                                        selectedCustomer.statusPelanggan === "AKTIF" ? "success" :
                                            selectedCustomer.statusPelanggan === "ISOLIR" ? "warning" : "destructive"
                                    }>
                                        {selectedCustomer.statusPelanggan}
                                    </Badge>
                                } />
                                <InfoRow label="Alamat" value={selectedCustomer.alamatPelanggan} className="col-span-2" />
                                <div className="col-span-2 grid grid-cols-2 gap-4 mt-1 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <InfoRow label="Latitude" value={selectedCustomer.latitude ? selectedCustomer.latitude.toString() : "-"} />
                                    <InfoRow label="Longitude" value={selectedCustomer.longitude ? selectedCustomer.longitude.toString() : "-"} />
                                    {selectedCustomer.latitude && selectedCustomer.longitude && (
                                        <div className="col-span-2">
                                            <a
                                                href={`https://www.google.com/maps?q=${selectedCustomer.latitude},${selectedCustomer.longitude}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[11px] text-primary hover:underline font-bold flex items-center gap-1 mt-1"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="10" r="3" /><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z" /></svg>
                                                Buka di Google Maps
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </InfoCard>
                        </div>

                        {/* Kolom 2: Data Teknis & Lokasi (Combined) */}
                        <div className="space-y-6">
                            <InfoCard title="Data Teknis & Lokasi">
                                <InfoRow label="Cabang" value={
                                    selectedCustomer.area?.branchId
                                        ? branches.find(b => b.id === selectedCustomer.area!.branchId)?.namaBranch || "-"
                                        : "-"
                                } />
                                <InfoRow label="Area / Wilayah" value={selectedCustomer.area?.namaArea || "-"} />
                                <InfoRow label="ODP" value={
                                    selectedCustomer.odp?.namaOdp ||
                                    (selectedCustomer.odpId ? odps.find(o => o.id === selectedCustomer.odpId)?.namaOdp : "-") || "-"
                                } />
                                <InfoRow label="Port" value={selectedCustomer.odpPortId ? `Port ${selectedCustomer.odpPortId}` : "-"} />

                                <div className="col-span-2 my-1 border-t border-dashed border-slate-200" />

                                {(() => {
                                    const conn = getConnection(selectedCustomer.id);
                                    return (
                                        <>
                                            <InfoRow label="Username PPPoE" value={<span className="font-mono text-primary font-medium">{conn?.pppUsername || "-"}</span>} />
                                            <InfoRow label="Password PPPoE" value={<span className="font-mono text-slate-500">{conn?.pppPassword || "-"}</span>} />
                                        </>
                                    );
                                })()}
                            </InfoCard>
                        </div>

                        {/* Kolom 3: Layanan, Tagihan & Tanggal (Combined) */}
                        <div className="space-y-6">
                            <InfoCard title="Layanan, Tagihan & Informasi">
                                {(() => {
                                    const conn = getConnection(selectedCustomer.id);
                                    const diskon = selectedCustomer.diskon || 0;
                                    const hargaPaket = Number(conn?.paket?.hargaPaket || 0);
                                    const total = hargaPaket - diskon;
                                    const taxValue = Number(selectedCustomer.tax?.value || 0);
                                    const taxAmount = selectedCustomer.useTax ? Math.round(total * (taxValue / 100)) : 0;
                                    const grandTotal = total + taxAmount;

                                    return (
                                        <>
                                            <div className="col-span-2 flex items-center justify-between">
                                                <InfoRow label="Paket Utama" value={conn?.paket?.namaPaket || "-"} />
                                                {(user?.role === 'ADMIN' || user?.role === 'SUPERADMIN' || user?.role === 'FINANCE' || user?.permissions?.includes('customer.upgrade')) && (
                                                    <button
                                                        onClick={() => {
                                                            setIsDetailOpen(false);
                                                            navigate(`/pelanggan/upgrade?id=${selectedCustomer.id}`);
                                                        }}
                                                        className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary rounded-lg text-[10px] font-bold hover:bg-primary/20 transition-all border border-primary/10"
                                                    >
                                                        <ArrowUpDown size={12} />
                                                        UPGRADE
                                                    </button>
                                                )}
                                            </div>

                                            <InfoRow label="Kecepatan" value={conn?.paket ? `Up to ${conn.paket.namaPaket}` : "-"} />
                                            <InfoRow label="Harga Paket" value={`Rp ${hargaPaket.toLocaleString('id-ID')}`} />

                                            <InfoRow
                                                label="Diskon & Promo"
                                                value={diskon > 0 ? <span className="text-green-600 font-bold">- Rp {diskon.toLocaleString('id-ID')}</span> : "-"}
                                            />

                                            {selectedCustomer.useTax && (
                                                <InfoRow
                                                    label={`PPN (${taxValue}%)`}
                                                    value={<span className="text-slate-700 font-bold">+ Rp {taxAmount.toLocaleString('id-ID')}</span>}
                                                />
                                            )}

                                            <div className="col-span-2 my-1 border-t border-dashed border-slate-200" />

                                            <InfoRow
                                                label="Total Tagihan"
                                                value={<span className="text-lg font-bold text-primary">Rp {grandTotal.toLocaleString('id-ID')}</span>}
                                                className="col-span-2"
                                            />

                                            <div className="col-span-2 my-1 border-t border-dashed border-slate-200" />

                                            <InfoRow label="Tanggal Aktif" value={selectedCustomer.tanggalAktif ? new Date(selectedCustomer.tanggalAktif).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : "-"} />
                                            <InfoRow label="Jatuh Tempo" value={selectedCustomer.tanggalAkhir ? `Tanggal ${new Date(selectedCustomer.tanggalAkhir).getDate()} setiap bulan` : (selectedCustomer.tanggalAktif ? `Tanggal ${new Date(selectedCustomer.tanggalAktif).getDate()} setiap bulan` : "-")} />
                                        </>
                                    );
                                })()}
                            </InfoCard>
                        </div>
                    </div >
                )}
            </ModalDetail >

            <ModalConfirm
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                variant="danger"
                title="Hapus Pelanggan?"
                message={`Pelanggan "${customerToDelete?.namaPelanggan}" akan dihapus permanen. Data koneksi terkait juga akan dihapus.`}
                confirmLabel="Ya, Hapus"
                loading={loading}
            />

            <ModalMessage
                isOpen={isMessageModalOpen}
                onClose={() => setIsMessageModalOpen(false)}
                type={messageConfig.type}
                title={messageConfig.title}
                message={messageConfig.message}
            />

            {/* Secrets Search Modal */}
            {
                isSecretsModalOpen && createPortal(
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => { setIsSecretsModalOpen(false); setSecretsSearch(""); }} />
                        <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-200">
                            {/* Header with Search */}
                            <div className="px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between shrink-0">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">Pilih Secret PPPoE</h3>
                                    <p className="text-xs text-slate-500">Daftar secret yang tersedia di MikroTik dan belum digunakan</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {/* Search Input */}
                                    <div className="relative">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Cari username/profile..."
                                            className="h-9 pl-9 pr-4 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 w-[200px]"
                                            value={secretsSearch}
                                            onChange={(e) => setSecretsSearch(e.target.value)}
                                        />
                                    </div>
                                    <button
                                        className="h-8 w-8 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                                        onClick={() => { setIsSecretsModalOpen(false); setSecretsSearch(""); }}
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto">
                                {secretsLoading ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                        <Loader2 size={32} className="animate-spin mb-3" />
                                        <p className="text-sm">Mengambil data dari MikroTik...</p>
                                    </div>
                                ) : secretsError ? (
                                    <div className="p-6">
                                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                                            <p className="text-sm text-red-600 font-medium">{secretsError}</p>
                                        </div>
                                    </div>
                                ) : (availableSecrets?.length || 0) === 0 ? (
                                    <div className="text-center py-12 text-slate-400">
                                        <Search size={48} className="mx-auto mb-3 opacity-50" />
                                        <p className="text-sm font-medium">Tidak ada secret yang tersedia</p>
                                        <p className="text-xs">Semua secret dengan profile ini sudah digunakan</p>
                                    </div>
                                ) : (
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 sticky top-0">
                                            <tr className="border-b border-slate-200">
                                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Username</th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Password</th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Profile</th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Service</th>
                                                <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wider w-[100px]">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredSecrets.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                                                        <p className="text-sm">Tidak ada hasil untuk "{secretsSearch}"</p>
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredSecrets.map((secret) => (
                                                    <tr key={secret.id || secret.name} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-4 py-3">
                                                            <span className="font-mono font-semibold text-slate-700">{secret.name}</span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className="font-mono text-slate-500">
                                                                {secret.password || <span className="text-slate-300 italic">-</span>}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-50 text-blue-600">{secret.profile}</span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className="text-slate-600">{secret.service}</span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <button
                                                                type="button"
                                                                className="px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                                                                onClick={() => handleSelectSecret(secret)}
                                                            >
                                                                Pilih
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 shrink-0 flex items-center justify-between">
                                <p className="text-xs text-slate-500">
                                    Menampilkan <strong>{filteredSecrets?.length || 0}</strong> dari <strong>{availableSecrets?.length || 0}</strong> secret
                                </p>
                                <button
                                    type="button"
                                    className="px-4 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                                    onClick={() => { setIsSecretsModalOpen(false); setSecretsSearch(""); }}
                                >
                                    Tutup
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }
        </div >
    );
};
export default CustomerPage;
