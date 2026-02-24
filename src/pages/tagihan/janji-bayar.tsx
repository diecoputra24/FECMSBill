import { useEffect, useState } from "react";
import { useInvoiceStore } from "@/store/invoiceStore";
import { CustomTable } from "@/components/ui/custom-table";
import { CustomButton } from "@/components/ui/custom-button";
import { CustomFilter } from "@/components/ui/custom-filter";
import { cn } from "@/lib/utils";
import {
    MessageCircle,
    XCircle
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import type { PromiseToPay } from "@/types/invoice";

const PromiseToPayPage: React.FC = () => {
    const { fetchPromises, deletePromise, loading } = useInvoiceStore();
    const [promises, setPromises] = useState<PromiseToPay[]>([]);

    // Filter State
    const [filterValues, setFilterValues] = useState({
        search: "",
        status: "ALL",
        startDate: "",
        endDate: ""
    });
    const [appliedFilters, setAppliedFilters] = useState(filterValues);

    const loadData = async () => {
        try {
            const data = await fetchPromises();
            setPromises(data);
        } catch (error) {
            console.error("Failed to fetch promises", error);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Helper to handle filter application
    const handleFilterApply = (values: any) => {
        setAppliedFilters(values);
    };

    const handleFilterReset = () => {
        setFilterValues({ search: "", status: "ALL", startDate: "", endDate: "" });
        setAppliedFilters({ search: "", status: "ALL", startDate: "", endDate: "" });
    };

    const filteredPromises = promises.filter(p => {
        const matchesSearch = p.customer?.namaPelanggan.toLowerCase().includes(appliedFilters.search.toLowerCase()) ||
            p.customer?.idPelanggan.toLowerCase().includes(appliedFilters.search.toLowerCase());

        const matchesStatus = appliedFilters.status === "ALL" || p.status === appliedFilters.status;

        // Date range filtering (optional implementation based on promiseDate)
        let matchesDate = true;
        if (appliedFilters.startDate) {
            matchesDate = matchesDate && new Date(p.promiseDate) >= new Date(appliedFilters.startDate);
        }
        if (appliedFilters.endDate) {
            matchesDate = matchesDate && new Date(p.promiseDate) <= new Date(appliedFilters.endDate);
        }

        return matchesSearch && matchesStatus && matchesDate;
    });

    const getStatusElement = (status: string, promiseDate: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const pDate = new Date(promiseDate);
        pDate.setHours(0, 0, 0, 0);

        const isExpired = today > pDate && status === 'WAITING';
        const isLastDay = today.getTime() === pDate.getTime() && status === 'WAITING';

        if (isExpired) {
            return (
                <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold border uppercase whitespace-nowrap text-red-600 bg-red-50 border-red-100")}>
                    INGKAR JANJI
                </span>
            );
        }

        if (isLastDay) {
            return (
                <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold border uppercase whitespace-nowrap text-yellow-700 bg-yellow-50 border-yellow-100")}>
                    HARI TERAKHIR
                </span>
            );
        }

        switch (status) {
            case 'PAID':
                return (
                    <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold border uppercase whitespace-nowrap text-green-600 bg-green-50 border-green-100")}>
                        LUNAS
                    </span>
                );
            case 'WAITING':
                return (
                    <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold border uppercase whitespace-nowrap text-blue-600 bg-blue-50 border-blue-100")}>
                        MENUNGGU
                    </span>
                );
            case 'BROKEN':
                return (
                    <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold border uppercase whitespace-nowrap text-slate-500 bg-slate-50 border-slate-100")}>
                        DIBATALKAN
                    </span>
                );
            default:
                return <span>{status}</span>;
        }
    };

    return (
        <div className="space-y-4 pb-10 animate-in fade-in duration-500">
            {/* Custom Filter */}
            <CustomFilter
                onSearch={() => handleFilterApply(filterValues)}
                onReset={handleFilterReset}
                filters={[
                    {
                        label: "CARI PELANGGAN",
                        placeholder: "Nama / ID Pelanggan...",
                        value: filterValues.search,
                        onChange: (val) => setFilterValues(prev => ({ ...prev, search: val })),
                        type: "text"
                    },
                    {
                        label: "STATUS",
                        placeholder: "Semua Status",
                        value: filterValues.status,
                        onChange: (val) => setFilterValues(prev => ({ ...prev, status: val })),
                        type: "select",
                        options: [
                            { value: "ALL", label: "SEMUA STATUS" },
                            { value: "WAITING", label: "MENUNGGU" },
                            { value: "PAID", label: "LUNAS" },
                            { value: "BROKEN", label: "DIBATALKAN" },
                        ]
                    },
                    {
                        label: "PERIODE JANJI",
                        placeholder: "Pilih Periode",
                        value: filterValues.startDate,
                        endDate: filterValues.endDate,
                        onChange: (val) => setFilterValues(prev => ({ ...prev, startDate: val })),
                        onEndDateChange: (val) => setFilterValues(prev => ({ ...prev, endDate: val })),
                        type: "daterange"
                    }
                ]}
            />

            <CustomTable
                loading={loading}
                data={filteredPromises}
                emptyMessage="Tidak ada data janji bayar ditemukan."
                columns={[
                    {
                        header: "ID PELANGGAN",
                        className: "whitespace-nowrap w-[120px]",
                        render: (row) => (
                            <span className="text-[12px] text-slate-700 font-mono uppercase">
                                {row.customer?.idPelanggan || "-"}
                            </span>
                        )
                    },
                    {
                        header: "NAMA PELANGGAN",
                        className: "whitespace-nowrap",
                        render: (row) => (
                            <span className="text-[12px] text-slate-700 uppercase tracking-tight font-bold">
                                {row.customer?.namaPelanggan || "-"}
                            </span>
                        )
                    },
                    {
                        header: "NOMINAL TAGIHAN",
                        className: "whitespace-nowrap",
                        render: (row) => (
                            <span className="text-[12px] text-slate-700 font-mono">
                                Rp {Number(row.invoice?.amount || 0).toLocaleString('id-ID')}
                            </span>
                        )
                    },
                    {
                        header: "TGL JANJI",
                        className: "whitespace-nowrap",
                        render: (row) => (
                            <span className="text-[12px] text-slate-700 font-bold uppercase">
                                {format(new Date(row.promiseDate), "dd MMM yyyy", { locale: id })}
                            </span>
                        )
                    },
                    {
                        header: "STATUS",
                        className: "whitespace-nowrap text-center",
                        render: (row) => getStatusElement(row.status, row.promiseDate)
                    },
                    {
                        header: "CATATAN",
                        className: "max-w-[200px]",
                        render: (row) => (
                            <div className="text-[11px] text-slate-500 italic truncate" title={row.note}>
                                {row.note || "-"}
                            </div>
                        )
                    },
                    {
                        header: "AKSI",
                        className: "text-right whitespace-nowrap",
                        render: (row) => (
                            <div className="flex justify-end gap-2">
                                <CustomButton
                                    size="sm"
                                    variant="secondary"
                                    className="h-7 px-3 bg-green-50 text-green-600 border-green-100 hover:bg-green-100 hover:text-green-700 font-bold gap-1.5 shadow-sm rounded text-[10px] uppercase"
                                    onClick={() => {
                                        const phone = row.customer?.teleponPelanggan?.replace(/^0/, '62');
                                        const msg = `Halo Bapak/Ibu ${row.customer?.namaPelanggan}, kami mengingatkan kembali janji pembayaran internet sebesar Rp ${Number(row.invoice?.amount || 0).toLocaleString('id-ID')} pada tanggal ${format(new Date(row.promiseDate), 'dd MMMM yyyy', { locale: id })}. Terima kasih.`;
                                        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
                                    }}
                                >
                                    <MessageCircle size={12} />
                                    WA
                                </CustomButton>

                                <CustomButton
                                    size="sm"
                                    variant="secondary"
                                    className="h-7 px-3 bg-red-50 text-red-600 border-red-100 hover:bg-red-100 hover:text-red-700 font-bold gap-1.5 shadow-sm rounded text-[10px] uppercase"
                                    onClick={async () => {
                                        if (window.confirm(`Hapus/Batalkan janji bayar ${row.customer?.namaPelanggan}?`)) {
                                            try {
                                                await deletePromise(row.id);
                                                loadData();
                                            } catch (error: any) {
                                                alert("Gagal membatalkan janji: " + error.message);
                                            }
                                        }
                                    }}
                                >
                                    <XCircle size={12} />
                                    {row.status === 'WAITING' ? 'Batal' : 'Hapus'}
                                </CustomButton>
                            </div>
                        )
                    }
                ]}
            />
        </div>
    );
};

export default PromiseToPayPage;
